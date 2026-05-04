import { ProductStatus, UserRole } from "@prisma/client";
import { client } from "../../../prisma/index";
import { isR2Configured, uploadProductImage } from "../../core/r2";
import {
  badRequest,
  json,
  notFound,
  registerRoute,
  requireRole,
  unauthorized,
} from "../../core/router";
import { notifyAdminsNewProductQueued } from "../emails/notifications";

const prisma = client;
type ProductCategoryValue =
  | "FESTIVAL_GIFTS"
  | "ANNIVERSARY_GIFTS"
  | "PERSONALISED_GIFTS"
  | "BIRTHDAY_GIFTS";

const FIXED_PRODUCT_CATEGORIES: ProductCategoryValue[] = [
  "FESTIVAL_GIFTS",
  "ANNIVERSARY_GIFTS",
  "PERSONALISED_GIFTS",
  "BIRTHDAY_GIFTS",
];

function parseCategory(raw: unknown): ProductCategoryValue | null {
  if (typeof raw !== "string") return null;
  const normalized = raw.trim().toUpperCase();
  if (FIXED_PRODUCT_CATEGORIES.includes(normalized as ProductCategoryValue)) {
    return normalized as ProductCategoryValue;
  }
  return null;
}

function getExt(name: string, type: string): string {
  const n = (name || "").toLowerCase();
  if (n.endsWith(".jpg") || n.endsWith(".jpeg") || type === "image/jpeg") return ".jpg";
  if (n.endsWith(".png") || type === "image/png") return ".png";
  if (n.endsWith(".webp") || type === "image/webp") return ".webp";
  if (n.endsWith(".gif") || type === "image/gif") return ".gif";
  return ".jpg";
}

function mimeForExt(ext: string): string {
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

// Vendor creates product (JSON or multipart with images)
registerRoute(
  "POST",
  "/vendors/products",
  requireRole(async ({ req, user }) => {
    if (!user) return unauthorized();

    const contentType = req.headers.get("content-type") ?? "";
    let name: string | undefined;
    let category: ProductCategoryValue | null = null;
    let description: string | null = null;
    let basePrice: number | undefined;
    let discountPrice: number | null = null;
    let stockQuantity = 0;
    let minOrderQuantity = 1;
    let maxOrderQuantity: number | null = null;
    let currency = "INR";
    let sku: string | null = null;
    const imageFiles: { file: File; ext: string }[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      name = (formData.get("name") as string)?.trim();
      category = parseCategory(formData.get("category"));
      const desc = formData.get("description");
      description = desc != null ? String(desc).trim() || null : null;
      const priceVal = formData.get("basePrice");
      basePrice = priceVal != null ? Number(priceVal) : undefined;
      const discountVal = formData.get("discountPrice");
      discountPrice = discountVal != null && String(discountVal).trim() !== "" ? Number(discountVal) : null;
      const stockVal = formData.get("stockQuantity");
      stockQuantity = stockVal != null && String(stockVal).trim() !== "" ? Number(stockVal) : 0;
      const minVal = formData.get("minOrderQuantity");
      minOrderQuantity = minVal != null && String(minVal).trim() !== "" ? Number(minVal) : 1;
      const maxVal = formData.get("maxOrderQuantity");
      maxOrderQuantity = maxVal != null && String(maxVal).trim() !== "" ? Number(maxVal) : null;
      const curr = formData.get("currency");
      currency = curr != null ? String(curr).trim() || "INR" : "INR";
      const skuVal = formData.get("sku");
      sku = skuVal != null ? String(skuVal).trim() || null : null;
      const images = formData.getAll("images");
      for (const img of images) {
        if (img instanceof File && img.size > 0 && img.type.startsWith("image/")) {
          imageFiles.push({ file: img, ext: getExt(img.name, img.type) });
        }
      }
    } else {
      const body = (await req.json().catch(() => ({}))) as {
        name?: string;
        category?: string;
        description?: string;
        basePrice?: number;
        discountPrice?: number | null;
        stockQuantity?: number;
        minOrderQuantity?: number;
        maxOrderQuantity?: number | null;
        currency?: string;
        sku?: string;
      };
      name = body.name;
      category = parseCategory(body.category);
      description = body.description ?? null;
      basePrice = body.basePrice;
      discountPrice = body.discountPrice ?? null;
      stockQuantity = body.stockQuantity ?? 0;
      minOrderQuantity = body.minOrderQuantity ?? 1;
      maxOrderQuantity = body.maxOrderQuantity ?? null;
      currency = body.currency ?? "INR";
      sku = body.sku ?? null;
    }

    if (!name || !category || typeof basePrice !== "number" || basePrice < 0) {
      return badRequest("name, category and basePrice are required");
    }
    if (discountPrice != null && (Number.isNaN(discountPrice) || discountPrice < 0 || discountPrice >= basePrice)) {
      return badRequest("discountPrice must be >= 0 and less than basePrice");
    }
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      return badRequest("stockQuantity must be a non-negative integer");
    }
    if (!Number.isInteger(minOrderQuantity) || minOrderQuantity < 1) {
      return badRequest("minOrderQuantity must be an integer >= 1");
    }
    if (maxOrderQuantity != null && (!Number.isInteger(maxOrderQuantity) || maxOrderQuantity < minOrderQuantity)) {
      return badRequest("maxOrderQuantity must be empty or an integer >= minOrderQuantity");
    }

    const vendor = await prisma.vendor.findFirst({
      where: { users: { some: { id: user.id } } },
    });
    if (!vendor) {
      return badRequest("Vendor not found for user");
    }
    if (!vendor.isActive) {
      return badRequest("Vendor account is paused. Contact admin.");
    }

    const product = await prisma.product.create({
      data: {
        vendorId: vendor.id,
        name,
        category,
        description,
        basePrice,
        discountPrice,
        stockQuantity,
        minOrderQuantity,
        maxOrderQuantity,
        currency,
        sku,
        status: ProductStatus.PENDING_APPROVAL,
        images: [],
      } as any,
    });

    const imagePaths: string[] = [];
    if (imageFiles.length > 0) {
      if (!isR2Configured()) {
        return badRequest(
          "Image uploads require Cloudflare R2. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL."
        );
      }
      for (const { file, ext } of imageFiles) {
        const filename = `${crypto.randomUUID()}${ext}`;
        const buf = new Uint8Array(await file.arrayBuffer());
        const url = await uploadProductImage(product.id, filename, buf, mimeForExt(ext));
        imagePaths.push(url);
      }
      await prisma.product.update({
        where: { id: product.id },
        data: { images: imagePaths },
      });
    }

    const updated = await prisma.product.findUnique({
      where: { id: product.id },
    });
    const out = updated ?? product;
    notifyAdminsNewProductQueued({
      productId: out.id,
      name: out.name,
      vendorName: vendor.name,
      basePrice: String(out.basePrice),
      currency: out.currency,
    });
    return json(out, { status: 201 });
  }, [UserRole.VENDOR]),
);

// Corporate admin approves or rejects a product (goes live after approval)
registerRoute(
  "POST",
  "/products/approve",
  requireRole(async ({ req, user }) => {
    if (!user) return unauthorized();

    const body = (await req.json().catch(() => ({}))) as {
      productId?: string;
      approve?: boolean;
      remarks?: string;
    };

    if (!body.productId || typeof body.approve !== "boolean") {
      return badRequest("productId and approve are required");
    }

    const status = body.approve
      ? ProductStatus.APPROVED
      : ProductStatus.REJECTED;

    const product = await prisma.product.update({
      where: { id: body.productId },
      data: {
        status,
        approvals: {
          create: {
            approvedById: user.id,
            status,
            remarks: body.remarks ?? null,
          },
        },
      },
      include: { approvals: true },
    });

    return json(product);
  }, [UserRole.CORPORATE_ADMIN]),
);

// List approved products for store owners (catalog)
registerRoute("GET", "/products", async ({ req }) => {
  const parsedUrl = new URL(req.url);
  const categoryParam = parsedUrl.searchParams.get("category");
  const category = categoryParam ? parseCategory(categoryParam) : null;
  if (categoryParam && !category) {
    return badRequest("Invalid category filter");
  }
  const products = await prisma.product.findMany({
    where: { status: ProductStatus.APPROVED, ...(category ? { category } : {}) },
    orderBy: { createdAt: "desc" },
    include: { vendor: { select: { id: true, name: true } } },
  });
  return json(products);
});

// Paginated product listing for storefront collections
registerRoute("GET", "/products/paginated", async ({ req }) => {
  const parsedUrl = new URL(req.url);
  const categoryParam = parsedUrl.searchParams.get("category");
  const category = categoryParam ? parseCategory(categoryParam) : null;
  if (categoryParam && !category) {
    return badRequest("Invalid category filter");
  }

  const rawPage = Number(parsedUrl.searchParams.get("page") ?? "1");
  const rawLimit = Number(parsedUrl.searchParams.get("limit") ?? "12");
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(60, Math.floor(rawLimit)) : 12;

  const search = (parsedUrl.searchParams.get("search") ?? "").trim();
  const minPriceRaw = parsedUrl.searchParams.get("minPrice");
  const maxPriceRaw = parsedUrl.searchParams.get("maxPrice");
  const minPrice = minPriceRaw != null && minPriceRaw !== "" ? Number(minPriceRaw) : null;
  const maxPrice = maxPriceRaw != null && maxPriceRaw !== "" ? Number(maxPriceRaw) : null;
  const inStock = parsedUrl.searchParams.get("inStock") === "true";
  const outOfStock = parsedUrl.searchParams.get("outOfStock") === "true";
  const sortBy = (parsedUrl.searchParams.get("sortBy") ?? "featured").trim();

  if ((minPrice != null && !Number.isFinite(minPrice)) || (maxPrice != null && !Number.isFinite(maxPrice))) {
    return badRequest("Invalid minPrice/maxPrice");
  }

  const baseWhere: Record<string, unknown> = {
    status: ProductStatus.APPROVED,
    ...(category ? { category } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const availabilityClause =
    inStock && outOfStock
      ? null
      : inStock
        ? { stockQuantity: { gt: 0 } }
        : outOfStock
          ? { stockQuantity: { lte: 0 } }
          : null;

  const where: Record<string, unknown> = {
    ...baseWhere,
    ...(availabilityClause ?? {}),
    ...(minPrice != null || maxPrice != null
      ? {
          basePrice: {
            ...(minPrice != null ? { gte: minPrice } : {}),
            ...(maxPrice != null ? { lte: maxPrice } : {}),
          },
        }
      : {}),
  };

  const orderBy =
    sortBy === "price_asc"
      ? ({ basePrice: "asc" } as const)
      : sortBy === "price_desc"
        ? ({ basePrice: "desc" } as const)
        : sortBy === "name_asc"
          ? ({ name: "asc" } as const)
          : ({ createdAt: "desc" } as const);

  const [total, items, bounds] = await Promise.all([
    prisma.product.count({ where: where as any }),
    prisma.product.findMany({
      where: where as any,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: { vendor: { select: { id: true, name: true } } },
    }),
    prisma.product.aggregate({
      where: {
        ...baseWhere,
        ...(availabilityClause ?? {}),
      } as any,
      _min: { basePrice: true },
      _max: { basePrice: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return json({
    items,
    total,
    page,
    limit,
    totalPages,
    minPrice:
      bounds._min.basePrice != null
        ? Number(bounds._min.basePrice as unknown as number)
        : 0,
    maxPrice:
      bounds._max.basePrice != null
        ? Number(bounds._max.basePrice as unknown as number)
        : 0,
  } as any);
});

// Admin: list products pending corporate approval
registerRoute(
  "GET",
  "/admin/products/pending",
  requireRole(async () => {
    const products = await prisma.product.findMany({
      where: { status: ProductStatus.PENDING_APPROVAL },
      orderBy: { createdAt: "asc" },
      include: { vendor: { select: { name: true } } },
    });
    return json(products);
  }, [UserRole.CORPORATE_ADMIN]),
);

// Admin: list all products (any status)
registerRoute(
  "GET",
  "/admin/products",
  requireRole(async () => {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { vendor: { select: { name: true } } },
    });
    return json(products);
  }, [UserRole.CORPORATE_ADMIN]),
);

// Vendor: list my products (all statuses)
registerRoute(
  "GET",
  "/vendors/me/products",
  requireRole(async ({ user }) => {
    if (!user) return unauthorized();
    const vendor = await prisma.vendor.findFirst({
      where: { users: { some: { id: user.id } } },
    });
    if (!vendor) return badRequest("Vendor not found for user");
    const products = await prisma.product.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: "desc" },
    });
    return json(products);
  }, [UserRole.VENDOR]),
);

// Vendor: get one product (must belong to vendor) — ?id=
registerRoute(
  "GET",
  "/vendors/me/product",
  requireRole(async ({ req, user }) => {
    if (!user) return unauthorized();
    const url = new URL(req.url);
    const id = url.searchParams.get("id")?.trim();
    if (!id) return badRequest("id query parameter is required");

    const vendor = await prisma.vendor.findFirst({
      where: { users: { some: { id: user.id } } },
    });
    if (!vendor) return badRequest("Vendor not found for user");

    const product = await prisma.product.findFirst({
      where: { id, vendorId: vendor.id },
    });
    if (!product) return notFound();
    return json(product);
  }, [UserRole.VENDOR]),
);

// Vendor: update product — JSON or multipart (form field `id` required)
registerRoute(
  "PATCH",
  "/vendors/me/product",
  requireRole(async ({ req, user }) => {
    if (!user) return unauthorized();

    const vendor = await prisma.vendor.findFirst({
      where: { users: { some: { id: user.id } } },
    });
    if (!vendor) return badRequest("Vendor not found for user");
    if (!vendor.isActive) {
      return badRequest("Vendor account is paused. Contact admin.");
    }

    const contentType = req.headers.get("content-type") ?? "";
    let productId: string | undefined;
    let name: string | undefined;
    let category: ProductCategoryValue | undefined;
    let invalidCategory = false;
    let description: string | null | undefined;
    let basePrice: number | undefined;
    let discountPrice: number | null | undefined;
    let stockQuantity: number | undefined;
    let minOrderQuantity: number | undefined;
    let maxOrderQuantity: number | null | undefined;
    let currency: string | undefined;
    let sku: string | null | undefined;
    let replaceImages = false;
    const imageFiles: { file: File; ext: string }[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      productId = String(formData.get("id") ?? "").trim();
      name = (formData.get("name") as string)?.trim();
      const rawCategory = formData.get("category");
      if (rawCategory != null && String(rawCategory).trim() !== "") {
        const parsedCategory = parseCategory(rawCategory);
        if (!parsedCategory) invalidCategory = true;
        category = parsedCategory ?? undefined;
      }
      const desc = formData.get("description");
      description = desc != null ? String(desc).trim() || null : undefined;
      const priceVal = formData.get("basePrice");
      basePrice = priceVal != null && String(priceVal).trim() !== "" ? Number(priceVal) : undefined;
      const discountVal = formData.get("discountPrice");
      discountPrice =
        discountVal != null && String(discountVal).trim() !== "" ? Number(discountVal) : null;
      const stockVal = formData.get("stockQuantity");
      stockQuantity = stockVal != null && String(stockVal).trim() !== "" ? Number(stockVal) : undefined;
      const minVal = formData.get("minOrderQuantity");
      minOrderQuantity = minVal != null && String(minVal).trim() !== "" ? Number(minVal) : undefined;
      const maxVal = formData.get("maxOrderQuantity");
      maxOrderQuantity = maxVal != null && String(maxVal).trim() !== "" ? Number(maxVal) : null;
      const curr = formData.get("currency");
      currency = curr != null ? String(curr).trim() : undefined;
      const skuVal = formData.get("sku");
      sku = skuVal != null ? String(skuVal).trim() || null : undefined;
      replaceImages = String(formData.get("replaceImages") ?? "") === "true";
      const images = formData.getAll("images");
      for (const img of images) {
        if (img instanceof File && img.size > 0 && img.type.startsWith("image/")) {
          imageFiles.push({ file: img, ext: getExt(img.name, img.type) });
        }
      }
    } else {
      const body = (await req.json().catch(() => ({}))) as {
        id?: string;
        name?: string;
        category?: string;
        description?: string | null;
        basePrice?: number;
        discountPrice?: number | null;
        stockQuantity?: number;
        minOrderQuantity?: number;
        maxOrderQuantity?: number | null;
        currency?: string;
        sku?: string | null;
      };
      productId = body.id?.trim();
      name = body.name;
      if (body.category != null && String(body.category).trim() !== "") {
        const parsedCategory = parseCategory(body.category);
        if (!parsedCategory) invalidCategory = true;
        category = parsedCategory ?? undefined;
      }
      description = body.description;
      basePrice = body.basePrice;
      discountPrice = body.discountPrice;
      stockQuantity = body.stockQuantity;
      minOrderQuantity = body.minOrderQuantity;
      maxOrderQuantity = body.maxOrderQuantity;
      currency = body.currency;
      sku = body.sku;
    }

    if (!productId) return badRequest("id is required");
    if (invalidCategory) {
      return badRequest("Invalid category");
    }

    const existing = await prisma.product.findFirst({
      where: { id: productId, vendorId: vendor.id },
    });
    if (!existing) return notFound();

    if (name !== undefined && !name.trim()) return badRequest("name cannot be empty");
    if (basePrice !== undefined && (typeof basePrice !== "number" || basePrice < 0)) {
      return badRequest("basePrice must be a non-negative number");
    }
    if (stockQuantity !== undefined && (!Number.isInteger(stockQuantity) || stockQuantity < 0)) {
      return badRequest("stockQuantity must be a non-negative integer");
    }
    if (minOrderQuantity !== undefined && (!Number.isInteger(minOrderQuantity) || minOrderQuantity < 1)) {
      return badRequest("minOrderQuantity must be an integer >= 1");
    }

    const existingWithOrderQty = existing as typeof existing & {
      minOrderQuantity?: number;
      maxOrderQuantity?: number | null;
    };
    const nextBase = basePrice ?? Number(existing.basePrice);
    const nextMinOrderQty = minOrderQuantity ?? existingWithOrderQty.minOrderQuantity ?? 1;
    const nextMaxOrderQty =
      maxOrderQuantity === undefined ? existingWithOrderQty.maxOrderQuantity ?? null : maxOrderQuantity;
    const existingDiscountRaw = (existing as { discountPrice?: unknown }).discountPrice;
    const effectiveDiscount =
      discountPrice === undefined
        ? existingDiscountRaw != null
          ? Number(existingDiscountRaw as number | { toString(): string })
          : null
        : discountPrice;

    if (effectiveDiscount != null && (Number.isNaN(effectiveDiscount) || effectiveDiscount < 0 || effectiveDiscount >= nextBase)) {
      return badRequest("discountPrice must be >= 0 and less than basePrice");
    }
    if (nextMaxOrderQty != null && (!Number.isInteger(nextMaxOrderQty) || nextMaxOrderQty < nextMinOrderQty)) {
      return badRequest("maxOrderQuantity must be empty or an integer >= minOrderQuantity");
    }

    let nextImages = [...existing.images];

    if (imageFiles.length > 0) {
      if (!isR2Configured()) {
        return badRequest(
          "Image uploads require Cloudflare R2. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL."
        );
      }
      const uploaded: string[] = [];
      for (const { file, ext } of imageFiles) {
        const filename = `${crypto.randomUUID()}${ext}`;
        const buf = new Uint8Array(await file.arrayBuffer());
        const url = await uploadProductImage(existing.id, filename, buf, mimeForExt(ext));
        uploaded.push(url);
      }
      nextImages = replaceImages ? uploaded : [...existing.images, ...uploaded];
    }

    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(basePrice !== undefined ? { basePrice } : {}),
        ...(discountPrice !== undefined ? { discountPrice: discountPrice === null ? null : discountPrice } : {}),
        ...(stockQuantity !== undefined ? { stockQuantity } : {}),
        ...(minOrderQuantity !== undefined ? { minOrderQuantity } : {}),
        ...(maxOrderQuantity !== undefined ? { maxOrderQuantity } : {}),
        ...(currency !== undefined ? { currency: currency || "INR" } : {}),
        ...(sku !== undefined ? { sku } : {}),
        ...(imageFiles.length > 0 ? { images: nextImages } : {}),
        // Re-submit for review if product was rejected (optional UX)
        ...(existing.status === ProductStatus.REJECTED
          ? { status: ProductStatus.PENDING_APPROVAL }
          : {}),
      },
    });

    return json(updated);
  }, [UserRole.VENDOR]),
);


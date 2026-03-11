import { ProductStatus, UserRole } from "@prisma/client";
import fs from "fs";
import path from "path";
import { client } from "../../../prisma/index";
import {
  badRequest,
  json,
  registerRoute,
  requireRole,
  unauthorized,
} from "../../core/router";

const prisma = client;

const UPLOADS_PRODUCTS = path.join(process.cwd(), "uploads", "products");

function getExt(name: string, type: string): string {
  const n = (name || "").toLowerCase();
  if (n.endsWith(".jpg") || n.endsWith(".jpeg") || type === "image/jpeg") return ".jpg";
  if (n.endsWith(".png") || type === "image/png") return ".png";
  if (n.endsWith(".webp") || type === "image/webp") return ".webp";
  if (n.endsWith(".gif") || type === "image/gif") return ".gif";
  return ".jpg";
}

// Vendor creates product (JSON or multipart with images)
registerRoute(
  "POST",
  "/vendors/products",
  requireRole(async ({ req, user }) => {
    if (!user) return unauthorized();

    const contentType = req.headers.get("content-type") ?? "";
    let name: string | undefined;
    let description: string | null = null;
    let basePrice: number | undefined;
    let currency = "INR";
    let sku: string | null = null;
    const imageFiles: { file: File; ext: string }[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      name = (formData.get("name") as string)?.trim();
      const desc = formData.get("description");
      description = desc != null ? String(desc).trim() || null : null;
      const priceVal = formData.get("basePrice");
      basePrice = priceVal != null ? Number(priceVal) : undefined;
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
        description?: string;
        basePrice?: number;
        currency?: string;
        sku?: string;
      };
      name = body.name;
      description = body.description ?? null;
      basePrice = body.basePrice;
      currency = body.currency ?? "INR";
      sku = body.sku ?? null;
    }

    if (!name || typeof basePrice !== "number" || basePrice < 0) {
      return badRequest("name and basePrice are required");
    }

    const vendor = await prisma.vendor.findFirst({
      where: { users: { some: { id: user.id } } },
    });
    if (!vendor) {
      return badRequest("Vendor not found for user");
    }

    const product = await prisma.product.create({
      data: {
        vendorId: vendor.id,
        name,
        description,
        basePrice,
        currency,
        sku,
        status: ProductStatus.PENDING_APPROVAL,
        images: [],
      },
    });

    const imagePaths: string[] = [];
    if (imageFiles.length > 0) {
      const productDir = path.join(UPLOADS_PRODUCTS, product.id);
      fs.mkdirSync(productDir, { recursive: true });
      for (const { file, ext } of imageFiles) {
        const filename = `${crypto.randomUUID()}${ext}`;
        const filePath = path.join(productDir, filename);
        await Bun.write(filePath, file);
        imagePaths.push(`/uploads/products/${product.id}/${filename}`);
      }
      await prisma.product.update({
        where: { id: product.id },
        data: { images: imagePaths },
      });
    }

    const updated = await prisma.product.findUnique({
      where: { id: product.id },
    });
    return json(updated ?? product, { status: 201 });
  }, [UserRole.VENDOR]),
);

// CEE approves or rejects a product
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
  }, [UserRole.CEE, UserRole.SUPER_ADMIN]),
);

// List approved products for store owners (catalog)
registerRoute("GET", "/products", async () => {
  const products = await prisma.product.findMany({
    where: { status: ProductStatus.APPROVED },
    orderBy: { createdAt: "desc" },
    include: { vendor: { select: { id: true, name: true } } },
  });
  return json(products);
});

// Admin: list products pending CEE approval
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
  }, [UserRole.CEE, UserRole.SUPER_ADMIN]),
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
  }, [UserRole.CEE, UserRole.SUPER_ADMIN]),
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


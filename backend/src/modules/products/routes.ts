import { ProductStatus, UserRole } from "@prisma/client";
import { client } from "../../../prisma/index";
import {
  badRequest,
  json,
  registerRoute,
  requireRole,
  unauthorized,
} from "../../core/router";

const prisma = client

// Vendor creates product (DRAFT -> PENDING_APPROVAL)
registerRoute(
  "POST",
  "/vendors/products",
  requireRole(async ({ req, user }) => {
    if (!user) return unauthorized();

    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      description?: string;
      basePrice?: number;
      currency?: string;
      sku?: string;
    };

    if (!body.name || typeof body.basePrice !== "number") {
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
        name: body.name,
        description: body.description ?? null,
        basePrice: body.basePrice,
        currency: body.currency ?? "INR",
        sku: body.sku ?? null,
        status: ProductStatus.PENDING_APPROVAL,
      },
    });

    return json(product, { status: 201 });
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


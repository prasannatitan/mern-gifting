import { UserRole } from "@prisma/client";
import { client } from "../../../prisma/index";
import { badRequest, json, registerRoute, requireRole } from "../../core/router";

const prisma = client;

// Admin: list all vendors
registerRoute(
  "GET",
  "/admin/vendors",
  requireRole(async () => {
    const vendors = await prisma.vendor.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { products: true, orders: true } },
      },
    });
    return json(vendors);
  }, [UserRole.CEE, UserRole.SUPER_ADMIN]),
);

// Admin: update vendor (pause/activate)
registerRoute(
  "PATCH",
  "/admin/vendors",
  requireRole(async ({ req }) => {
    const body = (await req.json().catch(() => ({}))) as { vendorId?: string; isActive?: boolean };
    if (!body.vendorId || typeof body.isActive !== "boolean") {
      return badRequest("vendorId and isActive are required");
    }
    const vendor = await prisma.vendor.update({
      where: { id: body.vendorId },
      data: { isActive: body.isActive },
    });
    return json(vendor);
  }, [UserRole.CEE, UserRole.SUPER_ADMIN]),
);

// Admin: list all stores
registerRoute(
  "GET",
  "/admin/stores",
  requireRole(async () => {
    const stores = await prisma.store.findMany({
      orderBy: { name: "asc" },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { orders: true } },
      },
    });
    return json(stores);
  }, [UserRole.CEE, UserRole.SUPER_ADMIN]),
);

// Admin: update store (pause/activate)
registerRoute(
  "PATCH",
  "/admin/stores",
  requireRole(async ({ req }) => {
    const body = (await req.json().catch(() => ({}))) as { storeId?: string; isActive?: boolean };
    if (!body.storeId || typeof body.isActive !== "boolean") {
      return badRequest("storeId and isActive are required");
    }
    const store = await prisma.store.update({
      where: { id: body.storeId },
      data: { isActive: body.isActive },
    });
    return json(store);
  }, [UserRole.CEE, UserRole.SUPER_ADMIN]),
);

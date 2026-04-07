import { UserRole } from "@prisma/client";
import { client } from "../../../prisma/index";
import { badRequest, json, registerRoute, requireRole } from "../../core/router";

const prisma = client;

const CORPORATE_ROLES: UserRole[] = [UserRole.CORPORATE_ADMIN];

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
  }, CORPORATE_ROLES),
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
  }, CORPORATE_ROLES),
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
        ceeUser: { select: { id: true, name: true, email: true } },
        _count: { select: { orders: true } },
      },
    });
    return json(stores);
  }, CORPORATE_ROLES),
);

// Admin: update store (pause/activate)
registerRoute(
  "PATCH",
  "/admin/stores",
  requireRole(async ({ req }) => {
    const body = (await req.json().catch(() => ({}))) as {
      storeId?: string;
      isActive?: boolean;
      ceeUserId?: string | null;
    };
    if (!body.storeId) {
      return badRequest("storeId is required");
    }
    if (typeof body.isActive !== "boolean" && body.ceeUserId === undefined) {
      return badRequest("Provide isActive and/or ceeUserId");
    }
    if (body.ceeUserId != null && body.ceeUserId !== "") {
      const cee = await prisma.user.findFirst({
        where: { id: body.ceeUserId, role: UserRole.CEE },
      });
      if (!cee) return badRequest("ceeUserId must be a user with role CEE");
    }
    const store = await prisma.store.update({
      where: { id: body.storeId },
      data: {
        ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
        ...(body.ceeUserId !== undefined
          ? { ceeUserId: body.ceeUserId === "" ? null : body.ceeUserId }
          : {}),
      },
      include: { ceeUser: { select: { id: true, name: true, email: true } } },
    });
    return json(store);
  }, CORPORATE_ROLES),
);

// Corporate: list CEE users (for store–territory assignment)
registerRoute(
  "GET",
  "/admin/cee-users",
  requireRole(async () => {
    const users = await prisma.user.findMany({
      where: { role: UserRole.CEE },
      orderBy: { name: "asc" },
      select: { id: true, email: true, name: true },
    });
    return json(users);
  }, CORPORATE_ROLES),
);

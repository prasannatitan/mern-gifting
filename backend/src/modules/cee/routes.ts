import { UserRole } from "@prisma/client";
import { client } from "../../../prisma/index";
import { json, registerRoute, requireRole, unauthorized } from "../../core/router";

const prisma = client;

/** Stores in this CEE's territory (ceeUserId = logged-in user) */
registerRoute(
  "GET",
  "/cee/me/stores",
  requireRole(async ({ user }) => {
    if (!user) return unauthorized();
    const stores = await prisma.store.findMany({
      where: { ceeUserId: user.id },
      orderBy: { name: "asc" },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { orders: true } },
      },
    });
    return json(stores);
  }, [UserRole.CEE]),
);

/** Full order log for this CEE's territory */
registerRoute(
  "GET",
  "/cee/orders",
  requireRole(async ({ user }) => {
    if (!user) return unauthorized();
    const orders = await prisma.order.findMany({
      where: { assignedCeeId: user.id },
      include: { store: true, vendor: true, approvals: true, estimate: true, shipment: true },
      orderBy: { placedAt: "desc" },
    });
    return json(orders as any);
  }, [UserRole.CEE]),
);

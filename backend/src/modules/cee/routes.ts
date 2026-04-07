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

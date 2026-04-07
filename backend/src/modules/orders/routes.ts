import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  UserRole,
} from "@prisma/client";
import { client } from "../../../prisma/index";
import {
  badRequest,
  forbidden,
  json,
  registerRoute,
  requireRole,
  unauthorized,
} from "../../core/router";
import {
  notifyCeeOrderPending,
  notifyStoreEstimateSent,
  notifyStoreVendorAcceptedOrder,
} from "../emails/notifications";

const prisma = client;

// Store places order (PENDING_CEE_APPROVAL)
registerRoute(
  "POST",
  "/stores/orders",
  requireRole(async ({ req, user }) => {
    if (!user) return unauthorized();

    const body = (await req.json().catch(() => ({}))) as {
      storeId?: string;
      vendorId?: string;
      items?: { productId: string; quantity: number; unitPrice: number }[];
      currency?: string;
    };

    if (
      !body.storeId ||
      !body.vendorId ||
      !body.items ||
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      return badRequest("storeId, vendorId and at least one item are required");
    }

    const store = await prisma.store.findUnique({
      where: { id: body.storeId },
    });
    if (!store) return badRequest("Store not found");
    if (!store.isActive) {
      return badRequest("Store account is paused. Contact admin.");
    }
    if (store.ownerId !== user.id) {
      return forbidden();
    }
    const ceeUserId = (store as { ceeUserId?: string | null }).ceeUserId;
    if (!ceeUserId) {
      return badRequest(
        "This store has no assigned CEE. Contact corporate admin to map the store to a city manager.",
      );
    }

    const totalAmount = body.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    const order = await prisma.order.create({
      data: {
        storeId: body.storeId,
        vendorId: body.vendorId,
        assignedCeeId: ceeUserId,
        status: OrderStatus.PENDING_CEE_APPROVAL,
        paymentStatus: PaymentStatus.UNPAID,
        totalAmount,
        currency: body.currency ?? "INR",
        items: {
          create: body.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.unitPrice * i.quantity,
          })),
        },
      } as any,
      include: { items: true, store: true, vendor: true },
    });

    const cee = await prisma.user.findUnique({
      where: { id: ceeUserId },
      select: { email: true },
    });
    if (cee?.email) {
      notifyCeeOrderPending({
        orderId: order.id,
        ceeEmail: cee.email,
        storeName: order.store.name,
        vendorName: order.vendor.name,
        totalAmount: String(order.totalAmount),
        currency: order.currency,
      });
    }

    return json(order as any, { status: 201 });
  }, [UserRole.STORE_OWNER]),
);

// CEE approves or rejects order
registerRoute(
  "POST",
  "/orders/cee-approval",
  requireRole(async ({ req, user }) => {
    if (!user) return unauthorized();

    const body = (await req.json().catch(() => ({}))) as {
      orderId?: string;
      approve?: boolean;
      remarks?: string;
    };

    if (!body.orderId || typeof body.approve !== "boolean") {
      return badRequest("orderId and approve are required");
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: body.orderId },
    });
    if (!existingOrder) return badRequest("Order not found");
    const assignedCeeId = (existingOrder as { assignedCeeId?: string | null }).assignedCeeId;
    if (user.role === UserRole.CEE) {
      if (assignedCeeId !== user.id) {
        return forbidden();
      }
    } else if (user.role !== UserRole.CORPORATE_ADMIN) {
      return forbidden();
    }

    const status = body.approve
      ? OrderStatus.PENDING_VENDOR_ACCEPTANCE
      : OrderStatus.REJECTED_BY_CEE;

    const order = await prisma.order.update({
      where: { id: body.orderId },
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

    return json(order);
  }, [UserRole.CEE, UserRole.CORPORATE_ADMIN]),
);

// Vendor accepts or rejects order
registerRoute(
  "POST",
  "/orders/vendor-decision",
  requireRole(async ({ req, user }) => {
    if (!user) return unauthorized();

    const body = (await req.json().catch(() => ({}))) as {
      orderId?: string;
      accept?: boolean;
      remarks?: string;
    };

    if (!body.orderId || typeof body.accept !== "boolean") {
      return badRequest("orderId and accept are required");
    }

    const status = body.accept
      ? OrderStatus.ESTIMATE_SENT // will be updated when estimate is actually created
      : OrderStatus.REJECTED_BY_VENDOR;

    const order = await prisma.order.update({
      where: { id: body.orderId },
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
      include: { approvals: true, store: true, vendor: true },
    });

    if (body.accept) {
      const owner = order.store.ownerId
        ? await prisma.user.findUnique({
            where: { id: order.store.ownerId },
            select: { email: true },
          })
        : null;
      const toEmail = order.store.email?.trim() || owner?.email;
      if (toEmail) {
        notifyStoreVendorAcceptedOrder({
          orderId: order.id,
          toEmail,
          storeName: order.store.name,
          vendorName: order.vendor.name,
        });
      }
    }

    return json(order);
  }, [UserRole.VENDOR]),
);

// Vendor creates estimate
registerRoute(
  "POST",
  "/orders/estimate",
  requireRole(async ({ req, user }) => {
    if (!user) return unauthorized();

    const body = (await req.json().catch(() => ({}))) as {
      orderId?: string;
      subtotal?: number;
      taxAmount?: number;
      shippingAmount?: number;
      grandTotal?: number;
      notes?: string;
      sentToEmail?: string;
    };

    if (
      !body.orderId ||
      typeof body.subtotal !== "number" ||
      typeof body.taxAmount !== "number" ||
      typeof body.shippingAmount !== "number" ||
      typeof body.grandTotal !== "number" ||
      !body.sentToEmail
    ) {
      return badRequest(
        "orderId, subtotal, taxAmount, shippingAmount, grandTotal, sentToEmail are required",
      );
    }

    const estimate = await prisma.estimate.upsert({
      where: { orderId: body.orderId },
      update: {
        subtotal: body.subtotal,
        taxAmount: body.taxAmount,
        shippingAmount: body.shippingAmount,
        grandTotal: body.grandTotal,
        notes: body.notes ?? null,
        sentToEmail: body.sentToEmail,
      },
      create: {
        orderId: body.orderId,
        subtotal: body.subtotal,
        taxAmount: body.taxAmount,
        shippingAmount: body.shippingAmount,
        grandTotal: body.grandTotal,
        notes: body.notes ?? null,
        sentToEmail: body.sentToEmail,
      },
    });

    const order = await prisma.order.update({
      where: { id: body.orderId },
      data: { status: OrderStatus.ESTIMATE_SENT },
      include: { store: true, vendor: true },
    });

    notifyStoreEstimateSent({
      orderId: order.id,
      toEmail: body.sentToEmail,
      storeName: order.store.name,
      vendorName: order.vendor.name,
      subtotal: String(estimate.subtotal),
      taxAmount: String(estimate.taxAmount),
      shippingAmount: String(estimate.shippingAmount),
      grandTotal: String(estimate.grandTotal),
      currency: order.currency,
      notes: estimate.notes,
    });

    return json({ estimate, order });
  }, [UserRole.VENDOR]),
);

// Admin: list orders that have cost letters (estimates)
registerRoute(
  "GET",
  "/admin/cost-letters",
  requireRole(async () => {
    const orders = await prisma.order.findMany({
      where: {
        estimate: { isNot: null },
      },
      include: {
        vendor: true,
        estimate: true,
        store: true,
      },
      orderBy: { placedAt: "desc" },
    });
    return json(orders);
  }, [UserRole.CORPORATE_ADMIN]),
);

// Vendor marks offline payment verified
registerRoute(
  "POST",
  "/orders/payment-verify",
  requireRole(async ({ req, user }) => {
    if (!user) return unauthorized();

    const body = (await req.json().catch(() => ({}))) as {
      orderId?: string;
    };

    if (!body.orderId) {
      return badRequest("orderId is required");
    }

    const order = await prisma.order.update({
      where: { id: body.orderId },
      data: {
        paymentStatus: PaymentStatus.VERIFIED,
        status: OrderStatus.PAYMENT_CONFIRMED,
        paymentVerifiedAt: new Date(),
      },
    });

    return json(order);
  }, [UserRole.VENDOR]),
);

// Admin/vendor/store-specific queues
registerRoute(
  "GET",
  "/admin/orders/pending-cee",
  requireRole(async ({ user }) => {
    if (!user) return unauthorized();
    const where =
      user.role === UserRole.CEE
        ? ({ status: OrderStatus.PENDING_CEE_APPROVAL, assignedCeeId: user.id } as Prisma.OrderWhereInput)
        : ({ status: OrderStatus.PENDING_CEE_APPROVAL } as Prisma.OrderWhereInput);
    const orders = await prisma.order.findMany({
      where,
      include: { store: true, vendor: true },
      orderBy: { placedAt: "asc" },
    });
    return json(orders);
  }, [UserRole.CEE, UserRole.CORPORATE_ADMIN]),
);

registerRoute(
  "GET",
  "/vendors/me/orders",
  requireRole(async ({ user }) => {
    if (!user) return unauthorized();

    const vendor = await prisma.vendor.findFirst({
      where: { users: { some: { id: user.id } } },
    });
    if (!vendor) {
      return badRequest("Vendor not found for user");
    }

    const orders = await prisma.order.findMany({
      where: {
        vendorId: vendor.id,
        status: {
          notIn: [OrderStatus.PENDING_CEE_APPROVAL, OrderStatus.REJECTED_BY_CEE],
        },
      },
      include: { store: true, items: true, shipment: true, estimate: true },
      orderBy: { placedAt: "desc" },
    });

    return json(orders);
  }, [UserRole.VENDOR]),
);

registerRoute(
  "GET",
  "/stores/me",
  requireRole(async ({ user }) => {
    if (!user) return unauthorized();

    const store = await prisma.store.findFirst({
      where: { ownerId: user.id },
    });
    if (!store) {
      return badRequest("Store not found for user");
    }
    return json(store);
  }, [UserRole.STORE_OWNER]),
);

registerRoute(
  "GET",
  "/stores/me/orders",
  requireRole(async ({ user }) => {
    if (!user) return unauthorized();

    const store = await prisma.store.findFirst({
      where: { ownerId: user.id },
    });
    if (!store) {
      return badRequest("Store not found for user");
    }

    const orders = await prisma.order.findMany({
      where: { storeId: store.id },
      include: { vendor: true, items: true, shipment: true, estimate: true },
      orderBy: { placedAt: "desc" },
    });

    return json(orders);
  }, [UserRole.STORE_OWNER]),
);


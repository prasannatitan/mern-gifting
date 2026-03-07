import { ShipmentStatus, UserRole } from "@prisma/client";
import { client } from "../../../prisma/index";
import {
  badRequest,
  json,
  registerRoute,
  requireRole,
  unauthorized,
} from "../../core/router";

const prisma = client;

// Vendor creates or updates shipment with manual tracking info
registerRoute(
  "POST",
  "/orders/shipment",
  requireRole(async ({ req, user }) => {
    if (!user) return unauthorized();

    const body = (await req.json().catch(() => ({}))) as {
      orderId?: string;
      courier?: string;
      trackingNumber?: string;
      trackingUrl?: string;
    };

    if (!body.orderId) {
      return badRequest("orderId is required");
    }

    const shipment = await prisma.shipment.upsert({
      where: { orderId: body.orderId },
      update: {
        courier: body.courier ?? null,
        trackingNumber: body.trackingNumber ?? null,
        trackingUrl: body.trackingUrl ?? null,
        status: ShipmentStatus.IN_TRANSIT,
      },
      create: {
        orderId: body.orderId,
        courier: body.courier ?? null,
        trackingNumber: body.trackingNumber ?? null,
        trackingUrl: body.trackingUrl ?? null,
        status: ShipmentStatus.IN_TRANSIT,
      },
    });

    const order = await prisma.order.update({
      where: { id: body.orderId },
      data: { status: "SHIPPED" },
    });

    return json({ shipment, order });
  }, [UserRole.VENDOR]),
);

// Webhook-ready endpoint to update shipment status from external providers
registerRoute("POST", "/webhooks/shipment/:provider", async ({ req }) => {
  // For MVP we just log and echo back; in real integration parse provider payload
  const provider = new URL(req.url).pathname.split("/").pop();
  const payload = await req.json().catch(() => ({}));

  console.log("Shipment webhook from", provider, payload);

  // TODO: map payload to orderId/trackingNumber and update Shipment + Order

  return json({ received: true });
});


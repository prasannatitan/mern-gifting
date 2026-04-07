import { OrderStatus, ProductStatus } from "@prisma/client";
import { client } from "../../../prisma/index";
import { verifyEmailAction } from "./email-action-token";
import { registerRoute } from "../../core/router";

const prisma = client;

function htmlPage(title: string, message: string, ok: boolean): Response {
  const body = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title></head>
<body style="font-family:system-ui,sans-serif;max-width:520px;margin:48px auto;padding:0 20px;">
<h1 style="font-size:1.25rem;color:${ok ? "#166534" : "#991b1b"}">${escape(title)}</h1>
<p style="line-height:1.6;color:#333;">${message}</p>
<p style="margin-top:2rem;"><a href="/" style="color:#2563eb;">Back</a></p>
</body></html>`;
  return new Response(body, {
    status: ok ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

registerRoute("GET", "/email/action", async ({ req }) => {
  let token: string | null = null;
  try {
    const u = new URL(req.url);
    token = u.searchParams.get("token");
  } catch {
    return htmlPage("Invalid request", "Could not read the link.", false);
  }

  if (!token) {
    return htmlPage("Missing link", "This approval link is incomplete.", false);
  }

  const payload = verifyEmailAction(token);
  if (!payload) {
    return htmlPage("Link expired", "This link is invalid or has expired. Use the admin or CEE dashboard instead.", false);
  }

  if (payload.typ === "product") {
    const product = await prisma.product.findUnique({
      where: { id: payload.productId },
    });
    if (!product) {
      return htmlPage("Not found", "This product no longer exists.", false);
    }
    if (product.status !== ProductStatus.PENDING_APPROVAL) {
      return htmlPage(
        "Already processed",
        `This product is no longer pending approval (current status: ${product.status}).`,
        true,
      );
    }

    const status =
      payload.action === "approve" ? ProductStatus.APPROVED : ProductStatus.REJECTED;

    await prisma.product.update({
      where: { id: payload.productId },
      data: {
        status,
        approvals: {
          create: {
            approvedById: null,
            status,
            remarks: "Via email link",
          },
        },
      },
    });

    return htmlPage(
      payload.action === "approve" ? "Approved" : "Rejected",
      payload.action === "approve"
        ? "The product has been approved and can appear in the catalog (if still approved in the system)."
        : "The product has been rejected.",
      true,
    );
  }

  if (payload.typ === "order_cee") {
    const order = await prisma.order.findUnique({
      where: { id: payload.orderId },
    });
    if (!order) {
      return htmlPage("Not found", "This order no longer exists.", false);
    }
    if (order.status !== OrderStatus.PENDING_CEE_APPROVAL) {
      return htmlPage(
        "Already processed",
        `This order is no longer waiting for CEE approval (current status: ${order.status}).`,
        true,
      );
    }

    const status =
      payload.action === "approve"
        ? OrderStatus.PENDING_VENDOR_ACCEPTANCE
        : OrderStatus.REJECTED_BY_CEE;

    await prisma.order.update({
      where: { id: payload.orderId },
      data: {
        status,
        approvals: {
          create: {
            approvedById: null,
            status,
            remarks: "Via email link",
          },
        },
      },
    });

    return htmlPage(
      payload.action === "approve" ? "Order approved" : "Order rejected",
      payload.action === "approve"
        ? "The order has been forwarded to the vendor for acceptance."
        : "The order has been rejected.",
      true,
    );
  }

  return htmlPage("Error", "Unknown action.", false);
});

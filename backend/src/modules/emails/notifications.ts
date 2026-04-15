import { UserRole } from "@prisma/client";
import { client } from "../../../prisma/index";
import { signEmailAction } from "./email-action-token";
import { buttonRow, escapeHtml, getPublicAppUrl, wrapEmail } from "./html";
import { sendHtmlEmail } from "./service";

const prisma = client;

function fire(p: Promise<void>) {
  void p.catch((err) => console.error("[notifications]", err));
}

export function notifyAdminsNewProductQueued(input: {
  productId: string;
  name: string;
  vendorName: string;
  basePrice: string;
  currency: string;
}): void {
  fire((async () => {
    const admins = await prisma.user.findMany({
      where: { role: UserRole.CORPORATE_ADMIN },
      select: { email: true },
    });
    if (admins.length === 0) return;

    const base = getPublicAppUrl();
    const approveToken = signEmailAction({
      typ: "product",
      productId: input.productId,
      action: "approve",
    });
    const rejectToken = signEmailAction({
      typ: "product",
      productId: input.productId,
      action: "reject",
    });
    const approveUrl = `${base}/email/action?token=${encodeURIComponent(approveToken)}`;
    const rejectUrl = `${base}/email/action?token=${encodeURIComponent(rejectToken)}`;

    const inner = `
<h1 style="font-size:20px;">Product pending approval</h1>
<p><strong>${escapeHtml(input.name)}</strong> from <strong>${escapeHtml(input.vendorName)}</strong></p>
<p>Price: ${escapeHtml(input.basePrice)} ${escapeHtml(input.currency)}</p>
<p>Use the buttons below to approve or reject from your inbox (no login required).</p>
${buttonRow(approveUrl, rejectUrl)}`;

    const html = wrapEmail(inner, "Product approval");
    const subject = `[Approval] New product: ${input.name}`;

    const payload = {
      productId: input.productId,
      vendorName: input.vendorName,
    };

    for (const { email } of admins) {
      await sendHtmlEmail(email, subject, "PRODUCT_APPROVAL", payload, html);
    }
  })());
}

export function notifyCeeOrderPending(input: {
  orderId: string;
  ceeEmail: string;
  storeName: string;
  vendorName: string;
  totalAmount: string;
  currency: string;
}): void {
  fire((async () => {
    const base = getPublicAppUrl();
    const approveToken = signEmailAction({
      typ: "order_cee",
      orderId: input.orderId,
      action: "approve",
    });
    const rejectToken = signEmailAction({
      typ: "order_cee",
      orderId: input.orderId,
      action: "reject",
    });
    const approveUrl = `${base}/email/action?token=${encodeURIComponent(approveToken)}`;
    const rejectUrl = `${base}/email/action?token=${encodeURIComponent(rejectToken)}`;

    const inner = `
<h1 style="font-size:20px;">Order needs your approval</h1>
<p>Order <strong>${escapeHtml(input.orderId)}</strong></p>
<p>Store: ${escapeHtml(input.storeName)} · Vendor: ${escapeHtml(input.vendorName)}</p>
<p>Total: ${escapeHtml(input.totalAmount)} ${escapeHtml(input.currency)}</p>
${buttonRow(approveUrl, rejectUrl)}`;

    const html = wrapEmail(inner, "Order approval");
    const subject = `[Action required] Order from ${input.storeName}`;

    await sendHtmlEmail(input.ceeEmail, subject, "ORDER_APPROVAL", { orderId: input.orderId }, html);
  })());
}

export function notifyStoreVendorAcceptedOrder(input: {
  orderId: string;
  toEmail: string;
  storeName: string;
  vendorName: string;
}): void {
  fire((async () => {
    const inner = `
<h1 style="font-size:20px;">Vendor accepted your order</h1>
<p>Order <strong>${escapeHtml(input.orderId)}</strong> — ${escapeHtml(input.storeName)}</p>
<p>${escapeHtml(input.vendorName)} has accepted this order. You will receive a detailed cost estimate by email once it is prepared.</p>`;

    const html = wrapEmail(inner, "Order accepted");
    const subject = `Order accepted by vendor — ${input.orderId}`;

    await sendHtmlEmail(input.toEmail, subject, "VENDOR_ORDER_ACCEPTED", { orderId: input.orderId }, html);
  })());
}

export function notifyStoreEstimateSent(input: {
  orderId: string;
  toEmail: string;
  storeName: string;
  vendorName: string;
  subtotal: string;
  taxAmount: string;
  shippingAmount: string;
  grandTotal: string;
  currency: string;
  notes: string | null;
}): void {
  fire((async () => {
    const notesBlock = input.notes
      ? `<p><strong>Notes:</strong> ${escapeHtml(input.notes)}</p>`
      : "";

    const inner = `
<h1 style="font-size:20px;">Cost estimate / billing</h1>
<p>Order <strong>${escapeHtml(input.orderId)}</strong> — ${escapeHtml(input.storeName)}</p>
<p>Vendor: ${escapeHtml(input.vendorName)}</p>
<table style="border-collapse:collapse;margin:16px 0;">
  <tr><td style="padding:4px 16px 4px 0;">Subtotal</td><td>${escapeHtml(input.subtotal)} ${escapeHtml(input.currency)}</td></tr>
  <tr><td style="padding:4px 16px 4px 0;">Tax</td><td>${escapeHtml(input.taxAmount)} ${escapeHtml(input.currency)}</td></tr>
  <tr><td style="padding:4px 16px 4px 0;">Shipping</td><td>${escapeHtml(input.shippingAmount)} ${escapeHtml(input.currency)}</td></tr>
  <tr><td style="padding:8px 16px 4px 0;border-top:1px solid #ccc;"><strong>Grand total</strong></td><td style="border-top:1px solid #ccc;"><strong>${escapeHtml(input.grandTotal)} ${escapeHtml(input.currency)}</strong></td></tr>
</table>
${notesBlock}`;

    const html = wrapEmail(inner, "Estimate");
    const subject = `Estimate for order ${input.orderId}`;

    await sendHtmlEmail(input.toEmail, subject, "ESTIMATE_SENT", { orderId: input.orderId }, html);
  })());
}

export function notifyVendorRejectedBackToCee(input: {
  orderId: string;
  ceeEmail: string;
  ceeName?: string | null;
  storeName: string;
  vendorName: string;
  reason: string;
}): void {
  fire((async () => {
    const inner = `
<h1 style="font-size:20px;">Order sent back for your review</h1>
<p>Order <strong>${escapeHtml(input.orderId)}</strong></p>
<p>Store: ${escapeHtml(input.storeName)} · Vendor: ${escapeHtml(input.vendorName)}</p>
<p><strong>Vendor rejection reason:</strong> ${escapeHtml(input.reason)}</p>
<p>Please review and take a fresh approval decision.</p>`;

    const html = wrapEmail(inner, "Order returned to CEE");
    const subject = `[Review again] Vendor rejected order ${input.orderId}`;

    await sendHtmlEmail(
      input.ceeEmail,
      subject,
      "ORDER_VENDOR_REJECTED_BACK_TO_CEE",
      { orderId: input.orderId, reason: input.reason },
      html,
    );
  })());
}

export function notifyStoreVendorRejectedOrder(input: {
  orderId: string;
  toEmail: string;
  storeName: string;
  vendorName: string;
  reason: string;
}): void {
  fire((async () => {
    const inner = `
<h1 style="font-size:20px;">Vendor rejected your order</h1>
<p>Order <strong>${escapeHtml(input.orderId)}</strong> — ${escapeHtml(input.storeName)}</p>
<p>Vendor: ${escapeHtml(input.vendorName)}</p>
<p><strong>Reason:</strong> ${escapeHtml(input.reason)}</p>
<p>The order has been sent back to your CEE for re-evaluation.</p>`;

    const html = wrapEmail(inner, "Order rejected by vendor");
    const subject = `Order rejected by vendor — ${input.orderId}`;

    await sendHtmlEmail(
      input.toEmail,
      subject,
      "ORDER_VENDOR_REJECTED_STORE",
      { orderId: input.orderId, reason: input.reason },
      html,
    );
  })());
}

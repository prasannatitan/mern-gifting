import { client } from "../../../prisma/index";
import { sendPostmarkHtml, isPostmarkConfigured } from "./postmark";

const prisma = client;

type EmailPayload = Record<string, unknown>;

export type EmailTemplate =
  | "PRODUCT_APPROVAL"
  | "ORDER_APPROVAL"
  | "ORDER_VENDOR_REJECTED_BACK_TO_CEE"
  | "ORDER_VENDOR_REJECTED_STORE"
  | "ESTIMATE_SENT"
  | "VENDOR_ORDER_ACCEPTED"
  | "PAYMENT_VERIFIED"
  | "SHIPMENT_DISPATCHED"
  | "DELIVERED"
  | "INVOICE"
  | "FORGOT_PASSWORD_OTP";

/**
 * Sends HTML email via Postmark when configured; always writes EmailLog.
 */
export async function sendHtmlEmail(
  to: string,
  subject: string,
  template: EmailTemplate,
  payload: EmailPayload,
  htmlBody: string,
): Promise<void> {
  let status = "SKIPPED";
  let error: string | null = null;

  if (isPostmarkConfigured()) {
    const result = await sendPostmarkHtml(to, subject, htmlBody);
    if (result.ok) {
      status = "SENT";
    } else {
      status = "FAILED";
      error = result.error;
      console.error("[email]", error);
    }
  } else {
    console.log("[email] Postmark not configured; log only", { to, subject, template });
  }

  await prisma.emailLog.create({
    data: {
      to,
      subject,
      template,
      payload: payload as object,
      status,
      error,
    },
  });
}

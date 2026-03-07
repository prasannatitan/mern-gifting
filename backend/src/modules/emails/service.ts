import { client } from "../../../prisma/index";

const prisma = client

type EmailPayload = Record<string, unknown>;

export type EmailTemplate =
  | "PRODUCT_APPROVAL"
  | "ORDER_APPROVAL"
  | "ESTIMATE_SENT"
  | "PAYMENT_VERIFIED"
  | "SHIPMENT_DISPATCHED"
  | "DELIVERED"
  | "INVOICE";

export async function sendEmail(
  to: string,
  subject: string,
  template: EmailTemplate,
  payload: EmailPayload,
) {
  // Placeholder for real provider integration (e.g. SendGrid, Postmark, SES)
  console.log("Sending email", { to, subject, template, payload });

  // Record in EmailLog
  await prisma.emailLog.create({
    data: {
      to,
      subject,
      template,
      payload,
      status: "SENT",
    },
  });
}


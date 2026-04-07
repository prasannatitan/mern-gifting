import jwt from "jsonwebtoken";

const getSecret = () =>
  process.env.EMAIL_ACTION_SECRET?.trim() || process.env.JWT_SECRET || "dev-secret-change-me";

export type EmailActionPayload =
  | { typ: "product"; productId: string; action: "approve" | "reject" }
  | { typ: "order_cee"; orderId: string; action: "approve" | "reject" };

export function signEmailAction(
  payload: EmailActionPayload,
  expiresIn: string = "7d",
): string {
  return jwt.sign(payload, getSecret(), { expiresIn });
}

export function verifyEmailAction(token: string): EmailActionPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret()) as EmailActionPayload;
    if (!decoded || typeof decoded !== "object") return null;
    if (decoded.typ === "product") {
      if (
        typeof decoded.productId !== "string" ||
        (decoded.action !== "approve" && decoded.action !== "reject")
      ) {
        return null;
      }
      return decoded;
    }
    if (decoded.typ === "order_cee") {
      if (
        typeof decoded.orderId !== "string" ||
        (decoded.action !== "approve" && decoded.action !== "reject")
      ) {
        return null;
      }
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

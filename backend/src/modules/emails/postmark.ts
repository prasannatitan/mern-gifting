/**
 * Postmark REST API (no extra npm dependency).
 * https://postmarkapp.com/developer/api/email-api
 */

export function isPostmarkConfigured(): boolean {
  return Boolean(
    process.env.POSTMARK_SERVER_TOKEN?.trim() &&
      process.env.POSTMARK_FROM?.trim(),
  );
}

export async function sendPostmarkHtml(
  to: string,
  subject: string,
  htmlBody: string,
  textBody?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = process.env.POSTMARK_SERVER_TOKEN?.trim();
  const from = process.env.POSTMARK_FROM?.trim();
  if (!token || !from) {
    return { ok: false, error: "Postmark not configured (POSTMARK_SERVER_TOKEN, POSTMARK_FROM)" };
  }

  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: from,
      To: to,
      Subject: subject,
      HtmlBody: htmlBody,
      TextBody: textBody ?? stripHtml(htmlBody),
      MessageStream: "outbound",
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    return { ok: false, error: `Postmark ${res.status}: ${errText}` };
  }

  return { ok: true };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Base URL for links in outbound email (no trailing slash). */
export function getPublicAppUrl(): string {
  const raw =
    process.env.PUBLIC_APP_URL?.trim() ||
    process.env.API_PUBLIC_URL?.trim() ||
    `http://localhost:${process.env.PORT ?? "4000"}`;
  return raw.replace(/\/+$/, "");
}

export function buttonRow(approveUrl: string, rejectUrl: string): string {
  return `
  <p style="margin:24px 0;">
    <a href="${escapeAttr(approveUrl)}" style="display:inline-block;padding:12px 20px;background:#166534;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin-right:12px;">Approve</a>
    <a href="${escapeAttr(rejectUrl)}" style="display:inline-block;padding:12px 20px;background:#991b1b;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Reject</a>
  </p>`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

export function wrapEmail(inner: string, title: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:560px;margin:24px auto;padding:0 16px;">
${inner}
<p style="color:#666;font-size:13px;margin-top:32px;">This message was sent by your ordering system. Links expire after a few days.</p>
</body></html>`;
}

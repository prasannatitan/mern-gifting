import type { ApiOrder } from "@/lib/api";

export function OrderBillingDetails({ order }: { order: ApiOrder }) {
  const name = order.contactName?.trim();
  const phone = order.contactPhone?.trim();
  const address = order.shippingAddress?.trim();
  const city = order.shippingCity?.trim();
  const state = order.shippingState?.trim();
  const pin = order.shippingPincode?.trim();
  const gst = order.gstNumber?.trim();

  const location = [city, state].filter(Boolean).join(", ");
  const locLine =
    location && pin ? `${location} — ${pin}` : location || pin || null;
  const hasAny = Boolean(name || phone || address || locLine || gst);

  if (!hasAny) {
    return (
      <p className="text-xs text-muted-foreground">
        No checkout billing details (order placed before this feature).
      </p>
    );
  }

  return (
    <div className="space-y-1 text-xs text-muted-foreground">
      {name && (
        <p>
          <span className="font-medium text-foreground">Contact:</span> {name}
        </p>
      )}
      {phone && (
        <p>
          <span className="font-medium text-foreground">Phone:</span> {phone}
        </p>
      )}
      {address && (
        <p>
          <span className="font-medium text-foreground">Address:</span> {address}
        </p>
      )}
      {locLine && (
        <p>
          <span className="font-medium text-foreground">Location:</span> {locLine}
        </p>
      )}
      {gst && (
        <p>
          <span className="font-medium text-foreground">GST:</span> {gst}
        </p>
      )}
    </div>
  );
}

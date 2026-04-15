import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext.tsx";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { apiRequest, publicImageUrl } from "@/lib/api.ts";
import type { ApiStore } from "@/lib/api.ts";

export function Checkout() {
  const { user } = useAuth();
  const { items, totalAmount, clear, removeItem } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: "",
    address: "",
    state: "",
    city: "",
    pincode: "",
    gst: "",
  });

  if (items.length === 0 && !loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-gray-500">Your cart is empty.</p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-4 text-primary hover:underline"
        >
          Continue shopping
        </button>
      </div>
    );
  }

  const vendorId = items[0]?.vendorId;
  const sameVendor = items.every((i) => i.vendorId === vendorId);
  if (!sameVendor || !vendorId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-gray-500">Cart must contain items from one vendor. Please adjust your cart.</p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-4 text-primary hover:underline"
        >
          Back to shop
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const pincode = form.pincode.trim();
    const phone = form.phone.replace(/\D/g, "");
    if (
      !form.name.trim() ||
      !phone ||
      !form.address.trim() ||
      !form.state.trim() ||
      !form.city.trim() ||
      !pincode ||
      !/^\d{10}$/.test(phone) ||
      !/^\d{6}$/.test(pincode)
    ) {
      setError("Name, phone, address, state, city, and valid PIN are required.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      for (const item of items) {
        if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100000) {
          throw new Error(`Invalid quantity for "${item.name}". Please adjust your cart.`);
        }
      }
      const store = await apiRequest<ApiStore>("/stores/me");
      await apiRequest("/stores/orders", {
        method: "POST",
        body: JSON.stringify({
          storeId: store.id,
          vendorId,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.price,
          })),
          currency: "INR",
          contactName: form.name.trim(),
          contactPhone: phone,
          shippingAddress: form.address.trim(),
          shippingState: form.state.trim(),
          shippingCity: form.city.trim(),
          shippingPincode: pincode,
          gstNumber: form.gst.trim() || null,
        }),
      });
      clear();
      navigate("/order-success", { state: { message: "Order placed. CEE approval pending. Payment is offline—vendor will verify after you pay." } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        <p className="text-sm text-gray-500">Payment is offline. We only collect necessary details.</p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        <form onSubmit={handlePlaceOrder} className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Store details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700">Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
              <input
                type="text"
                inputMode="numeric"
                required
                pattern="[0-9]{10}"
                maxLength={10}
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address *</label>
              <textarea
                required
                rows={3}
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">State *</label>
              <input
                type="text"
                required
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City *</label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Pincode *</label>
              <input
                type="text"
                inputMode="numeric"
                required
                pattern="[0-9]{6}"
                maxLength={6}
                value={form.pincode}
                onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">GST (optional)</label>
              <input
                type="text"
                value={form.gst}
                onChange={(e) => setForm((f) => ({ ...f, gst: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
              <h2 className="font-semibold text-gray-900">Order summary</h2>
              <ul className="mt-3 space-y-2">
                {items.map((i) => (
                  <li key={i.productId} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-2 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      {i.imageUrl ? (
                        <img
                          src={publicImageUrl(i.imageUrl)}
                          alt=""
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-200 text-base">
                          💎
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-gray-700">{i.name}</p>
                        <p className="text-xs text-gray-500">Qty: {i.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p>₹{(i.price * i.quantity).toFixed(2)}</p>
                      <button
                        type="button"
                        onClick={() => removeItem(i.productId)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-gray-200 pt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Payment will be completed offline. Vendor will verify and confirm.
              </p>
              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {loading ? "Placing order…" : "Place order"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

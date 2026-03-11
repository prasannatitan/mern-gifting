import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext.tsx";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { apiRequest } from "@/lib/api.ts";
import type { ApiStore } from "@/lib/api.ts";

export function Checkout() {
  const { user } = useAuth();
  const { items, totalAmount, clear } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    contactName: user?.name ?? "",
    contactEmail: user?.email ?? "",
    contactPhone: "",
    deliveryAddress: "",
    notes: "",
    poReference: "",
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
    setLoading(true);
    setError(null);
    try {
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
            <h2 className="font-semibold text-gray-900">Contact & delivery</h2>
           
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Delivery address / notes</label>
              <textarea
                value={form.deliveryAddress}
                onChange={(e) => setForm((f) => ({ ...f, deliveryAddress: e.target.value }))}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">PO / Invoice reference (optional)</label>
              <input
                type="text"
                value={form.poReference}
                onChange={(e) => setForm((f) => ({ ...f, poReference: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
              <h2 className="font-semibold text-gray-900">Order summary</h2>
              <ul className="mt-3 space-y-2">
                {items.map((i) => (
                  <li key={i.productId} className="flex justify-between text-sm">
                    <span className="text-gray-700">{i.name} × {i.quantity}</span>
                    <span>₹{(i.price * i.quantity).toFixed(2)}</span>
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

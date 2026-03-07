import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { apiRequest, type ApiProduct } from "@/lib/api.ts";
import { useCart } from "@/contexts/CartContext.tsx";

export function Product() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!id) return;
    apiRequest<ApiProduct[]>("/products")
      .then((list) => setProduct(list.find((p) => p.id === id) ?? null))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="h-96 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-gray-500">Product not found.</p>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link to="/" className="text-sm text-gray-500 hover:text-primary">
          ← Back to products
        </Link>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div className="aspect-square rounded-xl bg-gray-100 flex items-center justify-center text-8xl text-gray-400">
            💎
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            {product.vendor?.name && (
              <p className="mt-1 text-sm text-gray-500">Vendor: {product.vendor.name}</p>
            )}
            <p className="mt-4 text-2xl font-semibold text-primary">
              ₹{Number(product.basePrice).toFixed(2)}
            </p>
            {product.description && (
              <p className="mt-4 text-gray-600">{product.description}</p>
            )}
            <div className="mt-6 flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                Qty
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="ml-2 w-16 rounded border border-gray-300 px-2 py-1 text-center"
                />
              </label>
              <button
                type="button"
                onClick={() => addToCart(product, qty)}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
              >
                Add to cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

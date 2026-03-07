import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiRequest, type ApiProduct } from "@/lib/api.ts";
import { useCart } from "@/contexts/CartContext.tsx";

export function Home() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    apiRequest<ApiProduct[]>("/products")
      .then(setProducts)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <section className="bg-primary/5 border-b border-primary/10 py-12">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Tanishq Bulk Orders
          </h1>
          <p className="mt-2 text-gray-600">
            Order for your franchise store. Login to place orders.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-xl bg-gray-200"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <Link to={`/product/${p.id}`} className="block flex-1 p-4">
                  <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center text-4xl text-gray-400">
                    💎
                  </div>
                  <h2 className="mt-2 line-clamp-2 text-sm font-medium text-gray-900">
                    {p.name}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-primary">
                    ₹{Number(p.basePrice).toFixed(2)}
                  </p>
                  {p.vendor?.name && (
                    <p className="text-xs text-gray-500">{p.vendor.name}</p>
                  )}
                </Link>
                <div className="border-t border-gray-100 p-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      addToCart(p);
                    }}
                    className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90"
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && products.length === 0 && !error && (
          <p className="py-12 text-center text-gray-500">No products yet.</p>
        )}
      </section>
    </div>
  );
}

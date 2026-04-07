import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiRequest, publicImageUrl, type ApiProduct } from "@/lib/api.ts";
import { useCart } from "@/contexts/CartContext.tsx";

const CATEGORIES = ["All", "Rings", "Necklaces", "Earrings", "Bangles", "Other"];

export function Categories() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("All");
  const { addToCart } = useCart();

  useEffect(() => {
    apiRequest<ApiProduct[]>("/products")
      .then(setProducts)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    category === "All"
      ? products
      : products.filter((p) => {
          const name = (p.name ?? "").toLowerCase();
          const cat = category.toLowerCase();
          return name.includes(cat) || (category === "Other" && !CATEGORIES.some((c) => c !== "All" && name.includes(c.toLowerCase())));
        });

  return (
    <div className="min-h-screen">
      <div className="border-b border-gray-200 bg-white py-6">
        {/* <div className="mx-auto max-w-6xl px-4">
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500">Browse by category</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  category === c
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div> */}
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <Link to={`/product/${p.id}`} className="block flex-1 p-4">
                  <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                    {p.images?.length ? (
                      <img src={publicImageUrl(p.images[0])} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-4xl text-gray-400">💎</span>
                    )}
                  </div>
                  <h2 className="mt-2 line-clamp-2 text-sm font-medium text-gray-900">
                    {p.name}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-primary">
                    ₹{Number(p.basePrice).toFixed(2)}
                  </p>
                </Link>
                <div className="border-t border-gray-100 p-3">
                  <button
                    type="button"
                    onClick={() => addToCart(p)}
                    className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90"
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && filtered.length === 0 && !error && (
          <p className="py-12 text-center text-gray-500">No products in this category.</p>
        )}
      </div>
    </div>
  );
}

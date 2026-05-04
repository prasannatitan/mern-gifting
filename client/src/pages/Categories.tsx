import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { apiRequest, publicImageUrl, type ApiProduct } from "@/lib/api.ts";
import { useCart } from "@/contexts/CartContext.tsx";

const PRICE_DEBOUNCE_MS = 400;

const CATEGORY_SLUG_TO_API: Record<string, string> = {
  festival: "FESTIVAL_GIFTS",
  anniversary: "ANNIVERSARY_GIFTS",
  personalised: "PERSONALISED_GIFTS",
  birthday: "BIRTHDAY_GIFTS",
};

const SORT_OPTIONS = ["featured", "newest", "price_asc", "price_desc", "name_asc"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

function parseSort(raw: string | null): SortOption {
  const s = raw?.trim() ?? "";
  return (SORT_OPTIONS as readonly string[]).includes(s) ? (s as SortOption) : "featured";
}

function parsePage(raw: string | null): number {
  const p = Number(raw);
  return Number.isFinite(p) && p > 0 ? Math.floor(p) : 1;
}

function parsePrice(raw: string | null): number {
  if (raw == null || raw === "") return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function Categories() {
  const { category } = useParams<{ category?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showPriceFilter, setShowPriceFilter] = useState(true);
  const [showAvailabilityFilter, setShowAvailabilityFilter] = useState(true);
  const [minAvailablePrice, setMinAvailablePrice] = useState(0);
  const [maxAvailablePrice, setMaxAvailablePrice] = useState(0);
  /** In-flight min/max while dragging price sliders or typing; committed to URL after debounce */
  const [pricePending, setPricePending] = useState<{ min: number; max: number } | null>(null);
  const { addToCart } = useCart();
  const PAGE_SIZE = 12;

  const currentPage = useMemo(() => parsePage(searchParams.get("page")), [searchParams]);
  const sortBy = useMemo(() => parseSort(searchParams.get("sort")), [searchParams]);
  const selectedMinPrice = useMemo(() => parsePrice(searchParams.get("minPrice")), [searchParams]);
  const selectedMaxPrice = useMemo(() => parsePrice(searchParams.get("maxPrice")), [searchParams]);
  const inStock = useMemo(() => searchParams.get("inStock") !== "false", [searchParams]);
  const outOfStock = useMemo(() => searchParams.get("outOfStock") === "true", [searchParams]);

  const effectiveMinPrice = pricePending?.min ?? selectedMinPrice;
  const effectiveMaxPrice = pricePending?.max ?? selectedMaxPrice;

  const minPriceParamKey = searchParams.get("minPrice") ?? "";
  const maxPriceParamKey = searchParams.get("maxPrice") ?? "";

  const queuePriceCommit = useCallback((partial: Partial<{ min: number; max: number }>) => {
    setPricePending((prev) => {
      const base = prev ?? { min: selectedMinPrice, max: selectedMaxPrice };
      return {
        min: partial.min !== undefined ? partial.min : base.min,
        max: partial.max !== undefined ? partial.max : base.max,
      };
    });
  }, [selectedMinPrice, selectedMaxPrice]);

  useEffect(() => {
    setPricePending(null);
  }, [minPriceParamKey, maxPriceParamKey]);

  useEffect(() => {
    if (pricePending === null) return;
    const t = window.setTimeout(() => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (pricePending.min > 0) p.set("minPrice", String(pricePending.min));
          else p.delete("minPrice");
          if (pricePending.max > 0) p.set("maxPrice", String(pricePending.max));
          else p.delete("maxPrice");
          p.delete("page");
          return p;
        },
        { replace: true },
      );
      setPricePending(null);
    }, PRICE_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [pricePending, setSearchParams]);

  const patchSearchParams = (mutate: (p: URLSearchParams) => void, resetPage = true) => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        mutate(p);
        if (resetPage) p.delete("page");
        return p;
      },
      { replace: true },
    );
  };

  const setPage = (next: number) => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (next <= 1) p.delete("page");
        else p.set("page", String(next));
        return p;
      },
      { replace: true },
    );
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    const normalized = (category ?? "").toLowerCase();
    const apiCategory = normalized ? CATEGORY_SLUG_TO_API[normalized] : undefined;
    const query = new URLSearchParams();
    query.set("page", String(currentPage));
    query.set("limit", String(PAGE_SIZE));
    query.set("sortBy", sortBy);
    query.set("inStock", String(inStock));
    query.set("outOfStock", String(outOfStock));
    const search = (searchParams.get("search") ?? "").trim();
    if (search) query.set("search", search);
    if (apiCategory) query.set("category", apiCategory);
    if (selectedMinPrice > 0) query.set("minPrice", String(selectedMinPrice));
    if (selectedMaxPrice > 0) query.set("maxPrice", String(selectedMaxPrice));

    apiRequest<{
      items: ApiProduct[];
      total: number;
      page: number;
      totalPages: number;
      minPrice: number;
      maxPrice: number;
    }>(`/products/paginated?${query.toString()}`)
      .then((data) => {
        setProducts(data.items);
        setTotalResults(data.total);
        setTotalPages(data.totalPages || 1);
        const nextMin = Math.floor(Number(data.minPrice ?? 0));
        const nextMax = Math.ceil(Number(data.maxPrice ?? 0));
        setMinAvailablePrice(nextMin);
        setMaxAvailablePrice(nextMax);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [category, currentPage, sortBy, inStock, outOfStock, searchParams, selectedMinPrice, selectedMaxPrice]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages >= 1) {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (totalPages <= 1) p.delete("page");
          else p.set("page", String(totalPages));
          return p;
        },
        { replace: true },
      );
    }
  }, [currentPage, totalPages, setSearchParams]);

  const priceSpan = maxAvailablePrice - minAvailablePrice;
  const sliderLow =
    priceSpan <= 0
      ? minAvailablePrice
      : effectiveMinPrice > 0
        ? Math.max(minAvailablePrice, Math.min(effectiveMinPrice, maxAvailablePrice))
        : minAvailablePrice;
  const sliderHigh =
    priceSpan <= 0
      ? maxAvailablePrice
      : effectiveMaxPrice > 0
        ? Math.min(maxAvailablePrice, Math.max(effectiveMaxPrice, minAvailablePrice))
        : maxAvailablePrice;

  const pagePriceMinMax = useMemo(() => {
    if (products.length === 0) return null;
    let min = Number(products[0].basePrice);
    let max = min;
    for (let i = 1; i < products.length; i++) {
      const pr = Number(products[i].basePrice);
      if (pr < min) min = pr;
      if (pr > max) max = pr;
    }
    return { min, max };
  }, [products]);

  const displayMinLabel =
    effectiveMinPrice > 0
      ? `₹${effectiveMinPrice.toLocaleString()}`
      : pagePriceMinMax != null
        ? `₹${Math.floor(pagePriceMinMax.min).toLocaleString()}`
        : "—";
  const displayMaxLabel =
    effectiveMaxPrice > 0
      ? `₹${effectiveMaxPrice.toLocaleString()}`
      : pagePriceMinMax != null
        ? `₹${Math.ceil(pagePriceMinMax.max).toLocaleString()}`
        : "—";

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <div className="h-fit rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
           

            <div className="mt-4 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setShowPriceFilter((v) => !v)}
                className="flex w-full items-center justify-between text-sm font-medium text-gray-900"
              >
                Price Range
                <span>{showPriceFilter ? "−" : "+"}</span>
              </button>
              {showPriceFilter && (
                <div className="mt-3">
                  <div className="mb-3 flex items-center justify-between text-sm text-gray-700">
                    <span title={effectiveMinPrice > 0 ? "Minimum price filter" : "Cheapest on this page"}>
                      {displayMinLabel}
                    </span>
                    <span title={effectiveMaxPrice > 0 ? "Maximum price filter" : "Priciest on this page"}>
                      {displayMaxLabel}
                    </span>
                  </div>
                  <div className="relative h-7">
                    <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded bg-gray-200" />
                    <div
                      className="absolute top-1/2 h-1 -translate-y-1/2 rounded bg-primary"
                      style={{
                        left: `${priceSpan <= 0 ? 0 : ((sliderLow - minAvailablePrice) / priceSpan) * 100}%`,
                        right: `${priceSpan <= 0 ? 0 : 100 - ((sliderHigh - minAvailablePrice) / priceSpan) * 100}%`,
                      }}
                    />
                    <input
                      type="range"
                      min={minAvailablePrice}
                      max={maxAvailablePrice}
                      value={sliderLow}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        const cap =
                          effectiveMaxPrice > 0
                            ? Math.min(effectiveMaxPrice, maxAvailablePrice)
                            : maxAvailablePrice;
                        const newMin = value <= minAvailablePrice ? 0 : Math.min(value, cap);
                        queuePriceCommit({ min: newMin });
                      }}
                      className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-white"
                    />
                    <input
                      type="range"
                      min={minAvailablePrice}
                      max={maxAvailablePrice}
                      value={sliderHigh}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        const floor =
                          effectiveMinPrice > 0
                            ? Math.max(effectiveMinPrice, minAvailablePrice)
                            : minAvailablePrice;
                        const newMax = value >= maxAvailablePrice ? 0 : Math.max(value, floor);
                        queuePriceCommit({ max: newMax });
                      }}
                      className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-white"
                    />
                  </div>

                 
                </div>
              )}
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setShowAvailabilityFilter((v) => !v)}
                className="flex w-full items-center justify-between text-sm font-medium text-gray-900"
              >
                Availability
                <span>{showAvailabilityFilter ? "−" : "+"}</span>
              </button>
              {showAvailabilityFilter && (
                <div className="mt-3 space-y-2 text-sm text-gray-700">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={inStock}
                      onChange={(e) => {
                        const next = e.target.checked;
                        patchSearchParams((p) => {
                          if (next) p.delete("inStock");
                          else p.set("inStock", "false");
                        });
                      }}
                    />
                    In Stock
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={outOfStock}
                      onChange={(e) => {
                        const next = e.target.checked;
                        patchSearchParams((p) => {
                          if (next) p.set("outOfStock", "true");
                          else p.delete("outOfStock");
                        });
                      }}
                    />
                    Out of Stock
                  </label>
                </div>
              )}
            </div>
          </div>

          <section>
            <div className="mb-4 flex flex-col gap-3 rounded-xl bg-white pb-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{totalResults}</span> result(s)
              </p>
              <div className="flex items-center gap-2">
                <label htmlFor="sortBy" className="text-sm text-gray-700">
                  Sort by
                </label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => {
                    const v = e.target.value as SortOption;
                    patchSearchParams((p) => {
                      if (v === "featured") p.delete("sort");
                      else p.set("sort", v);
                    });
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name_asc">Name: A to Z</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-200" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((p) => (
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

            {!loading && totalResults > 0 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-2 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}

            {!loading && totalResults === 0 && !error && (
              <p className="py-12 text-center text-gray-500">No products match selected filters.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

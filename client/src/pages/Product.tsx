import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { apiRequest, publicImageUrl, type ApiProduct } from "@/lib/api.ts";
import { useCart } from "@/contexts/CartContext.tsx";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";

export function Product() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!id) return;
    apiRequest<ApiProduct[]>("/products")
      .then((list) => setProduct(list.find((p) => p.id === id) ?? null))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const gallery = useMemo(
    () => (product?.images ?? []).map((img) => publicImageUrl(img)).filter((v): v is string => Boolean(v)),
    [product?.images],
  );

  const hasGallery = gallery.length > 0;
  const activeImage = hasGallery ? gallery[activeImageIdx] : null;
  const minOrderQty = Math.max(1, Number(product?.minOrderQuantity ?? 1));
  const stockQty = Math.max(0, Number(product?.stockQuantity ?? 0));
  const isOutOfStock = stockQty <= 0 || stockQty < minOrderQty;

  const prevImage = () => {
    if (!hasGallery) return;
    setActiveImageIdx((p) => (p - 1 + gallery.length) % gallery.length);
    setZoomed(false);
  };

  const nextImage = () => {
    if (!hasGallery) return;
    setActiveImageIdx((p) => (p + 1) % gallery.length);
    setZoomed(false);
  };

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModalOpen(false);
        setZoomed(false);
      }
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen, gallery.length]);

  useEffect(() => {
    setActiveImageIdx(0);
    setZoomed(false);
  }, [product?.id]);

  useEffect(() => {
    setQty(minOrderQty);
  }, [minOrderQty, product?.id]);

  useEffect(() => {
    if (!hasGallery) return;
    if (activeImageIdx >= gallery.length) setActiveImageIdx(0);
  }, [activeImageIdx, gallery.length, hasGallery]);

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
        <Link to="/collections" className="text-sm text-gray-700 [font-family:var(--primary-font)]">
          &larr; Back To Collections
        </Link>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div>
            <button
              type="button"
              className="aspect-square w-full rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden"
              onClick={() => hasGallery && setModalOpen(true)}
              disabled={!hasGallery}
            >
              {hasGallery && activeImage ? (
              <img
                  src={activeImage}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-8xl text-gray-400">💎</span>
              )}
            </button>
            {gallery.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {gallery.map((img, idx) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded border ${
                      idx === activeImageIdx ? "border-primary ring-1 ring-primary" : "border-gray-200"
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            {product.vendor?.name && (
              <p className="mt-1 text-sm text-gray-500">Vendor: {product.vendor.name}</p>
            )}
            <p className="mt-4 text-2xl font-semibold text-primary">
              ₹{Number(product.basePrice).toFixed(2)}
            </p>
            <div className="mt-3">
              {isOutOfStock ? (
                <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                  Out of stock
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                  In stock: {stockQty}
                </span>
              )}
            </div>
           
            <div className="mt-6 flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                Qty
                <input
                  type="number"
                  min={minOrderQty}
                  max={Math.max(minOrderQty, stockQty)}
                  value={qty}
                  onChange={(e) =>
                    setQty(
                      Math.max(minOrderQty, Math.min(stockQty || minOrderQty, parseInt(e.target.value, 10) || minOrderQty)),
                    )
                  }
                  className="ml-2 w-16 rounded border border-gray-300 px-2 py-1 text-center"
                  disabled={isOutOfStock}
                />
              </label>
              <button
                type="button"
                onClick={() => !isOutOfStock && addToCart(product, qty)}
                disabled={isOutOfStock}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {isOutOfStock ? "Out of stock" : "Add to cart"}
              </button>
            </div>
            {product.description && (
              <p className="mt-4 text-gray-600">{product.description}</p>
            )}
          </div>
        </div>
      </div>

      {modalOpen && hasGallery && activeImage && (
        <div className="fixed inset-0 z-50 bg-black/90">
          <button
            type="button"
            onClick={() => {
              setModalOpen(false);
              setZoomed(false);
            }}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close image viewer"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomed((z) => !z)}
            className="absolute right-16 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Toggle zoom"
          >
            {zoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
          </button>

          {gallery.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div className="flex h-full w-full items-center justify-center p-8">
            <img
              src={activeImage}
              alt={product.name}
              className={`max-h-full max-w-full object-contain transition-transform duration-200 ${zoomed ? "scale-125 cursor-zoom-out" : "scale-100 cursor-zoom-in"}`}
              onClick={() => setZoomed((z) => !z)}
            />
          </div>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-black/40 px-3 py-1 text-sm text-white">
            {activeImageIdx + 1} / {gallery.length}
          </p>
        </div>
      )}
    </div>
  );
}

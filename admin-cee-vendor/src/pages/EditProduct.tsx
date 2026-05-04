import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiRequest, publicImageUrl, type ApiProduct } from "@/lib/api";
import {
  buildProductDescription,
  emptyProductForm,
  parseProductDescription,
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABEL,
  type ProductFormFields,
} from "@/lib/productForm";
import { ArrowLeft, Upload } from "lucide-react";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [replaceImages, setReplaceImages] = useState(false);
  const [form, setForm] = useState<ProductFormFields>(emptyProductForm);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const p = await apiRequest<ApiProduct>(`/vendors/me/product?id=${encodeURIComponent(id)}`);
        if (cancelled) return;
        setExistingImageUrls(p.images ?? []);
        const { description, form: meta } = parseProductDescription(p.description ?? null);
        setForm({
          ...emptyProductForm(),
          ...meta,
          name: p.name,
          category: PRODUCT_CATEGORIES.includes((p.category ?? "") as ProductFormFields["category"])
            ? (p.category as ProductFormFields["category"])
            : emptyProductForm().category,
          sku: p.sku ?? "",
          minOrderQty: String(p.minOrderQuantity ?? (Number(meta.minOrderQty ?? 1) || 1)),
          maxOrderQty:
            p.maxOrderQuantity != null
              ? String(p.maxOrderQuantity)
              : String(meta.maxOrderQty ?? ""),
          stockQuantity: String(p.stockQuantity ?? (Number(meta.stockQuantity ?? 0) || 0)),
          basePrice: String(Number(p.basePrice)),
          discountPrice: p.discountPrice != null ? String(Number(p.discountPrice)) : "",
          currency: p.currency ?? "INR",
          description,
        });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load product");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const canSubmit = useMemo(() => {
    const base = Number(form.basePrice);
    const discount = form.discountPrice.trim() === "" ? null : Number(form.discountPrice);
    const discountValid = discount == null || (discount >= 0 && discount < base);
    const minQty = Math.max(1, Number(form.minOrderQty) || 1);
    const maxQty = form.maxOrderQty.trim() === "" ? null : Number(form.maxOrderQty);
    const stock = Math.max(0, Number(form.stockQuantity) || 0);
    const rangeValid = maxQty == null || maxQty >= minQty;
    return Boolean(id && form.name.trim().length > 1 && base > 0 && discountValid && rangeValid && stock >= 0);
  }, [form.basePrice, form.discountPrice, form.maxOrderQty, form.minOrderQty, form.name, form.stockQuantity, id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !id) return;

    setSaving(true);
    setError(null);
    try {
      const fullDescription = buildProductDescription(form);
      const fd = new FormData();
      fd.set("id", id);
      fd.set("name", form.name.trim());
      fd.set("category", form.category);
      fd.set("sku", form.sku.trim());
      fd.set("description", fullDescription);
      fd.set("basePrice", String(Number(form.basePrice)));
      fd.set("stockQuantity", String(Math.max(0, Number(form.stockQuantity) || 0)));
      fd.set("minOrderQuantity", String(Math.max(1, Number(form.minOrderQty) || 1)));
      if (form.maxOrderQty.trim() !== "") {
        fd.set("maxOrderQuantity", String(Number(form.maxOrderQty)));
      }
      if (form.discountPrice.trim() !== "") {
        fd.set("discountPrice", String(Number(form.discountPrice)));
      }
      fd.set("currency", form.currency || "INR");
      if (replaceImages) fd.set("replaceImages", "true");
      images.forEach((file) => fd.append("images", file));

      await apiRequest("/vendors/me/product", { method: "PATCH", body: fd });
      navigate("/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (!id) {
    return (
      <DashboardLayout title="Edit product" subtitle="">
        <p className="text-muted-foreground">Invalid product.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit product" subtitle="Update details and images. Saving may re-submit rejected items for review.">
      <div className="mb-4">
        <Button variant="outline" onClick={() => navigate("/products")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="name">Product name *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as ProductFormFields["category"] })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {PRODUCT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {PRODUCT_CATEGORY_LABEL[category]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="material">Material</Label>
              <Input id="material" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="minOrderQty">Min order qty</Label>
              <Input id="minOrderQty" type="number" value={form.minOrderQty} onChange={(e) => setForm({ ...form, minOrderQty: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="maxOrderQty">Max order qty</Label>
              <Input id="maxOrderQty" type="number" value={form.maxOrderQty} onChange={(e) => setForm({ ...form, maxOrderQty: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="stockQuantity">Stock quantity</Label>
              <Input id="stockQuantity" type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-5 md:grid-cols-2">
            <div>
              <Label htmlFor="price">Base price (INR) *</Label>
              <Input id="price" type="number" step="0.01" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="discountPrice">Discount price (INR)</Label>
              <Input id="discountPrice" type="number" step="0.01" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} />
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-card p-5">
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={6}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the product, design, usage, and key highlights."
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="e.g. ring, bridal, gold, premium"
              />
            </div>
          </div>

          {existingImageUrls.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mt-0 text-sm font-medium text-foreground">Current images</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {existingImageUrls.map((u) => (
                  <img key={u} src={publicImageUrl(u)} alt="" className="h-20 w-20 rounded object-cover border border-border" />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 rounded-xl border border-dashed border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Upload className="h-4 w-4" />
              Add or replace images
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={replaceImages}
                onChange={(e) => setReplaceImages(e.target.checked)}
              />
              Replace all existing images with the files below (otherwise new files are appended)
            </label>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="text-sm text-muted-foreground file:mr-2 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-accent-foreground"
              onChange={(e) => setImages(Array.from(e.target.files ?? []))}
            />
            {images.length > 0 && <p className="text-xs text-muted-foreground">{images.length} new file(s) selected</p>}
          </div>

          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          {form.discountPrice.trim() !== "" &&
            (Number(form.discountPrice) < 0 || Number(form.discountPrice) >= Number(form.basePrice)) && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Discount price must be less than base price.
              </p>
            )}
          {form.maxOrderQty.trim() !== "" && Number(form.maxOrderQty) < Math.max(1, Number(form.minOrderQty) || 1) && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Max order qty must be greater than or equal to min order qty.
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!canSubmit || saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/products")} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </DashboardLayout>
  );
}

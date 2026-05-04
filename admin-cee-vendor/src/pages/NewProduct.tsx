import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api";
import {
  buildProductDescription,
  emptyProductForm,
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABEL,
  type ProductFormFields,
} from "@/lib/productForm";
import { ArrowLeft, Upload } from "lucide-react";

export default function NewProductPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [form, setForm] = useState<ProductFormFields>(emptyProductForm());

  const canSubmit = useMemo(() => {
    const base = Number(form.basePrice);
    const discount = form.discountPrice.trim() === "" ? null : Number(form.discountPrice);
    const discountValid = discount == null || (discount >= 0 && discount < base);
    const minQty = Math.max(1, Number(form.minOrderQty) || 1);
    const maxQty = form.maxOrderQty.trim() === "" ? null : Number(form.maxOrderQty);
    const stock = Math.max(0, Number(form.stockQuantity) || 0);
    const rangeValid = maxQty == null || maxQty >= minQty;
    return form.name.trim().length > 1 && base > 0 && discountValid && rangeValid && stock >= 0;
  }, [form.basePrice, form.discountPrice, form.maxOrderQty, form.minOrderQty, form.name, form.stockQuantity]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setError(null);
    try {
      const fullDescription = buildProductDescription(form);
      const fd = new FormData();
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
      images.forEach((file) => fd.append("images", file));

      await apiRequest("/vendors/products", { method: "POST", body: fd });
      navigate("/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Add New Product" subtitle="Create a complete product listing for verification">
      <div className="mb-4">
        <Button variant="outline" onClick={() => navigate("/products")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Button>
      </div>

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

        <div className="space-y-3 rounded-xl border border-dashed border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Upload className="h-4 w-4" />
            Product images (multiple)
          </div>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="text-sm text-muted-foreground file:mr-2 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-accent-foreground"
            onChange={(e) => setImages(Array.from(e.target.files ?? []))}
          />
          {images.length > 0 && <p className="text-xs text-muted-foreground">{images.length} file(s) selected</p>}
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
            {saving ? "Submitting..." : "Submit for Verification"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/products")} disabled={saving}>
            Cancel
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}

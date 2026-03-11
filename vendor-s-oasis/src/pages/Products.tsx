import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { VerificationSteps } from "@/components/dashboard/VerificationSteps";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { API_BASE, apiRequest, type ApiProduct } from "@/lib/api";

type UiStatus = "pending_v1" | "pending_v2" | "approved" | "rejected" | "live";

function mapStatus(status: string): UiStatus {
  const s = status.toUpperCase();
  if (s === "PENDING_APPROVAL") return "pending_v1";
  if (s === "APPROVED") return "live";
  if (s === "REJECTED") return "rejected";
  return "pending_v1";
}

const getSteps = (status: UiStatus) => {
  switch (status) {
    case "pending_v1":
      return [
        { label: "Step 1 Review", status: "active" as const },
        { label: "Step 2 Review", status: "pending" as const },
      ];
    case "pending_v2":
      return [
        { label: "Step 1 Review", status: "completed" as const },
        { label: "Step 2 Review", status: "active" as const },
      ];
    case "approved":
    case "live":
      return [
        { label: "Step 1 Review", status: "completed" as const },
        { label: "Step 2 Review", status: "completed" as const },
      ];
    case "rejected":
      return [
        { label: "Step 1 Review", status: "completed" as const },
        { label: "Rejected", status: "pending" as const },
      ];
  }
};

const getStatusBadge = (status: UiStatus) => {
  switch (status) {
    case "pending_v1":
      return <StatusBadge label="Pending approval" variant="warning" />;
    case "pending_v2":
      return <StatusBadge label="Pending Step 2" variant="warning" />;
    case "approved":
      return <StatusBadge label="Approved" variant="info" />;
    case "live":
      return <StatusBadge label="Live" variant="success" />;
    case "rejected":
      return <StatusBadge label="Rejected" variant="destructive" />;
  }
};

const ProductsPage = () => {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", price: "", description: "" });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<ApiProduct[]>("/vendors/me/products");
      setProducts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async () => {
    if (!form.name || !form.price) return;
    setError(null);
    try {
      if (imageFiles.length > 0) {
        const fd = new FormData();
        fd.set("name", form.name);
        fd.set("description", form.description || "");
        fd.set("basePrice", String(form.price));
        fd.set("currency", "INR");
        if (form.category) fd.set("sku", form.category);
        imageFiles.forEach((file) => fd.append("images", file));
        await apiRequest("/vendors/products", { method: "POST", body: fd });
      } else {
        await apiRequest("/vendors/products", {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            description: form.description || null,
            basePrice: Number(form.price),
          }),
        });
      }
      setForm({ name: "", category: "", price: "", description: "" });
      setImageFiles([]);
      setOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create product");
    }
  };

  const filtered =
    filter === "All"
      ? products
      : filter === "Pending"
        ? products.filter((p) => mapStatus(p.status) === "pending_v1" || mapStatus(p.status) === "pending_v2")
        : filter === "Live"
          ? products.filter((p) => mapStatus(p.status) === "live" || mapStatus(p.status) === "approved")
          : products.filter((p) => mapStatus(p.status) === "rejected");

  return (
    <DashboardLayout title="Products" subtitle="Upload and track product verification">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          {["All", "Live", "Pending", "Rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === f
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#832729] text-accent-foreground hover:bg-accent/90 gap-2">
              <Plus className="w-4 h-4" /> Upload Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">Product images (optional, multiple)</p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="text-sm text-muted-foreground file:mr-2 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-accent-foreground"
                  onChange={(e) => setImageFiles(Array.from(e.target.files ?? []))}
                />
                {imageFiles.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">{imageFiles.length} file(s) selected</p>
                )}
              </div>
              <Input
                placeholder="Product name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                placeholder="Category (optional)"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <Textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <Input
                placeholder="Price (₹)"
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                onClick={handleUpload}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Submit for Verification
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl shadow-card overflow-hidden animate-fade-in">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Product</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Category</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Price</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Verification</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                  No products
                </td>
              </tr>
            ) : (
              filtered.map((product) => {
                const uiStatus = mapStatus(product.status);
                return (
                  <tr
                    key={product.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {product.images?.length > 0 ? (
                          <img
                            src={`${API_BASE}${product.images[0]}`}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <span className="text-xl">📦</span>
                        )}
                        <span className="text-sm font-medium text-foreground">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">—</td>
                    <td className="px-5 py-4 text-sm font-mono font-medium text-foreground">
                      ₹{Number(product.basePrice).toFixed(2)}
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(uiStatus)}</td>
                    <td className="px-5 py-4">
                      <VerificationSteps steps={getSteps(uiStatus)} size="sm" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default ProductsPage;

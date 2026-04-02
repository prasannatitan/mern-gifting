import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { VerificationSteps } from "@/components/dashboard/VerificationSteps";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, publicImageUrl, type ApiProduct } from "@/lib/api";

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
        <Link to="/products/new">
          <Button className="bg-[#832729] text-accent-foreground hover:bg-accent/90 gap-2">
            <Plus className="w-4 h-4" /> Add New Product
          </Button>
        </Link>
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
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Edit</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
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
                            src={publicImageUrl(product.images[0])}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <span className="text-xl">📦</span>
                        )}
                        <Link
                          to={`/products/${product.id}/edit`}
                          className="text-sm font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {product.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{product.sku ?? "—"}</td>
                    <td className="px-5 py-4 text-sm font-mono font-medium text-foreground">
                      ₹{Number(product.basePrice).toFixed(2)}
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(uiStatus)}</td>
                    <td className="px-5 py-4">
                      <VerificationSteps steps={getSteps(uiStatus)} size="sm" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/products/${product.id}/edit`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Edit
                      </Link>
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

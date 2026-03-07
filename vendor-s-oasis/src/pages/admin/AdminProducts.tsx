import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { VerificationSteps } from "@/components/dashboard/VerificationSteps";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, type ApiProduct } from "@/lib/api";

interface AdminProduct extends ApiProduct {
  vendor?: { name: string };
}

const AdminProductsPage = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"All" | "Pending" | "Approved" | "Rejected">("Pending");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<AdminProduct[]>("/admin/products");
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

  const handleApprove = async (productId: string) => {
    setActionId(productId);
    try {
      await apiRequest("/products/approve", {
        method: "POST",
        body: JSON.stringify({ productId, approve: true }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to approve");
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (productId: string) => {
    setActionId(productId);
    try {
      await apiRequest("/products/approve", {
        method: "POST",
        body: JSON.stringify({ productId, approve: false }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reject");
    } finally {
      setActionId(null);
    }
  };

  const filtered =
    filter === "All"
      ? products
      : filter === "Pending"
        ? products.filter((p) => p.status === "PENDING_APPROVAL")
        : filter === "Approved"
          ? products.filter((p) => p.status === "APPROVED")
          : products.filter((p) => p.status === "REJECTED");

  const getSteps = (status: string) => {
    if (status === "PENDING_APPROVAL")
      return [
        { label: "Step 1 Review", status: "active" as const },
        { label: "Step 2 Review", status: "pending" as const },
      ];
    if (status === "APPROVED")
      return [
        { label: "Step 1 Review", status: "completed" as const },
        { label: "Step 2 Review", status: "completed" as const },
      ];
    return [
      { label: "Step 1 Review", status: "completed" as const },
      { label: "Rejected", status: "pending" as const },
    ];
  };

  const getStatusBadge = (status: string) => {
    if (status === "PENDING_APPROVAL")
      return <StatusBadge label="Pending" variant="warning" />;
    if (status === "APPROVED")
      return <StatusBadge label="Approved" variant="success" />;
    if (status === "REJECTED")
      return <StatusBadge label="Rejected" variant="destructive" />;
    return <StatusBadge label={status} variant="muted" />;
  };

  return (
    <AdminLayout title="Products Review" subtitle="Approve or reject vendor product listings">
      <div className="flex gap-2 mb-6">
        {(["Pending", "All", "Approved", "Rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === f
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent/20"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="bg-card rounded-xl shadow-card overflow-hidden animate-fade-in">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Product</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Vendor</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Price</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Verification</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Action</th>
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
                  No products in this filter. Use “Pending” to see items awaiting approval.
                </td>
              </tr>
            ) : (
              filtered.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📦</span>
                      <span className="text-sm font-medium text-foreground">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {product.vendor?.name ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-sm font-mono font-medium text-foreground">
                    ₹{Number(product.basePrice).toFixed(2)}
                  </td>
                  <td className="px-5 py-4">{getStatusBadge(product.status)}</td>
                  <td className="px-5 py-4">
                    <VerificationSteps steps={getSteps(product.status)} size="sm" />
                  </td>
                  <td className="px-5 py-4">
                    {product.status === "PENDING_APPROVAL" && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(product.id)}
                          disabled={actionId === product.id}
                          className="bg-success text-success-foreground hover:bg-success/90 gap-1 text-xs h-8"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(product.id)}
                          disabled={actionId === product.id}
                          className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1 text-xs h-8"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </div>
                    )}
                    {product.status === "APPROVED" && (
                      <span className="text-xs text-success font-medium">✓ Approved</span>
                    )}
                    {product.status === "REJECTED" && (
                      <span className="text-xs text-destructive font-medium">✗ Rejected</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default AdminProductsPage;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Package, ShoppingCart, FileText, Truck, CreditCard } from "lucide-react";
import { apiRequest, type ApiOrder, type ApiProduct } from "@/lib/api";

type QueueItemType = "product" | "order" | "cost_letter";

interface QueueItem {
  id: string;
  type: QueueItemType;
  title: string;
  vendor: string;
  time: string;
  category: string;
}

const AdminOverview = () => {
  const navigate = useNavigate();
  const [pendingProducts, setPendingProducts] = useState<ApiProduct[]>([]);
  const [pendingOrders, setPendingOrders] = useState<ApiOrder[]>([]);
  const [costLetters, setCostLetters] = useState<ApiOrder[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const allProducts = await apiRequest<ApiProduct[]>("/admin/products");
        const costLettersData = await apiRequest<ApiOrder[]>("/admin/cost-letters");
        setPendingProducts(allProducts.filter((p) => p.status === "PENDING_APPROVAL"));
        setCostLetters(costLettersData);
        const pendingOrdersData = await apiRequest<ApiOrder[]>("/admin/orders/pending-cee");
        setPendingOrders(pendingOrdersData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load overview");
      }
    };
    void load();
  }, []);

  const pendingCostLetters = costLetters.filter(
    (o) => o.status === "ESTIMATE_SENT"
  );

  const queueItems: QueueItem[] = [
    ...pendingProducts.slice(0, 3).map((p) => ({
      id: p.id,
      type: "product" as const,
      title: `${p.name} — Pending corporate approval`,
      vendor: p.vendor?.name ?? "—",
      time: new Date(p.createdAt).toLocaleString(),
      category: "Products",
    })),
    ...pendingOrders.slice(0, 3).map((o) => ({
      id: o.id,
      type: "order" as const,
      title: `Order #${o.id.slice(0, 8)} — All regions`,
      vendor: o.vendor?.name ?? "—",
      time: new Date(o.placedAt).toLocaleString(),
      category: "Orders",
    })),
    ...pendingCostLetters.slice(0, 3).map((o) => ({
      id: o.id,
      type: "cost_letter" as const,
      title: `CL-${o.id.slice(0, 6).toUpperCase()} — Estimate`,
      vendor: o.vendor?.name ?? "—",
      time: new Date(o.estimate?.sentAt ?? o.placedAt).toLocaleString(),
      category: "Cost Letters",
    })),
  ];

  const pendingProductsCount = pendingProducts.length;
  const pendingOrdersCount = pendingOrders.length;
  const pendingCostLettersCount = pendingCostLetters.length;

  return (
    <AdminLayout
      title="Corporate dashboard"
      subtitle="Product approvals, partners, and operations"
    >
      <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Pending Products"
          value={pendingProductsCount}
          icon={<Package className="w-5 h-5 text-muted-foreground" />}
        />
        <StatCard
          label="Pending orders (all CEEs)"
          value={pendingOrdersCount}
          icon={<ShoppingCart className="w-5 h-5 text-muted-foreground" />}
        />
        <StatCard
          label="Pending Cost Letters"
          value={pendingCostLettersCount}
          icon={<FileText className="w-5 h-5 text-muted-foreground" />}
        />
        <StatCard
          label="Active Deliveries"
          value={0}
          icon={<Truck className="w-5 h-5 text-muted-foreground" />}
        />
        <StatCard
          label="Invoices to Verify"
          value={0}
          icon={<CreditCard className="w-5 h-5 text-accent-foreground" />}
          accent
        />
      </div>

      {error && (
        <p className="mb-4 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="bg-card rounded-xl shadow-card p-6 animate-fade-in">
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Pending Approval Queue
        </h2>
        <div className="space-y-3">
          {queueItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nothing pending right now.
            </p>
          ) : (
            queueItems.map((item) => (
              <div
                key={item.id}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-4 py-3 hover:bg-secondary/50 transition-colors"
                onClick={() => {
                  if (item.type === "product") navigate("/admin/products");
                  if (item.type === "cost_letter") navigate("/admin/cost-letters");
                  if (item.type === "order") navigate("/admin/orders");
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                    {item.type === "product" && (
                      <Package className="h-4 w-4 text-muted-foreground" />
                    )}
                    {item.type === "cost_letter" && (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                    {item.type === "order" && (
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.vendor} · {item.time}
                    </p>
                  </div>
                </div>
                <StatusBadge label={item.category} variant="warning" />
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOverview;

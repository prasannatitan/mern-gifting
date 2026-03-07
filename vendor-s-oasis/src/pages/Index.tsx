import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { VerificationSteps } from "@/components/dashboard/VerificationSteps";
import { Package, ShoppingCart, Truck, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, type ApiOrder, type ApiProduct } from "@/lib/api";

type ActivityType = "product" | "order" | "delivery" | "payment";

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  time: string;
  steps: { label: string; status: "completed" | "active" | "pending" }[];
}

function getOrderSteps(status: string): ActivityItem["steps"] {
  const steps = ["Received", "Verified", "Cost Letter", "Delivery", "Paid"];
  const orderFlow = [
    "PENDING_CEE_APPROVAL",
    "PENDING_VENDOR_ACCEPTANCE",
    "ESTIMATE_SENT",
    "PAYMENT_CONFIRMED",
    "SHIPPED",
    "DELIVERED",
  ];
  const idx = orderFlow.indexOf(status);
  const current = idx < 0 ? 0 : Math.min(idx + 1, 4);
  return steps.map((label, i) => ({
    label,
    status:
      i < current ? "completed" : i === current ? "active" : "pending",
  }));
}

const OverviewPage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [vendorProducts, vendorOrders] = await Promise.all([
          apiRequest<ApiProduct[]>("/vendors/me/products"),
          apiRequest<ApiOrder[]>("/vendors/me/orders"),
        ]);
        setProducts(vendorProducts);
        setOrders(vendorOrders);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to load dashboard data",
        );
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const totalProducts = products.length;
  const activeOrders = orders.filter(
    (o) =>
      ![
        "CANCELLED",
        "REJECTED_BY_VENDOR",
        "REJECTED_BY_CEE",
      ].includes(o.status),
  ).length;
  const pendingDeliveries = orders.filter((o) =>
    ["PAYMENT_CONFIRMED", "SHIPPED"].includes(o.status),
  ).length;
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "VERIFIED")
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);

  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime(),
    )
    .slice(0, 4);

  const recentActivity: ActivityItem[] = recentOrders.map((o) => {
    let type: ActivityType = "order";
    if (o.status === "ESTIMATE_SENT") type = "payment";
    else if (o.status === "SHIPPED" || o.status === "DELIVERED")
      type = "delivery";

    return {
      id: o.id,
      type,
      title: `Order #${o.id.slice(0, 8)} — ${o.status}`,
      time: new Date(o.placedAt).toLocaleString(),
      steps: getOrderSteps(o.status),
    };
  });

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle={
        user
          ? `Welcome back, ${user.name || user.email}`
          : "Welcome back, Vendor"
      }
    >
      <div className="mb-4">
        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Products"
          value={totalProducts}
          icon={<Package className="w-5 h-5 text-muted-foreground" />}
          trend={
            totalProducts > 0
              ? { value: `${totalProducts} listed`, positive: true }
              : undefined
          }
        />
        <StatCard
          label="Active Orders"
          value={activeOrders}
          icon={<ShoppingCart className="w-5 h-5 text-muted-foreground" />}
        />
        <StatCard
          label="Pending Deliveries"
          value={pendingDeliveries}
          icon={<Truck className="w-5 h-5 text-muted-foreground" />}
        />
        <StatCard
          label="Verified Revenue"
          value={`₹${totalRevenue.toLocaleString("en-IN", {
            maximumFractionDigits: 0,
          })}`}
          icon={<CreditCard className="w-5 h-5 text-accent-foreground" />}
          accent
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-card animate-fade-in rounded-xl p-6 shadow-card">
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Recent Activity
        </h2>
        {loading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        ) : recentActivity.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No recent activity yet.
          </p>
        ) : (
          <div className="space-y-4">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b border-border py-3 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                    {item.type === "product" && (
                      <Package className="h-4 w-4 text-muted-foreground" />
                    )}
                    {item.type === "order" && (
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    )}
                    {item.type === "delivery" && (
                      <Truck className="h-4 w-4 text-muted-foreground" />
                    )}
                    {item.type === "payment" && (
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.time}
                    </p>
                  </div>
                </div>
                <VerificationSteps steps={item.steps} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OverviewPage;

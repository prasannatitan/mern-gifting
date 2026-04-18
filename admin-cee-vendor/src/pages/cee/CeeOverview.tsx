import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CeeLayout } from "@/components/cee/CeeLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Building2, ShoppingCart } from "lucide-react";
import { apiRequest, type ApiOrder } from "@/lib/api";

type CeeStoreRow = {
  id: string;
  name: string;
  code: string;
};

export default function CeeOverviewPage() {
  const navigate = useNavigate();
  const [storeCount, setStoreCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const [stores, orders] = await Promise.all([
          apiRequest<CeeStoreRow[]>("/cee/me/stores"),
          apiRequest<ApiOrder[]>("/admin/orders/pending-cee"),
        ]);
        if (!cancelled) {
          setStoreCount(stores.length);
          setPendingOrders(orders.length);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CeeLayout title="CEE overview" subtitle="Your territory — stores and order approvals">
      {error && (
        <p className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => navigate("/cee/stores")}
          className="text-left"
        >
          <StatCard
            label="Stores in your territory"
            value={storeCount}
            icon={<Building2 className="h-5 w-5 text-muted-foreground" />}
          />
        </button>
        <button
          type="button"
          onClick={() => navigate("/cee/orders")}
          className="text-left"
        >
          <StatCard
            label="Orders awaiting your approval"
            value={pendingOrders}
            icon={<ShoppingCart className="h-5 w-5 text-muted-foreground" />}
            accent
          />
        </button>
      </div>
      <p className="text-sm text-muted-foreground">
        Orders from stores mapped to you appear only in your queue. After you approve, they go to the vendor.
      </p>
    </CeeLayout>
  );
}

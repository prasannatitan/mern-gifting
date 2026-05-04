import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CeeLayout } from "@/components/cee/CeeLayout";
import { apiRequest, type ApiOrder } from "@/lib/api";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { OrderBillingDetails } from "@/components/orders/OrderBillingDetails";

type CeeStoreRow = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  owner?: { name: string; email: string } | null;
  _count?: { orders: number };
};

export default function CeeStoreDetailsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [stores, setStores] = useState<CeeStoreRow[]>([]);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [storeData, orderData] = await Promise.all([
          apiRequest<CeeStoreRow[]>("/cee/me/stores"),
          apiRequest<ApiOrder[]>("/cee/orders"),
        ]);
        if (cancelled) return;
        setStores(storeData);
        setOrders(orderData);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load store details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const store = useMemo(() => stores.find((s) => s.id === storeId), [stores, storeId]);
  const storeOrders = useMemo(
    () => orders.filter((o) => (o as { storeId?: string }).storeId === storeId || o.store?.code === store?.code),
    [orders, storeId, store?.code],
  );

  return (
    <CeeLayout title="Store details" subtitle="Store profile and lifetime order log">
      <div className="mb-4">
        <Link to="/cee/stores" className="text-sm text-primary hover:underline">
          ← Back to my stores
        </Link>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">Loading…</div>
      ) : !store ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Store not found in your territory.
        </div>
      ) : (
        <>
          <section className="mb-6 rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="mb-3 text-lg font-semibold text-foreground">{store.name}</h2>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Code: </span>
                <span className="font-medium">{store.code}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Status: </span>
                <span className="font-medium">{store.isActive ? "Active" : "Paused"}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Email: </span>
                <span className="font-medium">{store.email ?? "—"}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Phone: </span>
                <span className="font-medium">{store.phone ?? "—"}</span>
              </p>
              <p className="md:col-span-2">
                <span className="text-muted-foreground">Address: </span>
                <span className="font-medium">{store.address ?? "—"}</span>
              </p>
              <p className="md:col-span-2">
                <span className="text-muted-foreground">Owner: </span>
                <span className="font-medium">
                  {store.owner?.name ?? "—"}
                  {store.owner?.email ? ` (${store.owner.email})` : ""}
                </span>
              </p>
              <p className="md:col-span-2">
                <span className="text-muted-foreground">Lifetime orders: </span>
                <span className="font-medium">{storeOrders.length}</span>
              </p>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <div className="border-b border-border px-5 py-3 text-sm font-medium text-foreground">Order log</div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Order</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Vendor</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Total</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {storeOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted-foreground">
                      No orders for this store yet.
                    </td>
                  </tr>
                ) : (
                  storeOrders.map((order) => (
                    <Fragment key={order.id}>
                      <tr className="border-b border-border transition-colors hover:bg-secondary/30">
                        <td className="px-5 py-4 font-mono text-sm font-semibold text-foreground">
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">{order.vendor?.name ?? "—"}</td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {new Date(order.placedAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 font-mono text-sm font-medium text-foreground">
                          ₹{Number(order.totalAmount).toFixed(2)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge label={formatStatus(order.status)} variant="info" />
                        </td>
                      </tr>
                      <tr className="border-b border-border bg-muted/20">
                        <td colSpan={5} className="px-5 py-3">
                          <OrderBillingDetails order={order} />
                        </td>
                      </tr>
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </>
      )}
    </CeeLayout>
  );
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    PENDING_CEE_APPROVAL: "Pending CEE approval",
    REJECTED_BY_CEE: "Rejected by CEE",
    PENDING_VENDOR_ACCEPTANCE: "Pending vendor acceptance",
    REJECTED_BY_VENDOR: "Rejected by vendor",
    ESTIMATE_SENT: "Estimate sent",
    PAYMENT_PENDING: "Payment pending",
    PAYMENT_CONFIRMED: "Payment confirmed",
    READY_TO_SHIP: "Ready to ship",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };
  return map[status] ?? status;
}

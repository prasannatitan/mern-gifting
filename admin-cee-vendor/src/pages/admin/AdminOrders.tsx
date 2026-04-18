import { Fragment, useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, type ApiOrder } from "@/lib/api";
import { OrderBillingDetails } from "@/components/orders/OrderBillingDetails";

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<ApiOrder[]>("/admin/orders/pending-cee");
      setOrders(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (orderId: string) => {
    setActionId(orderId);
    try {
      await apiRequest("/orders/cee-approval", {
        method: "POST",
        body: JSON.stringify({ orderId, approve: true }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to approve");
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (orderId: string) => {
    setActionId(orderId);
    try {
      await apiRequest("/orders/cee-approval", {
        method: "POST",
        body: JSON.stringify({ orderId, approve: false }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reject");
    } finally {
      setActionId(null);
    }
  };

  return (
    <AdminLayout
      title="Orders — all regions"
      subtitle="Corporate view: every order still pending CEE approval (any territory)"
    >
      {error && (
        <p className="mb-4 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="bg-card rounded-xl shadow-card overflow-hidden animate-fade-in">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Order ID</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Store</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Vendor</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Date</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Total</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                  No orders awaiting CEE approval.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <Fragment key={order.id}>
                  <tr className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                    <td className="px-5 py-4 text-sm font-mono font-semibold text-foreground">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {order.store?.name ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {order.vendor?.name ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {new Date(order.placedAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-sm font-mono font-medium text-foreground">
                      ₹{Number(order.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge label={order.status} variant="info" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(order.id)}
                          disabled={actionId === order.id}
                          className="bg-success text-success-foreground hover:bg-success/90 gap-1 text-xs h-8"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(order.id)}
                          disabled={actionId === order.id}
                          className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1 text-xs h-8"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-border bg-muted/30 last:border-0">
                    <td colSpan={7} className="px-5 py-3">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Store checkout details
                      </p>
                      <OrderBillingDetails order={order} />
                    </td>
                  </tr>
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default AdminOrdersPage;

import { Fragment, useState, useEffect } from "react";
import { CeeLayout } from "@/components/cee/CeeLayout";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, type ApiOrder } from "@/lib/api";
import { OrderBillingDetails } from "@/components/orders/OrderBillingDetails";

export default function CeeOrdersPage() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "REJECTED">("PENDING");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<ApiOrder[]>("/cee/orders");
      setOrders(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
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

  const visibleOrders = orders.filter((order) => {
    if (statusFilter === "PENDING") return order.status === "PENDING_CEE_APPROVAL";
    return order.status === "REJECTED_BY_CEE" || order.status === "REJECTED_BY_VENDOR";
  });

  return (
    <CeeLayout title="Order log" subtitle="View all territory orders and act on pending approvals">
      {error && (
        <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("PENDING")}
          className={`rounded-full px-3 py-1.5 text-sm transition ${
            statusFilter === "PENDING"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Pending Approval
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("REJECTED")}
          className={`rounded-full px-3 py-1.5 text-sm transition ${
            statusFilter === "REJECTED"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Rejected
        </button>
      </div>

      <div className="animate-fade-in overflow-hidden rounded-xl bg-card shadow-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Order</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Store</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Vendor</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Total</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : visibleOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                  {statusFilter === "PENDING"
                    ? "No pending approvals in your territory."
                    : "No rejected orders in your territory."}
                </td>
              </tr>
            ) : (
              visibleOrders.map((order) => (
                <Fragment key={order.id}>
                  <tr className="border-b border-border transition-colors last:border-0 hover:bg-secondary/50">
                    <td className="px-5 py-4 font-mono text-sm font-semibold text-foreground">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{order.store?.name ?? "—"}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{order.vendor?.name ?? "—"}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {new Date(order.placedAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 font-mono text-sm font-medium text-foreground">
                      ₹{Number(order.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge
                        label={formatStatus(order.status)}
                        variant={order.status === "PENDING_CEE_APPROVAL" ? "warning" : "info"}
                      />
                    </td>
                    <td className="px-5 py-4">
                      {order.status === "PENDING_CEE_APPROVAL" ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(order.id)}
                            disabled={actionId === order.id}
                            className="h-8 gap-1 bg-success text-xs text-success-foreground hover:bg-success/90"
                          >
                            <Check className="h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(order.id)}
                            disabled={actionId === order.id}
                            className="h-8 gap-1 border-destructive/30 text-xs text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-3.5 w-3.5" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No action</span>
                      )}
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

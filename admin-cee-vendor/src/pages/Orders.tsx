import { Fragment, useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { VerificationSteps } from "@/components/dashboard/VerificationSteps";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { apiRequest, type ApiOrder } from "@/lib/api";
import { OrderBillingDetails } from "@/components/orders/OrderBillingDetails";

const statusToLabel: Record<string, string> = {
  PENDING_CEE_APPROVAL: "Pending CEE",
  REJECTED_BY_CEE: "Rejected (CEE)",
  PENDING_VENDOR_ACCEPTANCE: "Pending acceptance",
  REJECTED_BY_VENDOR: "Rejected",
  ESTIMATE_SENT: "Estimate sent",
  PAYMENT_PENDING: "Payment pending",
  PAYMENT_CONFIRMED: "Payment confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const statusToVariant: Record<string, "success" | "warning" | "info" | "muted"> = {
  PENDING_CEE_APPROVAL: "info",
  PENDING_VENDOR_ACCEPTANCE: "warning",
  ESTIMATE_SENT: "info",
  PAYMENT_PENDING: "warning",
  PAYMENT_CONFIRMED: "success",
  SHIPPED: "info",
  DELIVERED: "success",
  REJECTED_BY_CEE: "destructive",
  REJECTED_BY_VENDOR: "destructive",
  CANCELLED: "muted",
};

const getOrderSteps = (status: string) => {
  const steps = ["Received", "Verified", "Cost Letter", "Delivery", "Paid"];
  const order = [
    "PENDING_CEE_APPROVAL",
    "PENDING_VENDOR_ACCEPTANCE",
    "ESTIMATE_SENT",
    "PAYMENT_CONFIRMED",
    "SHIPPED",
    "DELIVERED",
  ];
  const idx = order.indexOf(status);
  const current = idx < 0 ? 0 : Math.min(idx + 1, 4);
  return steps.map((label, i) => ({
    label,
    status:
      i < current ? ("completed" as const) : i === current ? ("active" as const) : ("pending" as const),
  }));
};

const OrdersPage = () => {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<ApiOrder[]>("/vendors/me/orders");
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

  const vendorDecision = async (orderId: string, accept: boolean, remarks?: string) => {
    setActionId(orderId);
    try {
      await apiRequest("/orders/vendor-decision", {
        method: "POST",
        body: JSON.stringify({ orderId, accept, remarks }),
      });
      if (!accept) {
        setRejectingOrderId(null);
        setRejectReason("");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update order");
    } finally {
      setActionId(null);
    }
  };

  const submitReject = async (orderId: string) => {
    const reason = rejectReason.trim();
    if (!reason) {
      setError("Rejection reason is required.");
      return;
    }
    await vendorDecision(orderId, false, reason);
  };

  const verifyPayment = async (orderId: string) => {
    setActionId(orderId);
    try {
      await apiRequest("/orders/payment-verify", {
        method: "POST",
        body: JSON.stringify({ orderId }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to verify payment");
    } finally {
      setActionId(null);
    }
  };

  return (
    <DashboardLayout title="Orders" subtitle="Track received orders and verification status">
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
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Date</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Total</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Progress</th>
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
                  No orders
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <Fragment key={order.id}>
                  <tr className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                    <td className="px-5 py-4">
                      <span className="text-sm font-mono font-semibold text-foreground">
                        #{order.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {order.store?.name ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {new Date(order.placedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-sm font-mono text-foreground">
                      ₹{Number(order.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge
                        label={statusToLabel[order.status] ?? order.status}
                        variant={statusToVariant[order.status] ?? "muted"}
                      />
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({order.paymentStatus})
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <VerificationSteps steps={getOrderSteps(order.status)} size="sm" />
                    </td>
                    <td className="px-5 py-4">
                      {order.status === "PENDING_VENDOR_ACCEPTANCE" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-success text-success-foreground hover:bg-success/90 h-8 text-xs"
                            disabled={actionId === order.id}
                            onClick={() => vendorDecision(order.id, true)}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/30 h-8 text-xs"
                            disabled={actionId === order.id}
                            onClick={() => {
                              setError(null);
                              setRejectingOrderId((prev) => (prev === order.id ? null : order.id));
                              setRejectReason("");
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {(order.status === "ESTIMATE_SENT" || order.status === "PAYMENT_PENDING") &&
                        order.paymentStatus !== "VERIFIED" && (
                          <Button
                            size="sm"
                            className="bg-amber-600 text-white hover:bg-amber-700 h-8 text-xs"
                            disabled={actionId === order.id}
                            onClick={() => verifyPayment(order.id)}
                            title="Use when offline payment has been received"
                          >
                            Mark payment complete
                          </Button>
                        )}
                    </td>
                  </tr>
                  {rejectingOrderId === order.id && (
                    <tr className="border-b border-border bg-destructive/5">
                      <td colSpan={7} className="px-5 py-3">
                        <p className="mb-2 text-xs font-medium text-destructive">
                          Enter vendor rejection reason (will be emailed to CEE and store)
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={2}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            placeholder="Reason for rejection..."
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={actionId === order.id}
                              onClick={() => submitReject(order.id)}
                            >
                              Confirm reject
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => {
                                setRejectingOrderId(null);
                                setRejectReason("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr className="border-b border-border bg-muted/30 last:border-0">
                    <td colSpan={7} className="px-5 py-3">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Checkout details
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
    </DashboardLayout>
  );
};

export default OrdersPage;

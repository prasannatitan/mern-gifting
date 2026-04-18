import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { CreditCard, IndianRupee, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, type ApiOrder } from "@/lib/api";

const PaymentsPage = () => {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

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

  const verified = orders.filter((o) => o.paymentStatus === "VERIFIED");
  const unpaid = orders.filter(
    (o) =>
      o.paymentStatus !== "VERIFIED" &&
      (o.status === "ESTIMATE_SENT" || o.status === "PAYMENT_PENDING")
  );
  const totalPaid = verified.reduce((s, o) => s + Number(o.totalAmount), 0);
  const totalPending = unpaid.reduce((s, o) => s + Number(o.totalAmount), 0);

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
    <DashboardLayout title="Payments" subtitle="PO Invoices and payment tracking">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total Verified"
          value={`₹${totalPaid.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
          icon={<CheckCircle2 className="w-5 h-5 text-success" />}
          accent
        />
        <StatCard
          label="Pending Payment"
          value={`₹${totalPending.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
          icon={<IndianRupee className="w-5 h-5 text-muted-foreground" />}
        />
        <StatCard
          label="Orders to verify"
          value={String(unpaid.length)}
          icon={<CreditCard className="w-5 h-5 text-muted-foreground" />}
        />
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
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Order</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Store</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Amount</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Payment</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                  No orders
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                >
                  <td className="px-5 py-4 text-sm font-mono font-semibold text-foreground">
                    #{order.id.slice(0, 8)}
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {order.store?.name ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-sm font-mono font-bold text-foreground">
                    ₹{Number(order.totalAmount).toFixed(2)}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge
                      label={order.paymentStatus}
                      variant={
                        order.paymentStatus === "VERIFIED" ? "success" : "warning"
                      }
                    />
                  </td>
                  <td className="px-5 py-4">
                    {order.paymentStatus !== "VERIFIED" &&
                      (order.status === "ESTIMATE_SENT" || order.status === "PAYMENT_PENDING") && (
                      <Button
                        size="sm"
                        className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs"
                        disabled={actionId === order.id}
                        onClick={() => verifyPayment(order.id)}
                      >
                        {actionId === order.id ? "Updating…" : "Mark payment verified"}
                      </Button>
                    )}
                    {order.paymentStatus === "VERIFIED" && (
                      <span className="text-xs text-success font-medium">✓ Verified</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default PaymentsPage;

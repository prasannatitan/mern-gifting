import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { VerificationSteps } from "@/components/dashboard/VerificationSteps";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest, type ApiOrder, type ApiEstimateCreate } from "@/lib/api";

const CostLettersPage = () => {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    orderId: "",
    subtotal: "",
    taxAmount: "",
    shippingAmount: "",
    grandTotal: "",
    notes: "",
    sentToEmail: "",
  });

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

  const ordersNeedingEstimate = orders.filter(
    (o) =>
      o.status === "PENDING_VENDOR_ACCEPTANCE" ||
      o.status === "ESTIMATE_SENT"
  );

  const handleCreate = async () => {
    const subtotal = Number(form.subtotal);
    const taxAmount = Number(form.taxAmount);
    const shippingAmount = Number(form.shippingAmount);
    const grandTotal = Number(form.grandTotal);
    if (!form.orderId || isNaN(subtotal) || isNaN(taxAmount) || isNaN(shippingAmount) || isNaN(grandTotal) || !form.sentToEmail) {
      setError("Fill order ID, all amounts and recipient email");
      return;
    }
    setError(null);
    try {
      await apiRequest("/orders/estimate", {
        method: "POST",
        body: JSON.stringify({
          orderId: form.orderId,
          subtotal,
          taxAmount,
          shippingAmount,
          grandTotal,
          notes: form.notes || undefined,
          sentToEmail: form.sentToEmail,
        } as ApiEstimateCreate),
      });
      setForm({
        orderId: "",
        subtotal: "",
        taxAmount: "",
        shippingAmount: "",
        grandTotal: "",
        notes: "",
        sentToEmail: "",
      });
      setOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create estimate");
    }
  };

  return (
    <DashboardLayout title="Cost Letters" subtitle="Create and track estimate cost letters">
      <div className="flex justify-end mb-6">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#832729] text-accent-foreground hover:bg-accent/90 gap-2">
              <Plus className="w-4 h-4" /> Create Cost Letter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Estimate (Cost Letter)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                placeholder="Order ID (e.g. paste from list)"
                value={form.orderId}
                onChange={(e) => setForm({ ...form, orderId: e.target.value })}
              />
              <Input
                placeholder="Subtotal (₹)"
                type="number"
                step="0.01"
                value={form.subtotal}
                onChange={(e) => setForm({ ...form, subtotal: e.target.value })}
              />
              <Input
                placeholder="Tax (₹)"
                type="number"
                step="0.01"
                value={form.taxAmount}
                onChange={(e) => setForm({ ...form, taxAmount: e.target.value })}
              />
              <Input
                placeholder="Shipping (₹)"
                type="number"
                step="0.01"
                value={form.shippingAmount}
                onChange={(e) => setForm({ ...form, shippingAmount: e.target.value })}
              />
              <Input
                placeholder="Grand total (₹)"
                type="number"
                step="0.01"
                value={form.grandTotal}
                onChange={(e) => setForm({ ...form, grandTotal: e.target.value })}
              />
              <Input
                placeholder="Send estimate to email"
                type="email"
                value={form.sentToEmail}
                onChange={(e) => setForm({ ...form, sentToEmail: e.target.value })}
              />
              <Textarea
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                onClick={handleCreate}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Submit & Send to Store
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <p className="mb-4 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="bg-card rounded-xl shadow-card p-8 text-center text-muted-foreground">
            Loading…
          </div>
        ) : ordersNeedingEstimate.length === 0 ? (
          <div className="bg-card rounded-xl shadow-card p-8 text-center text-muted-foreground">
            No orders in cost letter flow. Accept orders from Orders first.
          </div>
        ) : (
          ordersNeedingEstimate.map((order) => (
            <div
              key={order.id}
              className="bg-card rounded-xl shadow-card p-5 flex items-center justify-between animate-fade-in"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      Order #{order.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {order.store?.name ?? "—"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {order.items?.length ?? 0} items · ₹{Number(order.totalAmount).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {order.estimate ? (
                  <span className="text-sm text-muted-foreground">
                    Estimate sent · ₹{Number(order.estimate.grandTotal).toFixed(2)}
                  </span>
                ) : (
                  <StatusBadge label={order.status} variant="warning" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};

export default CostLettersPage;

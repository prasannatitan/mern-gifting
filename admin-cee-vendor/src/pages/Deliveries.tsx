import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Truck, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest, type ApiOrder } from "@/lib/api";

const DeliveriesPage = () => {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [shipForm, setShipForm] = useState({
    orderId: "",
    courier: "",
    trackingNumber: "",
    trackingUrl: "",
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

  const withShipment = orders.filter((o) => o.shipment || o.status === "PAYMENT_CONFIRMED" || o.status === "SHIPPED" || o.status === "DELIVERED");

  const handleCreateShipment = async () => {
    if (!shipForm.orderId) {
      setError("Order ID required");
      return;
    }
    setError(null);
    try {
      await apiRequest("/orders/shipment", {
        method: "POST",
        body: JSON.stringify({
          orderId: shipForm.orderId,
          courier: shipForm.courier || undefined,
          trackingNumber: shipForm.trackingNumber || undefined,
          trackingUrl: shipForm.trackingUrl || undefined,
        }),
      });
      setShipForm({ orderId: "", courier: "", trackingNumber: "", trackingUrl: "" });
      setOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create shipment");
    }
  };

  const statusConfig: Record<string, { label: string; variant: "warning" | "info" | "success" | "destructive"; icon: typeof Truck }> = {
    PAYMENT_CONFIRMED: { label: "Ready to ship", variant: "warning", icon: AlertTriangle },
    SHIPPED: { label: "Shipped", variant: "info", icon: Truck },
    DELIVERED: { label: "Delivered", variant: "success", icon: CheckCircle2 },
  };

  return (
    <DashboardLayout title="Deliveries" subtitle="Delivery alerts and tracking">
      <div className="flex justify-end mb-6">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#832729] text-accent-foreground hover:bg-accent/90 gap-2">
              <Truck className="w-4 h-4" /> Add shipment / tracking
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add shipment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                placeholder="Order ID"
                value={shipForm.orderId}
                onChange={(e) => setShipForm({ ...shipForm, orderId: e.target.value })}
              />
              <Input
                placeholder="Courier name"
                value={shipForm.courier}
                onChange={(e) => setShipForm({ ...shipForm, courier: e.target.value })}
              />
              <Input
                placeholder="Tracking number"
                value={shipForm.trackingNumber}
                onChange={(e) => setShipForm({ ...shipForm, trackingNumber: e.target.value })}
              />
              <Input
                placeholder="Tracking URL"
                value={shipForm.trackingUrl}
                onChange={(e) => setShipForm({ ...shipForm, trackingUrl: e.target.value })}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                onClick={handleCreateShipment}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Mark as shipped
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
        ) : withShipment.length === 0 ? (
          <div className="bg-card rounded-xl shadow-card p-8 text-center text-muted-foreground">
            No deliveries yet. Verify payment on Orders, then add shipment here.
          </div>
        ) : (
          withShipment.map((order) => {
            const cfg = statusConfig[order.status] ?? {
              label: order.status,
              variant: "info" as const,
              icon: Clock,
            };
            const shipment = order.shipment;
            return (
              <div
                key={order.id}
                className="bg-card rounded-xl shadow-card p-5 animate-fade-in"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <cfg.icon className="w-5 h-5 text-muted-foreground" />
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
                        ₹{Number(order.totalAmount).toFixed(2)} · {order.items?.length ?? 0} items
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {shipment?.trackingNumber && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Tracking</p>
                        <p className="text-sm font-mono text-foreground">
                          {shipment.trackingNumber}
                        </p>
                        {shipment.trackingUrl && (
                          <a
                            href={shipment.trackingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            Track
                          </a>
                        )}
                      </div>
                    )}
                    <StatusBadge label={cfg.label} variant={cfg.variant} icon={cfg.icon} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
};

export default DeliveriesPage;

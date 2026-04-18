import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Truck, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface Delivery {
  id: string;
  orderId: string;
  vendor: string;
  product: string;
  status: "alert" | "dispatched" | "in_transit" | "delivered";
  estimatedDate: string;
  trackingId: string;
}

const deliveries: Delivery[] = [
  { id: "DLV-301", orderId: "ORD-1042", vendor: "Vendor A", product: "Wireless Headphones x2", status: "alert", estimatedDate: "Feb 25, 2026", trackingId: "TRK9981234" },
  { id: "DLV-300", orderId: "ORD-1041", vendor: "Vendor B", product: "Cotton T-Shirt x5", status: "dispatched", estimatedDate: "Feb 24, 2026", trackingId: "TRK9981230" },
  { id: "DLV-299", orderId: "ORD-1039", vendor: "Vendor C", product: "Bluetooth Speaker x3", status: "in_transit", estimatedDate: "Feb 23, 2026", trackingId: "TRK9981226" },
  { id: "DLV-298", orderId: "ORD-1038", vendor: "Vendor C", product: "Running Shoes x2", status: "delivered", estimatedDate: "Feb 20, 2026", trackingId: "TRK9981222" },
  { id: "DLV-297", orderId: "ORD-1037", vendor: "Vendor A", product: "Leather Wallet x10", status: "delivered", estimatedDate: "Feb 18, 2026", trackingId: "TRK9981218" },
];

const statusConfig: Record<Delivery["status"], { label: string; variant: "warning" | "info" | "success" | "destructive"; icon: typeof Truck }> = {
  alert: { label: "Action Required", variant: "warning", icon: AlertTriangle },
  dispatched: { label: "Dispatched", variant: "info", icon: Truck },
  in_transit: { label: "In Transit", variant: "info", icon: Clock },
  delivered: { label: "Delivered", variant: "success", icon: CheckCircle2 },
};

const AdminDeliveriesPage = () => {
  return (
    <AdminLayout title="Deliveries Overview" subtitle="Track all vendor deliveries">
      <div className="space-y-4">
        {deliveries.map((d) => {
          const cfg = statusConfig[d.status];
          return (
            <div
              key={d.id}
              className={`bg-card rounded-xl shadow-card p-5 animate-fade-in ${
                d.status === "alert" ? "ring-2 ring-warning/30" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      d.status === "alert" ? "bg-warning/10" : "bg-secondary"
                    }`}
                  >
                    <cfg.icon className={`w-5 h-5 ${d.status === "alert" ? "text-warning" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{d.id}</span>
                      <span className="text-xs text-muted-foreground">→ {d.orderId}</span>
                      <span className="text-xs text-muted-foreground">· {d.vendor}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{d.product}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Est. Delivery</p>
                    <p className="text-sm font-medium text-foreground">{d.estimatedDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Tracking</p>
                    <p className="text-sm font-mono text-foreground">{d.trackingId}</p>
                  </div>
                  <StatusBadge label={cfg.label} variant={cfg.variant} icon={cfg.icon} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
};

export default AdminDeliveriesPage;

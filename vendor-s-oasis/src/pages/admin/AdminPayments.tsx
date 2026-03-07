import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { CreditCard, CheckCircle2, IndianRupee, FileCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Payment {
  id: string;
  orderId: string;
  vendor: string;
  amount: string;
  invoiceStatus: "pending_upload" | "submitted" | "verified" | "paid";
  date: string;
}

const initialPayments: Payment[] = [
  { id: "PAY-401", orderId: "ORD-1038", vendor: "Vendor C", amount: "₹7,800", invoiceStatus: "pending_upload", date: "Feb 22, 2026" },
  { id: "PAY-400", orderId: "ORD-1037", vendor: "Vendor A", amount: "₹13,500", invoiceStatus: "submitted", date: "Feb 20, 2026" },
  { id: "PAY-399", orderId: "ORD-1036", vendor: "Vendor D", amount: "₹2,499", invoiceStatus: "verified", date: "Feb 18, 2026" },
  { id: "PAY-398", orderId: "ORD-1035", vendor: "Vendor B", amount: "₹9,200", invoiceStatus: "paid", date: "Feb 15, 2026" },
  { id: "PAY-397", orderId: "ORD-1034", vendor: "Vendor A", amount: "₹5,600", invoiceStatus: "paid", date: "Feb 12, 2026" },
];

const invoiceStatusConfig: Record<Payment["invoiceStatus"], { label: string; variant: "warning" | "info" | "success" | "muted" }> = {
  pending_upload: { label: "Awaiting Invoice", variant: "muted" },
  submitted: { label: "Invoice Submitted", variant: "warning" },
  verified: { label: "Invoice Verified", variant: "info" },
  paid: { label: "Paid", variant: "success" },
};

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState(initialPayments);

  const handleVerifyInvoice = (id: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id && p.invoiceStatus === "submitted" ? { ...p, invoiceStatus: "verified" as const } : p))
    );
  };

  const handleMarkPaid = (id: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id && p.invoiceStatus === "verified" ? { ...p, invoiceStatus: "paid" as const } : p))
    );
  };

  return (
    <AdminLayout title="Payments Management" subtitle="Verify invoices and process payments">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total Paid"
          value="₹14,800"
          icon={<CheckCircle2 className="w-5 h-5 text-success" />}
          accent
        />
        <StatCard
          label="Pending Verification"
          value={payments.filter((p) => p.invoiceStatus === "submitted").length}
          icon={<FileCheck className="w-5 h-5 text-muted-foreground" />}
        />
        <StatCard
          label="Ready to Pay"
          value={payments.filter((p) => p.invoiceStatus === "verified").length}
          icon={<IndianRupee className="w-5 h-5 text-muted-foreground" />}
        />
      </div>

      <div className="bg-card rounded-xl shadow-card overflow-hidden animate-fade-in">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Payment ID</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Order</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Vendor</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Amount</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Date</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => {
              const cfg = invoiceStatusConfig[payment.invoiceStatus];
              return (
                <tr key={payment.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                  <td className="px-5 py-4 text-sm font-mono font-semibold text-foreground">{payment.id}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{payment.orderId}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{payment.vendor}</td>
                  <td className="px-5 py-4 text-sm font-mono font-bold text-foreground">{payment.amount}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{payment.date}</td>
                  <td className="px-5 py-4">
                    <StatusBadge label={cfg.label} variant={cfg.variant} />
                  </td>
                  <td className="px-5 py-4">
                    {payment.invoiceStatus === "submitted" && (
                      <Button
                        size="sm"
                        onClick={() => handleVerifyInvoice(payment.id)}
                        className="bg-success text-success-foreground hover:bg-success/90 gap-1 text-xs h-8"
                      >
                        <Check className="w-3.5 h-3.5" /> Verify Invoice
                      </Button>
                    )}
                    {payment.invoiceStatus === "verified" && (
                      <Button
                        size="sm"
                        onClick={() => handleMarkPaid(payment.id)}
                        className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1 text-xs h-8"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Mark Paid
                      </Button>
                    )}
                    {payment.invoiceStatus === "paid" && (
                      <span className="text-xs text-success font-medium">✓ Complete</span>
                    )}
                    {payment.invoiceStatus === "pending_upload" && (
                      <span className="text-xs text-muted-foreground">Waiting for vendor</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default AdminPaymentsPage;

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { VerificationSteps } from "@/components/dashboard/VerificationSteps";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { FileText, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, type ApiOrder } from "@/lib/api";

interface CostLetter {
  id: string;
  orderId: string;
  vendor: string;
  totalCost: string;
  description: string;
  status: "draft" | "pending_v1" | "pending_v2" | "approved" | "rejected";
  createdAt: string;
}

const getSteps = (status: CostLetter["status"]) => {
  switch (status) {
    case "draft":
      return [
        { label: "Step 1 Review", status: "pending" as const },
        { label: "Step 2 Review", status: "pending" as const },
      ];
    case "pending_v1":
      return [
        { label: "Step 1 Review", status: "active" as const },
        { label: "Step 2 Review", status: "pending" as const },
      ];
    case "pending_v2":
      return [
        { label: "Step 1 Review", status: "completed" as const },
        { label: "Step 2 Review", status: "active" as const },
      ];
    case "approved":
      return [
        { label: "Step 1 Review", status: "completed" as const },
        { label: "Step 2 Review", status: "completed" as const },
      ];
    case "rejected":
      return [
        { label: "Step 1 Review", status: "completed" as const },
        { label: "Rejected", status: "pending" as const },
      ];
  }
};

const statusBadge = (status: CostLetter["status"]) => {
  const map: Record<string, { label: string; variant: "warning" | "success" | "destructive" | "muted" }> = {
    draft: { label: "Draft", variant: "muted" },
    pending_v1: { label: "Pending Step 1", variant: "warning" },
    pending_v2: { label: "Pending Step 2", variant: "warning" },
    approved: { label: "Approved", variant: "success" },
    rejected: { label: "Rejected", variant: "destructive" },
  };
  const cfg = map[status];
  return <StatusBadge label={cfg.label} variant={cfg.variant} />;
};

const AdminCostLettersPage = () => {
  const [letters, setLetters] = useState<CostLetter[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const orders = await apiRequest<ApiOrder[]>("/admin/cost-letters");
        const mapped: CostLetter[] = orders
          .filter((o) => o.estimate)
          .map((o) => {
            const status =
              o.status === "ESTIMATE_SENT"
                ? ("pending_v1" as const)
                : o.status === "PAYMENT_CONFIRMED" ||
                  o.status === "SHIPPED" ||
                  o.status === "DELIVERED"
                ? ("approved" as const)
                : ("pending_v2" as const);

            return {
              id: `CL-${o.id.slice(0, 6).toUpperCase()}`,
              orderId: o.id,
              vendor: o.vendor?.name ?? "—",
              totalCost: `₹${o.estimate?.grandTotal.toFixed(2) ?? "0.00"}`,
              description: o.estimate?.notes ?? "",
              status,
              createdAt: new Date(o.estimate?.sentAt ?? o.placedAt).toLocaleDateString(),
            };
          });
        setLetters(mapped);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load cost letters");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const handleApprove = (id: string) => {
    setLetters((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        if (l.status === "pending_v1") return { ...l, status: "pending_v2" as const };
        if (l.status === "pending_v2") return { ...l, status: "approved" as const };
        return l;
      })
    );
  };

  const handleReject = (id: string) => {
    setLetters((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: "rejected" as const } : l))
    );
  };

  const filtered = filter === "All" ? letters :
    filter === "Pending" ? letters.filter(l => l.status === "pending_v1" || l.status === "pending_v2") :
    filter === "Approved" ? letters.filter(l => l.status === "approved") :
    letters.filter(l => l.status === "rejected");

  return (
    <AdminLayout title="Cost Letters Review" subtitle="Approve or reject vendor cost estimates">
      <div className="flex gap-2 mb-6">
        {["All", "Pending", "Approved", "Rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === f
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent/20"
            }`}
          >
            {f}
          </button>
        ))}
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
        ) : filtered.length === 0 ? (
          <div className="bg-card rounded-xl shadow-card p-8 text-center text-muted-foreground">
            No cost letters found.
          </div>
        ) : (
          filtered.map((letter) => (
            <div key={letter.id} className="bg-card rounded-xl shadow-card p-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{letter.id}</span>
                      <span className="text-xs text-muted-foreground">→ {letter.orderId}</span>
                      <span className="text-xs text-muted-foreground">· {letter.vendor}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{letter.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono font-bold text-foreground">{letter.totalCost}</span>
                  {statusBadge(letter.status)}
                  <VerificationSteps steps={getSteps(letter.status)} size="sm" />
                  {(letter.status === "pending_v1" || letter.status === "pending_v2") && (
                    <div className="flex items-center gap-2 ml-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(letter.id)}
                        className="bg-success text-success-foreground hover:bg-success/90 gap-1 text-xs h-8"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(letter.id)}
                        className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1 text-xs h-8"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCostLettersPage;

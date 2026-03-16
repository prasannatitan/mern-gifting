import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { apiRequest, type ApiStoreAdmin } from "@/lib/api";
import { Pause, Play, Store } from "lucide-react";

const AdminStoresPage = () => {
  const [stores, setStores] = useState<ApiStoreAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<ApiStoreAdmin[]>("/admin/stores");
      setStores(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load stores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (storeId: string, isActive: boolean) => {
    setActionId(storeId);
    try {
      await apiRequest("/admin/stores", {
        method: "PATCH",
        body: JSON.stringify({ storeId, isActive }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update store");
    } finally {
      setActionId(null);
    }
  };

  return (
    <AdminLayout
      title="Stores"
      subtitle="View and manage store (franchise) accounts. Pause to block new orders."
    >
      {error && (
        <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="bg-card rounded-xl shadow-card overflow-hidden animate-fade-in">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Store</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Owner</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Contact</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Orders</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : stores.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                  No stores yet.
                </td>
              </tr>
            ) : (
              stores.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Store className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{s.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm">
                    {s.owner ? (
                      <>
                        <p className="text-foreground">{s.owner.name}</p>
                        <p className="text-xs text-muted-foreground">{s.owner.email}</p>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    {s.email && <p className="text-foreground">{s.email}</p>}
                    {s.phone && <p className="text-muted-foreground">{s.phone}</p>}
                    {!s.email && !s.phone && "—"}
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-foreground">
                    {s._count?.orders ?? 0}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        s.isActive ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {s.isActive ? "Active" : "Paused"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionId === s.id}
                      onClick={() => toggleActive(s.id, !s.isActive)}
                      className={
                        s.isActive
                          ? "text-amber-600 border-amber-300 hover:bg-amber-50 gap-1 text-xs h-8"
                          : "text-success border-success/30 hover:bg-success/10 gap-1 text-xs h-8"
                      }
                    >
                      {s.isActive ? (
                        <>
                          <Pause className="w-3.5 h-3.5" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" /> Activate
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default AdminStoresPage;

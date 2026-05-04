import { useEffect, useState } from "react";
import { CeeLayout } from "@/components/cee/CeeLayout";
import { apiRequest } from "@/lib/api";
import { useNavigate } from "react-router-dom";

type CeeStoreRow = {
  id: string;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  owner?: { name: string; email: string } | null;
  _count?: { orders: number };
};

export default function CeeStoresPage() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<CeeStoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest<CeeStoreRow[]>("/cee/me/stores");
        if (!cancelled) setStores(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load stores");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CeeLayout title="My stores" subtitle="Tanishq stores assigned to your territory">
      {error && (
        <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Code</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Owner</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Contact</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Orders</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
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
                  No stores are mapped to your account yet. Ask corporate admin to assign your territory.
                </td>
              </tr>
            ) : (
              stores.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => navigate(`/cee/stores/${s.id}`)}
                  className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                >
                  <td className="px-5 py-3 font-mono text-sm">{s.code}</td>
                  <td className="px-5 py-3 text-sm font-medium">{s.name}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">
                    {s.owner?.name ?? "—"}
                    <br />
                    <span className="text-xs">{s.owner?.email ?? ""}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">
                    {s.email ?? "—"}
                    {s.phone ? <span className="block text-xs">{s.phone}</span> : null}
                  </td>
                  <td className="px-5 py-3 text-sm">{s._count?.orders ?? 0}</td>
                  <td className="px-5 py-3 text-sm">
                    {s.isActive ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                        Paused
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </CeeLayout>
  );
}

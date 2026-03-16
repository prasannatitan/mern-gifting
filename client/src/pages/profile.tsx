import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { apiRequest } from "@/lib/api.ts";
import type { ApiStore, ApiOrder } from "@/lib/api.ts";
import { LogOut, User, Package, MapPin } from "lucide-react";

function orderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING_CEE_APPROVAL: "Pending approval",
    REJECTED_BY_CEE: "Rejected",
    PENDING_VENDOR_ACCEPTANCE: "With vendor",
    REJECTED_BY_VENDOR: "Rejected by vendor",
    ESTIMATE_SENT: "Estimate sent",
    PAYMENT_PENDING: "Payment pending",
    PAYMENT_CONFIRMED: "Payment confirmed",
    READY_TO_SHIP: "Ready to ship",
    SHIPPED: "Dispatched",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };
  return labels[status] ?? status;
}

function orderStatusVariant(status: string): "pending" | "success" | "warning" | "destructive" {
  if (["SHIPPED", "DELIVERED", "PAYMENT_CONFIRMED"].includes(status)) return "success";
  if (["REJECTED_BY_CEE", "REJECTED_BY_VENDOR", "CANCELLED"].includes(status)) return "destructive";
  if (["PENDING_CEE_APPROVAL", "PENDING_VENDOR_ACCEPTANCE", "PAYMENT_PENDING"].includes(status)) return "pending";
  return "warning";
}

export function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<ApiStore | null>(null);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setOrdersLoading(true);
    setOrdersError(null);
    apiRequest<ApiStore>("/stores/me")
      .then(setStore)
      .catch(() => setStore(null));
    apiRequest<ApiOrder[]>("/stores/me/orders")
      .then(setOrders)
      .catch((e) => {
        setOrdersError(e instanceof Error ? e.message : "Failed to load orders");
        setOrders([]);
      })
      .finally(() => setOrdersLoading(false));
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
        <p className="mt-2 text-gray-600">Please log in to view your profile and orders.</p>
        <Link
          to="/login?from=/profile"
          className="mt-4 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
        >
          Log in
        </Link>
      </div>
    );
  }

  const statusClass = (status: string) => {
    const v = orderStatusVariant(status);
    if (v === "success") return "bg-green-100 text-green-800";
    if (v === "destructive") return "bg-red-100 text-red-800";
    if (v === "warning") return "bg-amber-100 text-amber-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 [font-family:var(--secondary-font)]">My Profile</h1>

      {/* User details */}
      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-600">{user.email}</p>
            <p className="mt-1 text-xs text-gray-500 capitalize">{user.role.replace("_", " ")}</p>
          </div>
        </div>
        {store && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
            <MapPin className="h-4 w-4 shrink-0 text-gray-500" />
            <span>
              Store: <strong>{store.name}</strong>
              {store.code && ` (${store.code})`}
            </span>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Continue shopping
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </section>

      {/* My orders */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 [font-family:var(--secondary-font)]">
          <Package className="h-5 w-5" />
          My Orders
        </h2>

        {ordersError && (
          <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            {ordersError}
          </p>
        )}

        {ordersLoading ? (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">You haven’t placed any orders yet.</p>
            <Link
              to="/"
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {orders.map((order) => (
              <li
                key={order.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm text-gray-500">
                      Order #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.placedAt).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })}
                      {order.vendor?.name && (
                        <span className="ml-2 text-gray-500">· {order.vendor.name}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(order.status)}`}
                    >
                      {orderStatusLabel(order.status)}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{Number(order.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
                {order.shipment?.trackingNumber && order.status === "SHIPPED" && (
                  <p className="mt-2 text-xs text-gray-500">
                    Tracking: {order.shipment.trackingNumber}
                    {order.shipment.trackingUrl && (
                      <a
                        href={order.shipment.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-primary hover:underline"
                      >
                        Track
                      </a>
                    )}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

import { Link } from "react-router-dom";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext.tsx";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { API_BASE } from "@/lib/api.ts";

interface CartSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function CartSidebar({ open, onClose }: CartSidebarProps) {
  const { user } = useAuth();
  const { items, removeItem, updateQty, totalItems, totalAmount } = useCart();

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-xl"
        aria-label="Cart"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">Your Cart</h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-500">
              <ShoppingBag className="h-12 w-12" />
              <p className="text-sm">Your cart is empty</p>
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-medium text-primary hover:underline"
              >
                <a href="/collections">Continue shopping</a>
                
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3"
                >
                  {item.imageUrl ? (
                    <img
                      src={`${API_BASE}${item.imageUrl}`}
                      alt=""
                      className="h-12 w-12 rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded bg-gray-200 shrink-0 flex items-center justify-center text-lg">
                      💎
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      ₹{item.price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateQty(item.productId, item.quantity - 1)}
                      className="rounded p-1 text-gray-500 hover:bg-gray-200"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.productId, item.quantity + 1)}
                      className="rounded p-1 text-gray-500 hover:bg-gray-200"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-200 p-4">
            <div className="mb-3 flex justify-between text-sm">
              <span className="text-gray-600">Subtotal ({totalItems} items)</span>
              <span className="font-semibold text-gray-900">
                ₹{totalAmount.toFixed(2)}
              </span>
            </div>
            <Link
              to={user ? "/checkout" : "/login?from=/checkout"}
              onClick={onClose}
              className="block w-full rounded-lg bg-primary py-2.5 text-center text-sm font-medium text-white hover:bg-primary/90"
            >
              {user ? "Proceed to Checkout" : "Login to Checkout"}
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext.tsx";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { publicImageUrl } from "@/lib/api.ts";

function CartQuantityControls({
  productId,
  quantity,
  min,
  max,
  minTooltipText,
  maxTooltipText,
  updateQty,
}: {
  productId: string;
  quantity: number;
  min: number;
  max: number;
  minTooltipText: string;
  maxTooltipText: string;
  updateQty: (productId: string, quantity: number) => void;
}) {
  const [value, setValue] = useState(String(quantity));
  const [tooltip, setTooltip] = useState<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = (message: string) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setTooltip(message);
    hideTimer.current = setTimeout(() => {
      setTooltip(null);
      hideTimer.current = null;
    }, 2800);
  };

  useEffect(() => {
    setValue(String(quantity));
  }, [quantity]);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const atMin = quantity <= min;
  const atMax = quantity >= max;

  const commit = (raw: string) => {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n) || n < 1) {
      setValue(String(quantity));
      return;
    }
    if (n < min) {
      showTooltip(minTooltipText);
    } else if (n > max) {
      showTooltip(maxTooltipText);
    }
    const clamped = Math.min(max, Math.max(min, n));
    updateQty(productId, clamped);
    setValue(String(clamped));
  };

  const checkRangeAndMaybeTip = (n: number) => {
    if (Number.isNaN(n)) return;
    if (n < min) {
      showTooltip(minTooltipText);
      return;
    }
    if (n > max) {
      showTooltip(maxTooltipText);
    }
  };

  const limitBtnClass = "rounded p-1 text-gray-500 hover:bg-gray-200";

  return (
    <div className="relative flex shrink-0 items-center gap-1">
      {tooltip && (
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-[60] mb-1.5 w-max max-w-[220px] -translate-x-1/2 rounded-md bg-gray-900 px-2.5 py-1.5 text-center text-xs font-medium text-white shadow-lg"
        >
          {tooltip}
          <span
            className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900"
            aria-hidden
          />
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          if (atMin) {
            showTooltip(minTooltipText);
            return;
          }
          updateQty(productId, quantity - 1);
        }}
        className={`${limitBtnClass} ${atMin ? "cursor-not-allowed opacity-45 hover:bg-transparent" : ""}`}
        aria-label="Decrease quantity"
        aria-disabled={atMin}
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        aria-label="Quantity"
        aria-invalid={tooltip != null}
        className="min-w-[3.5rem] max-w-[6.5rem] rounded border border-gray-200 bg-white px-1.5 py-0.5 text-center text-sm tabular-nums text-gray-900 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          if (next === "") return;
          const n = parseInt(next, 10);
          checkRangeAndMaybeTip(n);
          if (!Number.isNaN(n) && n >= min) {
            updateQty(productId, Math.min(max, n));
          }
        }}
        onBlur={() => commit(value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      <button
        type="button"
        onClick={() => {
          if (atMax) {
            showTooltip(maxTooltipText);
            return;
          }
          updateQty(productId, quantity + 1);
        }}
        className={`${limitBtnClass} ${atMax ? "cursor-not-allowed opacity-45 hover:bg-transparent" : ""}`}
        aria-label="Increase quantity"
        aria-disabled={atMax}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

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
                (() => {
                  const minQty = Math.max(1, item.minOrderQuantity ?? 1);
                  const stockQty = Math.max(0, item.stockQuantity ?? 0);
                  const maxQtyByRule =
                    item.maxOrderQuantity == null ? Number.POSITIVE_INFINITY : Math.max(minQty, item.maxOrderQuantity);
                  const maxQty = Math.max(minQty, Math.min(stockQty || minQty, maxQtyByRule, 100000));
                  const minTooltipText = `Minimum order quantity is ${minQty}`;
                  const orderCap =
                    item.maxOrderQuantity == null ? null : Math.max(minQty, item.maxOrderQuantity);
                  const maxTooltipText =
                    stockQty > 0 &&
                    maxQty === stockQty &&
                    (orderCap == null || stockQty <= orderCap)
                      ? `Only ${maxQty} available in stock`
                      : orderCap != null &&
                          maxQty === orderCap &&
                          orderCap < (stockQty || minQty)
                        ? `Maximum order quantity is ${item.maxOrderQuantity}`
                        : `Maximum quantity is ${maxQty}`;
                  return (
                <li
                  key={item.productId}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3"
                >
                  {item.imageUrl ? (
                    <img
                      src={publicImageUrl(item.imageUrl)}
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
                  <CartQuantityControls
                    productId={item.productId}
                    quantity={item.quantity}
                    min={minQty}
                    max={maxQty}
                    minTooltipText={minTooltipText}
                    maxTooltipText={maxTooltipText}
                    updateQty={updateQty}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </li>
                  );
                })()
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

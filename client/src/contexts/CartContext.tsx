import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { ApiProduct } from "@/lib/api.ts";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  vendorId: string;
  minOrderQuantity: number;
  maxOrderQuantity: number | null;
  stockQuantity: number;
  imageUrl?: string; // first product image (R2 URL or /uploads/...)
}

interface CartContextValue {
  items: CartItem[];
  addToCart: (product: ApiProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  clear: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const ABSOLUTE_MAX_QTY = 100000;

function toPositiveInt(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  const n = Math.floor(value);
  return n > 0 ? n : fallback;
}

function getAllowedRange(item: {
  minOrderQuantity: number;
  maxOrderQuantity: number | null;
  stockQuantity: number;
}) {
  const min = toPositiveInt(item.minOrderQuantity, 1);
  const stock = toPositiveInt(item.stockQuantity, 0);
  const maxByProduct = item.maxOrderQuantity == null
    ? Number.POSITIVE_INFINITY
    : toPositiveInt(item.maxOrderQuantity, min);
  const max = Math.max(min, Math.min(stock || min, maxByProduct, ABSOLUTE_MAX_QTY));
  return { min, max };
}

function clampQty(qty: number, item: {
  minOrderQuantity: number;
  maxOrderQuantity: number | null;
  stockQuantity: number;
}) {
  const { min, max } = getAllowedRange(item);
  const n = Number.isFinite(qty) ? Math.floor(qty) : min;
  return Math.min(max, Math.max(min, n));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = useCallback(
    (product: ApiProduct, quantity = 1) => {
      const vendorId = product.vendor?.id ?? "";
      const minOrderQuantity = toPositiveInt(Number(product.minOrderQuantity ?? 1), 1);
      const stockQuantity = toPositiveInt(Number(product.stockQuantity ?? 0), 0);
      const maxOrderQuantity =
        product.maxOrderQuantity == null ? null : toPositiveInt(Number(product.maxOrderQuantity), minOrderQuantity);
      setItems((prev) => {
        const i = prev.findIndex((x) => x.productId === product.id);
        if (i >= 0) {
          const next = [...prev];
          next[i] = {
            ...next[i],
            minOrderQuantity,
            maxOrderQuantity,
            stockQuantity,
            quantity: clampQty(next[i].quantity + quantity, {
              minOrderQuantity,
              maxOrderQuantity,
              stockQuantity,
            }),
          };
          return next;
        }
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            price: Number(product.basePrice),
            quantity: clampQty(quantity, {
              minOrderQuantity,
              maxOrderQuantity,
              stockQuantity,
            }),
            vendorId,
            minOrderQuantity,
            maxOrderQuantity,
            stockQuantity,
            imageUrl: product.images?.[0],
          },
        ];
      });
    },
    []
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((x) => x.productId !== productId));
  }, []);

  const updateQty = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((x) =>
        x.productId === productId
          ? {
              ...x,
              quantity: clampQty(quantity, {
                minOrderQuantity: x.minOrderQuantity,
                maxOrderQuantity: x.maxOrderQuantity,
                stockQuantity: x.stockQuantity,
              }),
            }
          : x
      )
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((s, x) => s + x.quantity, 0);
  const totalAmount = items.reduce((s, x) => s + x.price * x.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeItem,
        updateQty,
        clear,
        totalItems,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

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

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = useCallback(
    (product: ApiProduct, quantity = 1) => {
      const vendorId = product.vendor?.id ?? "";
      setItems((prev) => {
        const i = prev.findIndex((x) => x.productId === product.id);
        if (i >= 0) {
          const next = [...prev];
          next[i] = { ...next[i], quantity: next[i].quantity + quantity };
          return next;
        }
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            price: Number(product.basePrice),
            quantity,
            vendorId,
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
    if (quantity < 1) {
      setItems((prev) => prev.filter((x) => x.productId !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((x) =>
        x.productId === productId ? { ...x, quantity } : x
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

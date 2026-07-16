import { create } from "zustand";
import type { Product } from "@/lib/types";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

interface CartState {
  items: CartItem[];
  discount: number;
  addItem: (product: Product) => void;
  incrementItem: (productId: string) => void;
  decrementItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  setDiscount: (discount: number) => void;
  loadItems: (items: CartItem[], discount: number) => void;
  clear: () => void;
  subtotal: () => number;
  total: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount: 0,

  addItem: (product) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === product.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            qty: 1,
          },
        ],
      };
    }),

  incrementItem: (productId) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, qty: i.qty + 1 } : i
      ),
    })),

  decrementItem: (productId) =>
    set((state) => ({
      items: state.items
        .map((i) =>
          i.productId === productId ? { ...i, qty: i.qty - 1 } : i
        )
        .filter((i) => i.qty > 0),
    })),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),

  setQty: (productId, qty) =>
    set((state) => ({
      items: state.items
        .map((i) => (i.productId === productId ? { ...i, qty: Math.max(qty, 0) } : i))
        .filter((i) => i.qty > 0),
    })),

  setDiscount: (discount) => set({ discount: Math.max(0, discount) }),

  loadItems: (items, discount) => set({ items, discount }),

  clear: () => set({ items: [], discount: 0 }),

  subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),

  total: () => Math.max(0, get().subtotal() - get().discount),
}));

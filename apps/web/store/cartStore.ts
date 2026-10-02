// == KALKI B1 SPINE ==
// Cart store with DERIVED totals and variant-keyed items.
// -----------------------------------------------------------------------------

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useMemo } from 'react';

export interface CartItem {
  id: string;
  variantId?: string | null;
  variantName?: string;
  name: string;
  price: number;
  category: string;
  slug: string;
  quantity: number;
  icon?: string;
  image_url?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (itemKey: string) => void;
  updateQuantity: (itemKey: string, quantity: number) => void;
  clearCart: () => void;
}

// A cart line is unique by `id + variantId`
export function itemKey(item: Pick<CartItem, 'id' | 'variantId'>): string {
  return `${item.id}::${item.variantId ?? '_'}`;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const key = itemKey(item);
          const existing = state.items.find((i) => itemKey(i) === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                itemKey(i) === key ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),

      removeItem: (key) =>
        set((state) => ({ items: state.items.filter((i) => itemKey(i) !== key) })),

      updateQuantity: (key, quantity) =>
        set((state) => {
          if (quantity <= 0) return { items: state.items.filter((i) => itemKey(i) !== key) };
          return {
            items: state.items.map((i) => (itemKey(i) === key ? { ...i, quantity } : i)),
          };
        }),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'kalki-cart-storage',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      version: 2,
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// Derived totals — computed at read time, never stored.
export function useCartTotals() {
  const items = useCartStore((s) => s.items);
  return useMemo(() => {
    let totalItems = 0;
    let totalPrice = 0;
    for (const i of items) {
      const q = Number.isFinite(i.quantity) ? i.quantity : 0;
      const p = Number.isFinite(i.price) ? i.price : 0;
      totalItems += q;
      totalPrice += p * q;
    }
    return { totalItems, totalPrice };
  }, [items]);
}

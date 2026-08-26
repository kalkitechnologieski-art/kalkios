import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  price: number
  category: string
  slug: string
  quantity: number
  icon?: string
  image_url?: string
}

interface CartStore {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,

      addItem: (item) => {
        const items = get().items
        const existing = items.find((i) => i.id === item.id)
        if (existing) {
          const updated = items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          )
          set({
            items: updated,
            totalItems: updated.reduce((acc, i) => acc + i.quantity, 0),
            totalPrice: updated.reduce((acc, i) => acc + i.price * i.quantity, 0),
          })
        } else {
          const newItem = { ...item, quantity: 1 }
          const updated = [...items, newItem]
          set({
            items: updated,
            totalItems: updated.reduce((acc, i) => acc + i.quantity, 0),
            totalPrice: updated.reduce((acc, i) => acc + i.price * i.quantity, 0),
          })
        }
      },

      removeItem: (id) => {
        const updated = get().items.filter((i) => i.id !== id)
        set({
          items: updated,
          totalItems: updated.reduce((acc, i) => acc + i.quantity, 0),
          totalPrice: updated.reduce((acc, i) => acc + i.price * i.quantity, 0),
        })
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }
        const updated = get().items.map((i) =>
          i.id === id ? { ...i, quantity } : i
        )
        set({
          items: updated,
          totalItems: updated.reduce((acc, i) => acc + i.quantity, 0),
          totalPrice: updated.reduce((acc, i) => acc + i.price * i.quantity, 0),
        })
      },

      clearCart: () => {
        set({ items: [], totalItems: 0, totalPrice: 0 })
      },
    }),
    {
      name: 'kalki-cart-storage',
    }
  )
)

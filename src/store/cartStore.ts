import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  priceCents: number;
  quantity: number;
  imageUrl?: string;
  grade: 'A' | 'B' | 'C';
  specs?: Record<string, string>;
  stock?: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateItemPrice: (id: string, newPriceCents: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        const existingItem = get().items.find((item) => item.id === newItem.id);
        if (existingItem) {
          set({
            items: get().items.map((item) =>
              item.id === newItem.id
                ? { ...item, quantity: item.quantity + newItem.quantity }
                : item
            ),
          });
        } else {
          set({ items: [...get().items, newItem] });
        }
      },
      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        });
      },
      updateItemPrice: (id, newPriceCents) => {
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, priceCents: newPriceCents } : item
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.priceCents * item.quantity,
          0
        );
      },
    }),
    {
      name: 'biostec-cart',
    }
  )
);

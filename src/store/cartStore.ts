import { create } from 'zustand';

export interface CartItem {
    id: number;
    name: string;
    price: number;
    image: string;
    quantity: number;
}

interface CartStore {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'quantity'>) => void;
    removeItem: (id: number) => void;
    clearCart: () => void;
    total: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
    items: [],
    addItem: (product) => set((state) => {
        const existing = state.items.find(i => i.id === product.id);
        if (existing) {
            return {
                items: state.items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
            };
        }
        return { items: [...state.items, { ...product, quantity: 1 }] };
    }),
    removeItem: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id)
    })),
    clearCart: () => set({ items: [] }),
    total: () => get().items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
}));

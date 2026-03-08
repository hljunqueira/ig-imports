import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    image: string;
    size?: string;
    quantity: number;
    maxStock?: number;
}

interface CartStore {
    items: CartItem[];
    isOpen: boolean;
    addItem: (item: Omit<CartItem, 'quantity'>) => void;
    removeItem: (id: string, size?: string) => void;
    updateQuantity: (id: string, size: string | undefined, quantity: number) => void;
    clearCart: () => void;
    toggleCart: () => void;
    openCart: () => void;
    closeCart: () => void;
    total: () => number;
    itemCount: () => number;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,

            addItem: (product) => set((state) => {
                const existingIndex = state.items.findIndex(
                    i => i.id === product.id && i.size === product.size
                );

                if (existingIndex > -1) {
                    const items = [...state.items];
                    const existing = items[existingIndex];
                    const newQuantity = existing.quantity + 1;
                    
                    // Check stock limit
                    if (product.maxStock && newQuantity > product.maxStock) {
                        return state;
                    }

                    items[existingIndex] = { ...existing, quantity: newQuantity };
                    return { items };
                }

                return { items: [...state.items, { ...product, quantity: 1 }] };
            }),

            removeItem: (id, size) => set((state) => ({
                items: state.items.filter((i) => !(i.id === id && i.size === size))
            })),

            updateQuantity: (id, size, quantity) => set((state) => {
                if (quantity <= 0) {
                    return {
                        items: state.items.filter((i) => !(i.id === id && i.size === size))
                    };
                }

                return {
                    items: state.items.map((i) =>
                        i.id === id && i.size === size ? { ...i, quantity } : i
                    )
                };
            }),

            clearCart: () => set({ items: [] }),

            toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),

            total: () => get().items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
            itemCount: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
        }),
        {
            name: 'ig-imports-cart',
            partialize: (state) => ({ items: state.items }),
        }
    )
);

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';

// Helper para construir URL completa da imagem
const getImageUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl) return '/ig-imports-logo.png';
  // Se já for URL absoluta (http/https), retorna como está
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  // Se for caminho relativo, adiciona a base da API
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const API_BASE = API_URL.replace(/\/api$/, '');
  return `${API_BASE}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

const CartDrawer: React.FC = () => {
    const { items, isOpen, closeCart, removeItem, updateQuantity, total, itemCount } = useCartStore();

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeCart}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-background-dark border-l border-white/10 z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <div>
                                <h2 className="text-lg font-display font-bold tracking-widest">CARRINHO</h2>
                                <p className="text-xs text-gray-500">
                                    {itemCount()} {itemCount() === 1 ? 'item' : 'itens'}
                                </p>
                            </div>
                            <button
                                onClick={closeCart}
                                className="p-2 text-gray-400 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <span className="material-symbols-outlined text-6xl text-gray-600 mb-4">shopping_bag</span>
                                    <p className="text-gray-500 mb-4">Seu carrinho está vazio</p>
                                    <button
                                        onClick={closeCart}
                                        className="text-primary text-sm hover:underline"
                                    >
                                        Continuar comprando
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {items.map((item, index) => (
                                        <div
                                            key={`${item.id}-${item.size}-${index}`}
                                            className="flex gap-4 p-4 bg-card-dark border border-white/5"
                                        >
                                            {/* Image — clicável se tiver slug */}
                                            <div className="w-20 h-24 bg-background-dark border border-white/5 overflow-hidden shrink-0">
                                                {item.slug ? (
                                                    <Link to={`/product/${item.slug}`} onClick={closeCart}>
                                                        <img
                                                            src={getImageUrl(item.image)}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                                        />
                                                    </Link>
                                                ) : (
                                                    <img
                                                        src={getImageUrl(item.image)}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                {item.slug ? (
                                                    <Link
                                                        to={`/product/${item.slug}`}
                                                        onClick={closeCart}
                                                        className="text-sm font-semibold truncate block hover:text-primary transition-colors"
                                                    >
                                                        {item.name}
                                                    </Link>
                                                ) : (
                                                    <h3 className="text-sm font-semibold truncate">{item.name}</h3>
                                                )}
                                                {item.size && (
                                                    <p className="text-xs text-gray-500">Tamanho: {item.size}</p>
                                                )}
                                                <p className="text-sm font-display font-bold mt-1">
                                                    {formatCurrency(item.price)}
                                                </p>

                                                {/* Quantity Controls */}
                                                <div className="flex items-center gap-3 mt-2">
                                                    <div className="flex items-center border border-white/10">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                                                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">remove</span>
                                                        </button>
                                                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                                                            disabled={item.maxStock && item.quantity >= item.maxStock}
                                                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">add</span>
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => removeItem(item.id, item.size)}
                                                        className="text-gray-500 hover:text-red-500 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">delete</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Subtotal */}
                                            <div className="text-right">
                                                <p className="text-sm font-bold">
                                                    {formatCurrency(item.price * item.quantity)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="p-6 border-t border-white/10 space-y-4">
                                {/* Total */}
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Subtotal</span>
                                    <span className="text-xl font-display font-bold">{formatCurrency(total())}</span>
                                </div>

                                {/* Checkout Button */}
                                <Link
                                    to="/checkout"
                                    onClick={closeCart}
                                    className="block w-full gold-gradient text-background-dark py-4 text-center font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all"
                                >
                                    Finalizar Compra
                                </Link>

                                <button
                                    onClick={closeCart}
                                    className="w-full py-3 border border-white/10 text-xs font-bold uppercase tracking-widest hover:border-primary transition-colors"
                                >
                                    Continuar Comprando
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Product } from '../lib/products';

interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const originalPrice = product.original_price;
    const hasDiscount = originalPrice && originalPrice > product.price;

    return (
        <Link to={`/product/${product.slug || product.id}`} className="group block">
            <div className="relative aspect-4/5 overflow-hidden bg-gray-900 rounded-sm mb-4">
                {/* Badge: Destaque */}
                {product.is_featured && (
                    <div className="absolute top-2 left-2 z-10 bg-primary text-black text-[10px] font-bold px-2 py-1 uppercase tracking-widest">
                        Destaque
                    </div>
                )}
                {/* Badge: Oferta */}
                {hasDiscount && (
                    <div className="absolute top-2 right-2 z-10 bg-red-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">
                        Oferta
                    </div>
                )}
                {/* Badge: Esgotado */}
                {product.stock === 0 && (
                    <div className="absolute inset-0 z-10 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold uppercase tracking-widest border border-white/30 px-4 py-2">
                            Esgotado
                        </span>
                    </div>
                )}

                {/* Image */}
                <motion.img
                    src={product.image_url || '/ig-imports-logo.png'}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = '/ig-imports-logo.png';
                    }}
                />

                {/* Hover Overlay */}
                {product.stock > 0 && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="text-white text-xs font-bold uppercase tracking-[0.2em] border border-white/50 px-6 py-3 hover:bg-white hover:text-black transition-colors">
                            Ver Detalhes
                        </span>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-1">
                <p className="text-gray-500 text-[10px] uppercase tracking-widest">
                    {product.category?.name || ''}
                </p>
                <h3 className="text-gray-200 text-sm font-light uppercase tracking-wide group-hover:text-primary transition-colors line-clamp-1">
                    {product.name}
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                    </span>
                    {hasDiscount && (
                        <span className="text-gray-500 text-xs line-through">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(originalPrice!)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;


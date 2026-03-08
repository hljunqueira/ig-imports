import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Product, productService } from '../lib/products';
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

const ProductDetails: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [addedToCart, setAddedToCart] = useState(false);
    const { addItem, openCart } = useCartStore();

    useEffect(() => {
        if (slug) {
            loadProduct(slug);
        }
    }, [slug]);

    const loadProduct = async (slug: string) => {
        setLoading(true);
        try {
            // Try fetching by slug first
            let data = await productService.getBySlug(slug);

            // If not found and slug looks like ID, try ID (backward compatibility)
            if (!data && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) {
                data = await productService.getById(slug);
            }

            if (data) {
                setProduct(data);
            } else {
                // Product not found
                // navigate('/catalog'); // Redirect or show error?
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = () => {
        if (!product || !selectedSize) return;

        addItem({
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            image: product.image_url || '',
            size: selectedSize,
            maxStock: product.stock,
        });

        setAddedToCart(true);
        setTimeout(() => {
            setAddedToCart(false);
            openCart();
        }, 1000);
    };

    if (loading) {
        return (
            <div className="bg-background-dark min-h-screen text-slate-100 flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="bg-background-dark min-h-screen text-slate-100 flex flex-col">
                <Navbar />
                <div className="grow flex flex-col items-center justify-center">
                    <h1 className="text-3xl font-display font-bold">Produto não encontrado</h1>
                    <button onClick={() => navigate('/catalog')} className="mt-4 text-primary hover:underline">Voltar ao Catálogo</button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="bg-background-dark min-h-screen text-slate-100 flex flex-col">
            <Navbar />

            <main className="grow pt-32 pb-20 px-6 sm:px-12 max-w-480 mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">

                    {/* Gallery Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                    >
                        <div className="bg-gray-900 aspect-4/5 rounded-sm overflow-hidden border border-white/5">
                            <img
                                src={getImageUrl(product.image_url)}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {/* Thumbnails (Placeholder for Gallery) */}
                        <div className="grid grid-cols-4 gap-4">
                            {[product.image_url, ...(product.gallery || [])].slice(0, 4).map((img, idx) => (
                                img && (
                                    <div key={idx} className="aspect-square bg-gray-900 rounded-sm overflow-hidden border border-white/5 cursor-pointer hover:border-primary transition-colors">
                                        <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )
                            ))}
                        </div>
                    </motion.div>

                    {/* Details Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col h-full justify-start"
                    >
                        <div className="mb-2">
                            <span className="text-primary text-xs font-bold uppercase tracking-[0.2em]">
                                {product.category?.name || 'Coleção'}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 leading-tight">
                            {product.name}
                        </h1>

                        <p className="text-gray-400 font-light text-lg leading-relaxed mb-8 border-b border-white/10 pb-8">
                            {product.description || 'Sem descrição disponível.'}
                        </p>

                        <div className="flex items-center gap-4 mb-8">
                            <span className="text-3xl font-bold text-white">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                            </span>
                            {product.original_price && product.original_price > product.price && (
                                <span className="text-xl text-gray-500 line-through">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.original_price)}
                                </span>
                            )}
                        </div>

                        {/* Sizes */}
                        {product.sizes && product.sizes.length > 0 && (
                            <div className="mb-10">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Tamanho</span>
                                    <button className="text-xs text-primary hover:underline">Guia de Medidas</button>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {product.sizes.map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`w-14 h-14 flex items-center justify-center border text-sm font-bold transition-all duration-300 ${selectedSize === size
                                                    ? 'bg-white text-black border-white'
                                                    : 'border-white/20 text-gray-400 hover:border-primary hover:text-white'
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="mt-auto">
                            <button
                                onClick={handleAddToCart}
                                className={`w-full py-5 text-sm font-bold uppercase tracking-[0.2em] transition-all duration-300 mb-4 ${
                                    addedToCart
                                        ? 'bg-emerald-500 text-white'
                                        : selectedSize
                                            ? 'bg-primary text-black hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                }`}
                                disabled={!selectedSize || addedToCart}
                            >
                                {addedToCart ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-sm">check</span>
                                        Adicionado!
                                    </span>
                                ) : selectedSize ? (
                                    'Adicionar ao Carrinho'
                                ) : (
                                    'Selecione um Tamanho'
                                )}
                            </button>

                            <p className="text-center text-xs text-gray-500 uppercase tracking-widest flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-sm">lock</span>
                                Pagamento Seguro na Retirada
                            </p>
                        </div>
                    </motion.div>

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ProductDetails;

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { Product, Category, productService, categoryService } from '../lib/products';

const Catalog: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const categorySlug = searchParams.get('category');

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, [categorySlug]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch categories first if empty
            let currentCategories = categories;
            if (categories.length === 0) {
                currentCategories = await categoryService.getAll();
                setCategories(currentCategories);
            }

            // Determine filter
            const filterOptions: any = { status: 'active' };

            if (categorySlug) {
                filterOptions.categorySlug = categorySlug;
                // Sync UI state
                const matchedCat = currentCategories.find(c => c.slug === categorySlug);
                if (matchedCat) {
                    setSelectedCategory(matchedCat.id);
                }
            } else {
                setSelectedCategory(null);
            }

            const prods = await productService.getAll(filterOptions);
            setProducts(prods);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryClick = (categoryId: string | null) => {
        if (categoryId) {
            const cat = categories.find(c => c.id === categoryId);
            if (cat) {
                setSearchParams({ category: cat.slug });
            }
        } else {
            setSearchParams({});
        }
    };

    // Filter products by search query
    const filteredProducts = products.filter(product => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            product.name.toLowerCase().includes(query) ||
            product.description?.toLowerCase().includes(query) ||
            product.category?.name.toLowerCase().includes(query)
        );
    });

    return (
        <div className="bg-background-dark min-h-screen text-slate-100 flex flex-col">
            <Navbar />

            <main className="grow pt-32 pb-20 px-6 sm:px-12 max-w-480 mx-auto w-full">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
                        CATÁLOGO <span className="text-primary">EXCLUSIVO</span>
                    </h1>
                    <p className="text-gray-400 font-light max-w-xl">
                        Explore nossa coleção selecionada das camisas mais desejadas do mundo.
                    </p>
                </div>

                {/* Search */}
                <div className="mb-8">
                    <div className="relative max-w-md">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            search
                        </span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar produtos..."
                            className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-sm focus:border-primary outline-none transition-all placeholder:text-gray-600"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-12">
                    <button
                        onClick={() => handleCategoryClick(null)}
                        className={`px-6 py-2 text-xs font-bold uppercase tracking-widest border transition-all duration-300 ${selectedCategory === null
                            ? 'bg-primary text-black border-primary'
                            : 'border-white/20 text-gray-400 hover:border-primary hover:text-white'
                            }`}
                    >
                        Todas
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryClick(cat.id)}
                            className={`px-6 py-2 text-xs font-bold uppercase tracking-widest border transition-all duration-300 ${selectedCategory === cat.id
                                ? 'bg-primary text-black border-primary'
                                : 'border-white/20 text-gray-400 hover:border-primary hover:text-white'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                            <div key={n} className="animate-pulse">
                                <div className="bg-gray-800 aspect-4/5 rounded-sm mb-4"></div>
                                <div className="h-4 bg-gray-800 w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-800 w-1/4"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12"
                    >
                        {filteredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center py-20 text-gray-500 font-light">
                        <p className="text-xl">
                            {searchQuery ? `Nenhum produto encontrado para "${searchQuery}"` : 'Nenhum produto encontrado nesta categoria.'}
                        </p>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                handleCategoryClick(null);
                            }}
                            className="text-primary mt-4 hover:underline"
                        >
                            Ver todos os produtos
                        </button>
                    </div>
                )}

            </main>

            <Footer />
        </div>
    );
};

export default Catalog;

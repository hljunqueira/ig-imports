import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { orderService, Order } from '../lib/orders';
import { settingsService, StoreSettings } from '../lib/settings';
import { reviewsService } from '../lib/reviews';
import type { ProductReview } from '../types';
import { useDialog } from '../context/DialogContext';

const ClientArea: React.FC = () => {
    const { error } = useDialog();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [reviews, setReviews] = useState<ProductReview[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [settings, setSettings] = useState<StoreSettings | null>(null);

    // Login form
    const [loginForm, setLoginForm] = useState({
        email: '',
        phone: '',
    });

    // Search for orders by email or phone
    const handleSearchOrders = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setLoadingReviews(true);

        try {
            const allOrders = await orderService.getAll();
            
            // Filter orders by email or phone
            const filtered = allOrders.filter(order => 
                (loginForm.email && order.customer_email?.toLowerCase() === loginForm.email.toLowerCase()) ||
                (loginForm.phone && order.customer_phone.replace(/\D/g, '') === loginForm.phone.replace(/\D/g, ''))
            );

            setOrders(filtered);

            // Buscar avaliações do cliente
            try {
                const allReviews = await reviewsService.getReviews();
                const customerReviews = allReviews.filter(review => 
                    review.customer_email?.toLowerCase() === loginForm.email.toLowerCase()
                );
                setReviews(customerReviews);
            } catch (reviewError) {
                console.error('Error fetching reviews:', reviewError);
                setReviews([]);
            }

            setIsLogin(false);
        } catch (err) {
            console.error('Error fetching orders:', err);
            await error('Erro ao buscar pedidos. Tente novamente.');
        } finally {
            setLoading(false);
            setLoadingReviews(false);
        }
    };

    useEffect(() => {
        // Load store settings
        settingsService.get().then(setSettings);
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-amber-500/20 text-amber-500',
            confirmed: 'bg-blue-500/20 text-blue-500',
            ready: 'bg-purple-500/20 text-purple-500',
            delivered: 'bg-emerald-500/20 text-emerald-500',
            cancelled: 'bg-red-500/20 text-red-500',
        };
        const labels: Record<string, string> = {
            pending: 'Pendente',
            confirmed: 'Confirmado',
            ready: 'Pronto',
            delivered: 'Entregue',
            cancelled: 'Cancelado',
        };
        return (
            <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${styles[status] || 'bg-gray-500/20 text-gray-500'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        className={`material-symbols-outlined text-sm ${
                            star <= rating ? 'text-primary' : 'text-gray-600'
                        }`}
                    >
                        star
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-background-dark min-h-screen text-slate-100 flex flex-col">
            <Navbar />

            <main className="grow pt-32 pb-20 px-6 sm:px-12 max-w-480 mx-auto w-full">
                {isLogin ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-md mx-auto"
                    >
                        <div className="bg-card-dark border border-white/5 p-8 shadow-2xl">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-display font-bold text-white mb-2">
                                    CONSULTAR PEDIDOS
                                </h2>
                                <p className="text-xs text-gray-500 uppercase tracking-widest">
                                    Digite seu email ou telefone para ver seus pedidos
                                </p>
                            </div>

                            {/* Info para novos clientes */}
                            <div className="bg-primary/5 border border-primary/20 px-4 py-3 mb-6 flex gap-3 items-start">
                                <span className="material-symbols-outlined text-primary text-sm shrink-0 mt-0.5">info</span>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Não precisa criar conta. Use o mesmo <span className="text-white">email ou telefone</span> informado ao finalizar sua compra.
                                    {' '}<a href="/#/catalog" className="text-primary hover:underline">Ainda não comprou? Veja nosso catálogo.</a>
                                </p>
                            </div>

                            <form onSubmit={handleSearchOrders} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={loginForm.email}
                                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                        className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                        placeholder="seu@email.com"
                                    />
                                </div>

                                <div className="text-center text-gray-500 text-xs">OU</div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Telefone/WhatsApp</label>
                                    <input
                                        type="tel"
                                        value={loginForm.phone}
                                        onChange={(e) => setLoginForm({ ...loginForm, phone: e.target.value })}
                                        className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                        placeholder="(48) 99999-9999"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || (!loginForm.email && !loginForm.phone)}
                                    className="w-full bg-primary text-black py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-white transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Buscando...' : 'Ver Meus Pedidos'}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <p className="text-xs text-gray-500">
                                    Novo por aqui?{' '}
                                    <a
                                        href={settings?.store_whatsapp ? `https://wa.me/${settings.store_whatsapp}` : '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        Fale conosco
                                    </a>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-display font-bold mb-2">
                                    MEUS <span className="text-primary">PEDIDOS</span>
                                </h1>
                                <p className="text-gray-400 text-sm">
                                    {orders.length} {orders.length === 1 ? 'pedido encontrado' : 'pedidos encontrados'}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsLogin(true);
                                    setOrders([]);
                                    setLoginForm({ email: '', phone: '' });
                                }}
                                className="text-xs text-gray-500 hover:text-primary uppercase tracking-widest"
                            >
                                Buscar outro
                            </button>
                        </div>

                        {orders.length === 0 ? (
                            <div className="text-center py-20">
                                <span className="material-symbols-outlined text-6xl text-gray-600 mb-4">shopping_bag</span>
                                <p className="text-gray-500 mb-4">Nenhum pedido encontrado com esses dados</p>
                                <button
                                    onClick={() => navigate('/catalog')}
                                    className="text-primary hover:underline"
                                >
                                    Ir às compras
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="bg-card-dark border border-white/5 p-6"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-lg font-bold">Pedido #{order.order_number}</h3>
                                                    {getStatusBadge(order.status || 'pending')}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {formatDate(order.created_at || '')} • {order.items?.length || 0} itens
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-display font-bold">{formatCurrency(order.total)}</p>
                                            </div>
                                        </div>

                                        {/* Items Preview */}
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {order.items?.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="w-16 h-20 bg-background-dark border border-white/5 overflow-hidden shrink-0"
                                                >
                                                    {item.product_image ? (
                                                        <img
                                                            src={item.product_image}
                                                            alt={item.product_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-gray-600">checkroom</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Delivery Info */}
                                        <div className="mt-4 pt-4 border-t border-white/5 text-xs text-gray-500">
                                            {order.delivery_type === 'pickup' ? (
                                                <span>🏪 Retirada na loja</span>
                                            ) : (
                                                <span>🚗 Entrega - {order.address || 'Endereço a combinar'}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Reviews Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mt-16"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-display font-bold">
                                        MINHAS <span className="text-primary">AVALIAÇÕES</span>
                                    </h2>
                                    <p className="text-gray-400 text-sm mt-1">
                                        {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}
                                    </p>
                                </div>
                            </div>

                            {loadingReviews ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[1, 2].map((n) => (
                                        <div key={n} className="animate-pulse bg-card-dark border border-white/5 p-6">
                                            <div className="h-4 bg-gray-700 w-1/3 mb-3"></div>
                                            <div className="h-3 bg-gray-700 w-full mb-2"></div>
                                            <div className="h-3 bg-gray-700 w-3/4"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : reviews.length === 0 ? (
                                <div className="text-center py-12 bg-card-dark border border-white/5">
                                    <span className="material-symbols-outlined text-5xl text-gray-600 mb-4 block">reviews</span>
                                    <p className="text-gray-500">Ainda não há avaliações</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {reviews.map((review) => (
                                        <div
                                            key={review.id}
                                            className="bg-card-dark border border-white/5 p-6"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                {renderStars(review.rating)}
                                                {review.is_approved ? (
                                                    <span className="text-emerald-500 text-[10px] uppercase tracking-widest">Aprovada</span>
                                                ) : (
                                                    <span className="text-amber-500 text-[10px] uppercase tracking-widest">Pendente</span>
                                                )}
                                            </div>
                                            <p className="text-gray-300 text-sm mb-3 line-clamp-3">{review.comment}</p>
                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span>{formatDate(review.created_at || '')}</span>
                                                {review.is_featured && (
                                                    <span className="text-primary">Destaque</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default ClientArea;

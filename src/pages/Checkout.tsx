import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCartStore } from '../store/cartStore';
import { Order, orderService, generateWhatsAppLink } from '../lib/orders';
import { couponService } from '../lib/settings';

const Checkout: React.FC = () => {
    const navigate = useNavigate();
    const { items, total, clearCart } = useCartStore();
    const [loading, setLoading] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponError, setCouponError] = useState('');

    const [formData, setFormData] = useState({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        delivery_type: 'pickup' as 'pickup' | 'delivery',
        address: '',
        notes: '',
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const discount = appliedCoupon
        ? appliedCoupon.discount_type === 'percentage'
            ? (total() * appliedCoupon.discount_value) / 100
            : appliedCoupon.discount_value
        : 0;

    const finalTotal = total() - discount;

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCouponError('');

        try {
            const coupon = await couponService.getByCode(couponCode.trim());
            if (!coupon) {
                setCouponError('Cupom não encontrado');
                return;
            }

            const validation = couponService.validate(coupon, total());
            if (!validation.valid) {
                setCouponError(validation.message || 'Cupom inválido');
                return;
            }

            setAppliedCoupon(coupon);
            setCouponCode('');
        } catch (error) {
            setCouponError('Erro ao validar cupom');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const orderItems = items.map((item) => ({
                product_id: item.id,
                product_name: item.name,
                product_image: item.image,
                size: item.size,
                quantity: item.quantity,
                unit_price: item.price,
            }));

            const order: Omit<Order, 'id' | 'order_number' | 'created_at'> = {
                customer_name: formData.customer_name,
                customer_phone: formData.customer_phone,
                customer_email: formData.customer_email || undefined,
                delivery_type: formData.delivery_type,
                address: formData.delivery_type === 'delivery' ? formData.address : undefined,
                total: finalTotal,
                status: 'pending',
                notes: formData.notes || undefined,
                items: orderItems,
            };

            const createdOrder = await orderService.create(order);

            // Increment coupon usage if applied
            if (appliedCoupon) {
                await couponService.incrementUsage(appliedCoupon.id);
            }

            // Clear cart
            clearCart();

            // Open WhatsApp with order details
            const whatsappUrl = generateWhatsAppLink(createdOrder);
            window.open(whatsappUrl, '_blank');

            // Navigate to success page
            navigate('/');
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Erro ao finalizar pedido. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="bg-background-dark min-h-screen text-slate-100 flex flex-col">
                <Navbar />
                <main className="grow pt-32 pb-20 px-6 sm:px-12 max-w-480 mx-auto w-full flex items-center justify-center">
                    <div className="text-center">
                        <span className="material-symbols-outlined text-6xl text-gray-600 mb-4">shopping_bag</span>
                        <h1 className="text-2xl font-display font-bold mb-4">Carrinho Vazio</h1>
                        <p className="text-gray-500 mb-6">Adicione produtos ao carrinho para continuar</p>
                        <button
                            onClick={() => navigate('/catalog')}
                            className="gold-gradient text-background-dark px-8 py-3 font-bold uppercase tracking-widest text-xs"
                        >
                            Ver Produtos
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="bg-background-dark min-h-screen text-slate-100 flex flex-col">
            <Navbar />

            <main className="grow pt-32 pb-20 px-6 sm:px-12 max-w-480 mx-auto w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-display font-bold mb-2">
                        FINALIZAR <span className="text-primary">COMPRA</span>
                    </h1>
                    <p className="text-gray-400">Preencha os dados abaixo para concluir seu pedido</p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-2"
                    >
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Customer Info */}
                            <div className="glass-panel p-6">
                                <h2 className="text-lg font-display font-bold tracking-widest mb-6">DADOS PESSOAIS</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                            Nome Completo *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.customer_name}
                                            onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                            className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                            Telefone/WhatsApp *
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.customer_phone}
                                            onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                                            className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                            placeholder="(48) 99999-9999"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.customer_email}
                                            onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                                            className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Delivery */}
                            <div className="glass-panel p-6">
                                <h2 className="text-lg font-display font-bold tracking-widest mb-6">ENTREGA</h2>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, delivery_type: 'pickup' })}
                                        className={`p-4 border transition-all ${
                                            formData.delivery_type === 'pickup'
                                                ? 'border-primary bg-primary/5'
                                                : 'border-white/10 hover:border-white/20'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-2xl mb-2 block mx-auto">store</span>
                                        <span className="text-sm font-semibold">Retirada na Loja</span>
                                        <p className="text-[10px] text-gray-500 mt-1">Grátis</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, delivery_type: 'delivery' })}
                                        className={`p-4 border transition-all ${
                                            formData.delivery_type === 'delivery'
                                                ? 'border-primary bg-primary/5'
                                                : 'border-white/10 hover:border-white/20'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-2xl mb-2 block mx-auto">local_shipping</span>
                                        <span className="text-sm font-semibold">Entrega</span>
                                        <p className="text-[10px] text-gray-500 mt-1">Combinar via WhatsApp</p>
                                    </button>
                                </div>

                                {formData.delivery_type === 'delivery' && (
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                            Endereço de Entrega
                                        </label>
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            rows={3}
                                            className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors resize-none"
                                            placeholder="Rua, número, bairro, cidade..."
                                            required={formData.delivery_type === 'delivery'}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            <div className="glass-panel p-6">
                                <h2 className="text-lg font-display font-bold tracking-widest mb-6">OBSERVAÇÕES</h2>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                    className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors resize-none"
                                    placeholder="Alguma observação sobre o pedido?"
                                />
                            </div>
                        </form>
                    </motion.div>

                    {/* Order Summary */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="glass-panel p-6 sticky top-32">
                            <h2 className="text-lg font-display font-bold tracking-widest mb-6">RESUMO DO PEDIDO</h2>

                            {/* Items */}
                            <div className="space-y-4 mb-6">
                                {items.map((item, index) => (
                                    <div key={`${item.id}-${item.size}-${index}`} className="flex gap-3">
                                        <div className="w-14 h-16 bg-card-dark border border-white/5 overflow-hidden shrink-0">
                                            <img
                                                src={item.image || 'https://via.placeholder.com/56'}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate">{item.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {item.size && `Tam ${item.size} • `}{item.quantity}x
                                            </p>
                                        </div>
                                        <p className="text-sm font-bold">{formatCurrency(item.price * item.quantity)}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Coupon */}
                            <div className="mb-6 pb-6 border-b border-white/10">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                    Cupom de Desconto
                                </label>
                                {appliedCoupon ? (
                                    <div className="flex items-center justify-between bg-emerald-500/10 px-4 py-2">
                                        <span className="text-sm text-emerald-500 font-bold">{appliedCoupon.code}</span>
                                        <button
                                            onClick={() => setAppliedCoupon(null)}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            className="flex-1 bg-background-dark border border-white/10 px-4 py-2 text-sm text-white focus:border-primary outline-none transition-colors uppercase"
                                            placeholder="CÓDIGO"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleApplyCoupon}
                                            className="px-4 py-2 border border-white/10 text-xs font-bold uppercase tracking-widest hover:border-primary transition-colors"
                                        >
                                            Aplicar
                                        </button>
                                    </div>
                                )}
                                {couponError && (
                                    <p className="text-xs text-red-500 mt-2">{couponError}</p>
                                )}
                            </div>

                            {/* Totals */}
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Subtotal</span>
                                    <span>{formatCurrency(total())}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-emerald-500">Desconto</span>
                                        <span className="text-emerald-500">-{formatCurrency(discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-display font-bold pt-3 border-t border-white/10">
                                    <span>Total</span>
                                    <span className="text-primary">{formatCurrency(finalTotal)}</span>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full gold-gradient text-background-dark py-4 font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">whatsapp</span>
                                        Finalizar via WhatsApp
                                    </>
                                )}
                            </button>

                            <p className="text-[10px] text-gray-500 text-center mt-4">
                                Ao clicar, você será redirecionado para o WhatsApp para confirmar seu pedido
                            </p>
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Checkout;

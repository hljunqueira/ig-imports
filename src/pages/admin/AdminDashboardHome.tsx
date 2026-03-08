import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Product, productService, Category, categoryService } from '../../lib/products';
import { orderService, Order } from '../../lib/orders';

interface StatCard {
    label: string;
    value: string | number;
    icon: string;
    colorClass: string;
    iconColorClass: string;
}

const AdminDashboardHome: React.FC = () => {
    const [stats, setStats] = useState<StatCard[]>([]);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [products, orders, categories] = await Promise.all([
                productService.getAll(),
                orderService.getAll(),
                categoryService.getAll(),
            ]);

            const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
            const lowStock = products.filter(p => p.stock < 5 && p.stock > 0);
            const outOfStock = products.filter(p => p.stock === 0);
            const pendingOrders = orders.filter(o => o.status === 'pending');

            setStats([
                { label: 'Total de Produtos', value: products.length, icon: 'inventory_2', colorClass: 'text-white', iconColorClass: 'text-primary/40' },
                { label: 'Estoque Total', value: totalStock, icon: 'inventory', colorClass: 'text-white', iconColorClass: 'text-emerald-500/40' },
                { label: 'Pedidos Pendentes', value: pendingOrders.length, icon: 'shopping_cart', colorClass: 'text-amber-500', iconColorClass: 'text-amber-500/40' },
                { label: 'Sem Estoque', value: outOfStock.length, icon: 'warning', colorClass: 'text-red-500', iconColorClass: 'text-red-500/40' },
            ]);

            setRecentOrders(orders.slice(0, 5));
            setLowStockProducts([...lowStock, ...outOfStock].slice(0, 5));
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-card-dark border border-white/5 p-6 hover:border-primary/20 transition-colors">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">
                            {stat.label}
                        </p>
                        <div className="flex items-center justify-between">
                            <h4 className={`text-3xl font-display font-bold ${stat.colorClass}`}>
                                {stat.value}
                            </h4>
                            <span className={`material-symbols-outlined ${stat.iconColorClass}`}>
                                {stat.icon}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Orders */}
                <div className="glass-panel p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-display font-bold tracking-widest">PEDIDOS RECENTES</h3>
                        <Link to="/admin/orders" className="text-[10px] text-primary hover:underline uppercase tracking-widest">
                            Ver todos
                        </Link>
                    </div>
                    
                    {recentOrders.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-8">Nenhum pedido ainda</p>
                    ) : (
                        <div className="space-y-4">
                            {recentOrders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                                    <div>
                                        <p className="text-sm font-semibold">#{order.order_number} - {order.customer_name}</p>
                                        <p className="text-xs text-gray-500">{order.items?.length || 0} itens • {formatCurrency(order.total)}</p>
                                    </div>
                                    {getStatusBadge(order.status || 'pending')}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Low Stock Alert */}
                <div className="glass-panel p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-display font-bold tracking-widest">ESTOQUE BAIXO</h3>
                        <Link to="/admin/products" className="text-[10px] text-primary hover:underline uppercase tracking-widest">
                            Ver todos
                        </Link>
                    </div>

                    {lowStockProducts.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-8">Estoque OK!</p>
                    ) : (
                        <div className="space-y-4">
                            {lowStockProducts.map((product) => (
                                <div key={product.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-12 bg-card-dark border border-white/5 overflow-hidden">
                                            <img
                                                src={product.image_url || 'https://via.placeholder.com/40'}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">{product.name}</p>
                                            <p className="text-xs text-gray-500">{product.category?.name || 'Sem categoria'}</p>
                                        </div>
                                    </div>
                                    <span className={`text-sm font-bold ${product.stock === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                                        {product.stock === 0 ? 'Esgotado' : `${product.stock} un`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-panel p-6">
                <h3 className="text-sm font-display font-bold tracking-widest mb-6">AÇÕES RÁPIDAS</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link
                        to="/admin/products"
                        className="flex flex-col items-center justify-center gap-2 p-6 bg-white/5 hover:bg-primary/10 border border-white/5 hover:border-primary/20 transition-all"
                    >
                        <span className="material-symbols-outlined text-3xl text-primary">add_circle</span>
                        <span className="text-[10px] uppercase tracking-widest text-gray-400">Novo Produto</span>
                    </Link>
                    <Link
                        to="/admin/categories"
                        className="flex flex-col items-center justify-center gap-2 p-6 bg-white/5 hover:bg-primary/10 border border-white/5 hover:border-primary/20 transition-all"
                    >
                        <span className="material-symbols-outlined text-3xl text-primary">category</span>
                        <span className="text-[10px] uppercase tracking-widest text-gray-400">Categorias</span>
                    </Link>
                    <Link
                        to="/admin/orders"
                        className="flex flex-col items-center justify-center gap-2 p-6 bg-white/5 hover:bg-primary/10 border border-white/5 hover:border-primary/20 transition-all"
                    >
                        <span className="material-symbols-outlined text-3xl text-primary">shopping_cart</span>
                        <span className="text-[10px] uppercase tracking-widest text-gray-400">Pedidos</span>
                    </Link>
                    <Link
                        to="/admin/settings"
                        className="flex flex-col items-center justify-center gap-2 p-6 bg-white/5 hover:bg-primary/10 border border-white/5 hover:border-primary/20 transition-all"
                    >
                        <span className="material-symbols-outlined text-3xl text-primary">settings</span>
                        <span className="text-[10px] uppercase tracking-widest text-gray-400">Configurações</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardHome;

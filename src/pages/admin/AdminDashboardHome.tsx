import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Product, productService, Category, categoryService } from '../../lib/products';
import { orderService, Order } from '../../lib/orders';
import { requestsService } from '../../lib/requests';
import { financeService } from '../../lib/finance';
import { inventoryService } from '../../lib/inventory';

// Helper para construir URL completa da imagem
const getImageUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl) return '/ig-imports-logo.png';
  // Se já for URL absoluta (http/https), retorna como está
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  // Se for caminho relativo, adiciona a base da API
  const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
  return `${API_BASE}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

interface StatCard {
    label: string;
    value: string | number;
    icon: string;
    colorClass: string;
    iconColorClass: string;
    trend?: { value: number; isPositive: boolean };
}

interface ChartData {
    label: string;
    value: number;
    color: string;
}

const AdminDashboardHome: React.FC = () => {
    const [stats, setStats] = useState<StatCard[]>([]);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
    const [pendingRequests, setPendingRequests] = useState(0);
    const [todayRevenue, setTodayRevenue] = useState(0);
    const [monthRevenue, setMonthRevenue] = useState(0);
    const [salesChartData, setSalesChartData] = useState<ChartData[]>([]);
    const [categoryChartData, setCategoryChartData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [products, orders, categories, requests, inventoryStats] = await Promise.all([
                productService.getAll(),
                orderService.getAll(),
                categoryService.getAll(),
                requestsService.getPendingRequests().catch(() => []),
                inventoryService.getInventoryStats().catch(() => ({ totalProducts: 0, activeProducts: 0, lowStock: 0, outOfStock: 0, totalStock: 0 })),
            ]);

            const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
            const lowStock = products.filter(p => p.stock < 5 && p.stock > 0);
            const outOfStock = products.filter(p => p.stock === 0);
            const pendingOrders = orders.filter(o => o.status === 'pending');
            
            // Calcular receitas
            const today = new Date().toISOString().split('T')[0];
            const todayOrders = orders.filter(o => {
                const orderDate = o.created_at?.split('T')[0];
                return orderDate === today && (o.status !== 'cancelled');
            });
            const todayRev = todayOrders.reduce((acc, o) => acc + o.total, 0);
            
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const monthOrders = orders.filter(o => {
                const orderDate = o.created_at ? new Date(o.created_at) : null;
                return orderDate && orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear && (o.status !== 'cancelled');
            });
            const monthRev = monthOrders.reduce((acc, o) => acc + o.total, 0);

            setStats([
                { label: 'Total de Produtos', value: products.length, icon: 'inventory_2', colorClass: 'text-white', iconColorClass: 'text-primary/40' },
                { label: 'Estoque Total', value: totalStock, icon: 'inventory', colorClass: 'text-white', iconColorClass: 'text-emerald-500/40' },
                { label: 'Pedidos Pendentes', value: pendingOrders.length, icon: 'shopping_cart', colorClass: 'text-amber-500', iconColorClass: 'text-amber-500/40' },
                { label: 'Sem Estoque', value: outOfStock.length, icon: 'warning', colorClass: 'text-red-500', iconColorClass: 'text-red-500/40' },
                { label: 'Encomendas Pendentes', value: requests.length, icon: 'request_quote', colorClass: 'text-purple-500', iconColorClass: 'text-purple-500/40' },
                { label: 'Receita Hoje', value: formatCurrency(todayRev), icon: 'payments', colorClass: 'text-emerald-500', iconColorClass: 'text-emerald-500/40' },
            ]);

            setTodayRevenue(todayRev);
            setMonthRevenue(monthRev);
            setPendingRequests(requests.length);
            setRecentOrders(orders.slice(0, 5));
            setLowStockProducts([...lowStock, ...outOfStock].slice(0, 5));

            // Dados para gráfico de vendas por status
            const statusCounts = {
                pending: orders.filter(o => o.status === 'pending').length,
                confirmed: orders.filter(o => o.status === 'confirmed').length,
                ready: orders.filter(o => o.status === 'ready').length,
                delivered: orders.filter(o => o.status === 'delivered').length,
                cancelled: orders.filter(o => o.status === 'cancelled').length,
            };
            setSalesChartData([
                { label: 'Pendentes', value: statusCounts.pending, color: 'bg-amber-500' },
                { label: 'Confirmados', value: statusCounts.confirmed, color: 'bg-blue-500' },
                { label: 'Prontos', value: statusCounts.ready, color: 'bg-purple-500' },
                { label: 'Entregues', value: statusCounts.delivered, color: 'bg-emerald-500' },
                { label: 'Cancelados', value: statusCounts.cancelled, color: 'bg-red-500' },
            ].filter(d => d.value > 0));

            // Dados para gráfico de produtos por categoria
            const categoryCounts = categories.map(cat => ({
                label: cat.name,
                value: products.filter(p => p.category_id === cat.id).length,
                color: 'bg-primary',
            })).filter(c => c.value > 0).slice(0, 5);
            setCategoryChartData(categoryCounts);

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
            {/* Stats Grid - 6 cards em 3 colunas em telas grandes */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-card-dark border border-white/5 p-5 hover:border-primary/20 transition-colors">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">
                            {stat.label}
                        </p>
                        <div className="flex items-center justify-between">
                            <h4 className={`text-2xl font-display font-bold ${stat.colorClass}`}>
                                {stat.value}
                            </h4>
                            <span className={`material-symbols-outlined text-xl ${stat.iconColorClass}`}>
                                {stat.icon}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Status Chart */}
                <div className="glass-panel p-6">
                    <h3 className="text-sm font-display font-bold tracking-widest mb-4">PEDIDOS POR STATUS</h3>
                    {salesChartData.length > 0 ? (
                        <div className="space-y-3">
                            {salesChartData.map((item, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <span className="text-xs text-gray-400 w-24">{item.label}</span>
                                    <div className="flex-1 h-6 bg-white/5 rounded overflow-hidden">
                                        <div
                                            className={`h-full ${item.color} transition-all duration-500`}
                                            style={{ 
                                                width: `${Math.max(5, (item.value / Math.max(...salesChartData.map(d => d.value))) * 100)}%` 
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs text-white w-8 text-right">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm text-center py-8">Nenhum pedido registrado</p>
                    )}
                </div>

                {/* Revenue Summary */}
                <div className="glass-panel p-6">
                    <h3 className="text-sm font-display font-bold tracking-widest mb-4">RESUMO FINANCEIRO</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-emerald-500">today</span>
                                <span className="text-sm text-gray-400">Receita Hoje</span>
                            </div>
                            <span className="text-xl font-display font-bold text-emerald-500">
                                {formatCurrency(todayRevenue)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">calendar_month</span>
                                <span className="text-sm text-gray-400">Receita do Mês</span>
                            </div>
                            <span className="text-xl font-display font-bold text-primary">
                                {formatCurrency(monthRevenue)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-purple-500">request_quote</span>
                                <span className="text-sm text-gray-400">Encomendas Pendentes</span>
                            </div>
                            <span className="text-xl font-display font-bold text-purple-500">
                                {pendingRequests}
                            </span>
                        </div>
                    </div>
                </div>
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
                                                src={getImageUrl(product.image_url)}
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

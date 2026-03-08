import React, { useState, useEffect } from 'react';

// Simple chart component using CSS bars
const BarChart: React.FC<{ data: { label: string; value: number; color?: string }[]; maxValue: number }> = ({ data, maxValue }) => {
    return (
        <div className="space-y-2">
            {data.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-20 truncate">{item.label}</span>
                    <div className="flex-1 h-6 bg-white/5 rounded overflow-hidden">
                        <div
                            className={`h-full ${item.color || 'bg-primary'} transition-all duration-500`}
                            style={{ width: `${(item.value / maxValue) * 100}%` }}
                        />
                    </div>
                    <span className="text-xs text-white w-16 text-right">{item.value.toLocaleString()}</span>
                </div>
            ))}
        </div>
    );
};

const AdminReports: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'products' | 'customers' | 'finance'>('overview');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [isLoading, setIsLoading] = useState(false);
    
    // Mock data for demonstration
    const [dashboardData, setDashboardData] = useState({
        today: { orders_today: 5, revenue_today: 1250.00 },
        thisMonth: { orders_this_month: 45, revenue_this_month: 12500.00 },
        pendingOrders: 8,
        lowStockProducts: 3,
        pendingRequests: 5,
    });

    const [salesData, setSalesData] = useState([
        { period: '2024-01', total_orders: 25, total_revenue: 5200 },
        { period: '2024-02', total_orders: 30, total_revenue: 6800 },
        { period: '2024-03', total_orders: 45, total_revenue: 12500 },
    ]);

    const [topProducts, setTopProducts] = useState([
        { name: 'Manchester City Home 24/25', total_sold: 25, total_revenue: 4747.50 },
        { name: 'Real Madrid Home 24/25', total_sold: 20, total_revenue: 3998.00 },
        { name: 'Brasil Home 2024', total_sold: 18, total_revenue: 4138.20 },
    ]);

    const [categoryData, setCategoryData] = useState([
        { category: 'Premier League', revenue: 8500, percentage: 35 },
        { category: 'La Liga', revenue: 6200, percentage: 25 },
        { category: 'Seleções', revenue: 5800, percentage: 23 },
        { category: 'Brasileirão', revenue: 4200, percentage: 17 },
    ]);

    useEffect(() => {
        // In production, fetch from API
        // fetchReportsData();
    }, [activeTab, dateRange]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const handleExport = (type: string) => {
        // In production, call API to export
        console.log(`Exporting ${type}...`);
        alert(`Exportação de ${type} iniciada!`);
    };

    const renderOverview = () => (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-card-dark border border-white/10 p-6 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Vendas Hoje</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(dashboardData.today.revenue_today)}</p>
                    <p className="text-xs text-gray-500 mt-1">{dashboardData.today.orders_today} pedidos</p>
                </div>
                <div className="bg-card-dark border border-white/10 p-6 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Vendas Mês</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(dashboardData.thisMonth.revenue_this_month)}</p>
                    <p className="text-xs text-gray-500 mt-1">{dashboardData.thisMonth.orders_this_month} pedidos</p>
                </div>
                <div className="bg-card-dark border border-white/10 p-6 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Pendentes</p>
                    <p className="text-2xl font-bold text-amber-400">{dashboardData.pendingOrders}</p>
                    <p className="text-xs text-gray-500 mt-1">Pedidos</p>
                </div>
                <div className="bg-card-dark border border-white/10 p-6 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Estoque Baixo</p>
                    <p className="text-2xl font-bold text-red-400">{dashboardData.lowStockProducts}</p>
                    <p className="text-xs text-gray-500 mt-1">Produtos</p>
                </div>
                <div className="bg-card-dark border border-white/10 p-6 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Encomendas</p>
                    <p className="text-2xl font-bold text-blue-400">{dashboardData.pendingRequests}</p>
                    <p className="text-xs text-gray-500 mt-1">Pendentes</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Trend */}
                <div className="bg-card-dark border border-white/10 rounded-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">Vendas por Período</h3>
                        <button onClick={() => handleExport('sales')} className="text-xs text-primary hover:underline">
                            Exportar CSV
                        </button>
                    </div>
                    <BarChart 
                        data={salesData.map(s => ({ label: s.period, value: s.total_revenue }))}
                        maxValue={Math.max(...salesData.map(s => s.total_revenue))}
                    />
                </div>

                {/* Top Products */}
                <div className="bg-card-dark border border-white/10 rounded-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">Top Produtos</h3>
                        <button onClick={() => handleExport('products')} className="text-xs text-primary hover:underline">
                            Exportar CSV
                        </button>
                    </div>
                    <div className="space-y-3">
                        {topProducts.map((product, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded">
                                <div>
                                    <p className="text-white text-sm font-medium">{product.name}</p>
                                    <p className="text-gray-500 text-xs">{product.total_sold} vendidos</p>
                                </div>
                                <span className="text-primary font-semibold">{formatCurrency(product.total_revenue)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-card-dark border border-white/10 rounded-sm p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Vendas por Categoria</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <BarChart 
                        data={categoryData.map(c => ({ label: c.category, value: c.revenue }))}
                        maxValue={Math.max(...categoryData.map(c => c.revenue))}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        {categoryData.map((cat, index) => (
                            <div key={index} className="p-4 bg-white/5 rounded text-center">
                                <p className="text-2xl font-bold text-white">{cat.percentage}%</p>
                                <p className="text-gray-400 text-xs">{cat.category}</p>
                                <p className="text-primary text-sm mt-1">{formatCurrency(cat.revenue)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSalesReport = () => (
        <div className="space-y-6">
            <div className="bg-card-dark border border-white/10 rounded-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-white">Relatório de Vendas Detalhado</h3>
                    <div className="flex gap-2">
                        <input 
                            type="date" 
                            className="bg-background-dark border border-white/10 rounded px-3 py-2 text-sm text-white"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                        />
                        <input 
                            type="date" 
                            className="bg-background-dark border border-white/10 rounded px-3 py-2 text-sm text-white"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                        />
                        <button 
                            onClick={() => handleExport('sales')}
                            className="px-4 py-2 bg-primary text-background-dark text-xs font-bold uppercase rounded hover:brightness-110"
                        >
                            Exportar
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Período</th>
                                <th className="text-right p-4 text-xs uppercase tracking-wider text-gray-400">Pedidos</th>
                                <th className="text-right p-4 text-xs uppercase tracking-wider text-gray-400">Receita</th>
                                <th className="text-right p-4 text-xs uppercase tracking-wider text-gray-400">Ticket Médio</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {salesData.map((row, index) => (
                                <tr key={index} className="hover:bg-white/5">
                                    <td className="p-4 text-white">{row.period}</td>
                                    <td className="p-4 text-right text-white">{row.total_orders}</td>
                                    <td className="p-4 text-right text-primary font-semibold">{formatCurrency(row.total_revenue)}</td>
                                    <td className="p-4 text-right text-gray-400">
                                        {formatCurrency(row.total_revenue / row.total_orders)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">Relatórios Gerenciais</h1>
                <p className="text-gray-400">Análise de vendas, produtos e performance da loja</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-white/10">
                {[
                    { id: 'overview', label: 'Visão Geral', icon: 'dashboard' },
                    { id: 'sales', label: 'Vendas', icon: 'trending_up' },
                    { id: 'products', label: 'Produtos', icon: 'inventory_2' },
                    { id: 'customers', label: 'Clientes', icon: 'people' },
                    { id: 'finance', label: 'Financeiro', icon: 'account_balance' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === tab.id
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'sales' && renderSalesReport()}
                    {activeTab === 'products' && (
                        <div className="text-center py-12 text-gray-400">Módulo em desenvolvimento</div>
                    )}
                    {activeTab === 'customers' && (
                        <div className="text-center py-12 text-gray-400">Módulo em desenvolvimento</div>
                    )}
                    {activeTab === 'finance' && (
                        <div className="text-center py-12 text-gray-400">Módulo em desenvolvimento</div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminReports;

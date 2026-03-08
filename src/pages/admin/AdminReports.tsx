import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../lib/api';

// Simple chart component using CSS bars
const BarChart: React.FC<{ data: { label: string; value: number; color?: string }[]; maxValue: number }> = ({ data, maxValue }) => {
    return (
        <div className="space-y-2">
            {data.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-24 truncate">{item.label}</span>
                    <div className="flex-1 h-6 bg-white/5 rounded overflow-hidden">
                        <div
                            className={`h-full ${item.color || 'bg-primary'} transition-all duration-500`}
                            style={{ width: maxValue > 0 ? `${(item.value / maxValue) * 100}%` : '0%' }}
                        />
                    </div>
                    <span className="text-xs text-white w-20 text-right">{item.value.toLocaleString()}</span>
                </div>
            ))}
        </div>
    );
};

interface DashboardData {
    today: { orders_today: number; revenue_today: number };
    thisMonth: { orders_this_month: number; revenue_this_month: number };
    pendingOrders: number;
    lowStockProducts: number;
    pendingRequests: number;
    recentOrders: any[];
}

interface SalesRow {
    period: string;
    total_orders: number;
    total_revenue: number;
    average_order_value: number;
    unique_customers: number;
}

interface TopProduct {
    name: string;
    total_sold: number;
    total_revenue: number;
    order_count: number;
}

interface CategoryRow {
    category: string;
    revenue: number;
    items_sold: number;
    percentage: number;
}

const AdminReports: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'products' | 'customers' | 'finance'>('overview');
    const currentYear = new Date().getFullYear();
    const [dateRange, setDateRange] = useState({
        start: `${currentYear}-01-01`,
        end: new Date().toISOString().split('T')[0],
    });
    const [isLoading, setIsLoading] = useState(false);

    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [salesData, setSalesData] = useState<SalesRow[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [categoryData, setCategoryData] = useState<CategoryRow[]>([]);
    const [customerData, setCustomerData] = useState<any>(null);
    const [financeData, setFinanceData] = useState<any[]>([]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };

    const loadOverview = useCallback(async () => {
        try {
            const [dashboard, products, sales, categories] = await Promise.all([
                apiClient.get<{ success: boolean; data: DashboardData }>('/reports/dashboard'),
                apiClient.get<{ success: boolean; data: TopProduct[] }>(`/reports/top-products?limit=5&startDate=${dateRange.start}&endDate=${dateRange.end}`),
                apiClient.get<{ success: boolean; data: SalesRow[] }>(`/reports/sales?groupBy=month&startDate=${dateRange.start}&endDate=${dateRange.end}`),
                apiClient.get<{ success: boolean; data: CategoryRow[] }>(`/reports/sales-by-category?startDate=${dateRange.start}&endDate=${dateRange.end}`),
            ]);
            if (dashboard.success) setDashboardData(dashboard.data);
            if (products.success) setTopProducts(products.data);
            if (sales.success) setSalesData(sales.data);
            if (categories.success) setCategoryData(categories.data);
        } catch (error) {
            console.error('Error loading overview:', error);
        }
    }, [dateRange]);

    const loadSalesReport = useCallback(async () => {
        try {
            const response = await apiClient.get<{ success: boolean; data: SalesRow[] }>(
                `/reports/sales?groupBy=month&startDate=${dateRange.start}&endDate=${dateRange.end}`
            );
            if (response.success) setSalesData(response.data);
        } catch (error) {
            console.error('Error loading sales:', error);
        }
    }, [dateRange]);

    const loadProductsReport = useCallback(async () => {
        try {
            const response = await apiClient.get<{ success: boolean; data: TopProduct[] }>(
                `/reports/top-products?limit=20&startDate=${dateRange.start}&endDate=${dateRange.end}`
            );
            if (response.success) setTopProducts(response.data);
        } catch (error) {
            console.error('Error loading products report:', error);
        }
    }, [dateRange]);

    const loadCustomersReport = useCallback(async () => {
        try {
            const response = await apiClient.get<{ success: boolean; data: any }>(
                `/reports/customers?startDate=${dateRange.start}&endDate=${dateRange.end}`
            );
            if (response.success) setCustomerData(response.data);
        } catch (error) {
            console.error('Error loading customers report:', error);
        }
    }, [dateRange]);

    const loadFinanceReport = useCallback(async () => {
        try {
            const response = await apiClient.get<{ success: boolean; data: any[] }>(
                `/reports/financial?startDate=${dateRange.start}&endDate=${dateRange.end}`
            );
            if (response.success) setFinanceData(response.data);
        } catch (error) {
            console.error('Error loading finance report:', error);
        }
    }, [dateRange]);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                if (activeTab === 'overview') await loadOverview();
                else if (activeTab === 'sales') await loadSalesReport();
                else if (activeTab === 'products') await loadProductsReport();
                else if (activeTab === 'customers') await loadCustomersReport();
                else if (activeTab === 'finance') await loadFinanceReport();
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [activeTab, dateRange, loadOverview, loadSalesReport, loadProductsReport, loadCustomersReport, loadFinanceReport]);

    const handleExport = async (type: string) => {
        try {
            window.open(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/reports/export?type=${type}&format=csv&startDate=${dateRange.start}&endDate=${dateRange.end}`,
                '_blank'
            );
        } catch (error) {
            console.error('Error exporting:', error);
        }
    };

    const DateRangeFilter = () => (
        <div className="flex gap-2 items-center">
            <input
                type="date"
                className="bg-background-dark border border-white/10 rounded px-3 py-2 text-sm text-white"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
            <span className="text-gray-500 text-sm">até</span>
            <input
                type="date"
                className="bg-background-dark border border-white/10 rounded px-3 py-2 text-sm text-white"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
        </div>
    );

    const renderOverview = () => (
        <div className="space-y-6">
            <div className="flex justify-end">
                <DateRangeFilter />
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-card-dark border border-white/10 p-6 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Vendas Hoje</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(dashboardData?.today?.revenue_today || 0)}</p>
                    <p className="text-xs text-gray-500 mt-1">{dashboardData?.today?.orders_today || 0} pedidos</p>
                </div>
                <div className="bg-card-dark border border-white/10 p-6 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Vendas Mês</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(dashboardData?.thisMonth?.revenue_this_month || 0)}</p>
                    <p className="text-xs text-gray-500 mt-1">{dashboardData?.thisMonth?.orders_this_month || 0} pedidos</p>
                </div>
                <div className="bg-card-dark border border-white/10 p-6 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Pendentes</p>
                    <p className="text-2xl font-bold text-amber-400">{dashboardData?.pendingOrders || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Pedidos</p>
                </div>
                <div className="bg-card-dark border border-white/10 p-6 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Estoque Baixo</p>
                    <p className="text-2xl font-bold text-red-400">{dashboardData?.lowStockProducts || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Produtos</p>
                </div>
                <div className="bg-card-dark border border-white/10 p-6 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Encomendas</p>
                    <p className="text-2xl font-bold text-blue-400">{dashboardData?.pendingRequests || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Pendentes</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card-dark border border-white/10 rounded-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">Vendas por Período</h3>
                        <button onClick={() => handleExport('orders')} className="text-xs text-primary hover:underline">
                            Exportar CSV
                        </button>
                    </div>
                    {salesData.length > 0 ? (
                        <BarChart
                            data={salesData.map(s => ({ label: s.period, value: Number(s.total_revenue) }))}
                            maxValue={Math.max(...salesData.map(s => Number(s.total_revenue)))}
                        />
                    ) : (
                        <p className="text-gray-500 text-sm text-center py-8">Sem dados para o período selecionado</p>
                    )}
                </div>

                <div className="bg-card-dark border border-white/10 rounded-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">Top Produtos</h3>
                        <button onClick={() => handleExport('products')} className="text-xs text-primary hover:underline">
                            Exportar CSV
                        </button>
                    </div>
                    {topProducts.length > 0 ? (
                        <div className="space-y-3">
                            {topProducts.map((product, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded">
                                    <div>
                                        <p className="text-white text-sm font-medium">{product.name}</p>
                                        <p className="text-gray-500 text-xs">{product.total_sold} vendidos</p>
                                    </div>
                                    <span className="text-primary font-semibold">{formatCurrency(Number(product.total_revenue))}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm text-center py-8">Sem dados para o período selecionado</p>
                    )}
                </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-card-dark border border-white/10 rounded-sm p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Vendas por Categoria</h3>
                {categoryData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <BarChart
                            data={categoryData.map(c => ({ label: c.category || 'Sem categoria', value: Number(c.revenue) }))}
                            maxValue={Math.max(...categoryData.map(c => Number(c.revenue)))}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            {categoryData.slice(0, 4).map((cat, index) => (
                                <div key={index} className="p-4 bg-white/5 rounded text-center">
                                    <p className="text-2xl font-bold text-white">{Number(cat.percentage).toFixed(1)}%</p>
                                    <p className="text-gray-400 text-xs">{cat.category || 'Sem categoria'}</p>
                                    <p className="text-primary text-sm mt-1">{formatCurrency(Number(cat.revenue))}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm text-center py-8">Sem dados para o período selecionado</p>
                )}
            </div>
        </div>
    );

    const renderSalesReport = () => (
        <div className="space-y-6">
            <div className="bg-card-dark border border-white/10 rounded-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-white">Relatório de Vendas Detalhado</h3>
                    <div className="flex gap-2">
                        <DateRangeFilter />
                        <button
                            onClick={() => handleExport('orders')}
                            className="px-4 py-2 bg-primary text-background-dark text-xs font-bold uppercase rounded hover:brightness-110"
                        >
                            Exportar
                        </button>
                    </div>
                </div>

                {salesData.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Período</th>
                                    <th className="text-right p-4 text-xs uppercase tracking-wider text-gray-400">Pedidos</th>
                                    <th className="text-right p-4 text-xs uppercase tracking-wider text-gray-400">Clientes</th>
                                    <th className="text-right p-4 text-xs uppercase tracking-wider text-gray-400">Receita</th>
                                    <th className="text-right p-4 text-xs uppercase tracking-wider text-gray-400">Ticket Médio</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {salesData.map((row, index) => (
                                    <tr key={index} className="hover:bg-white/5">
                                        <td className="p-4 text-white">{row.period}</td>
                                        <td className="p-4 text-right text-white">{row.total_orders}</td>
                                        <td className="p-4 text-right text-gray-400">{row.unique_customers}</td>
                                        <td className="p-4 text-right text-primary font-semibold">{formatCurrency(Number(row.total_revenue))}</td>
                                        <td className="p-4 text-right text-gray-400">
                                            {formatCurrency(Number(row.average_order_value))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <span className="material-symbols-outlined text-4xl mb-2 block">bar_chart</span>
                        Sem dados para o período selecionado
                    </div>
                )}
            </div>
        </div>
    );

    const renderProductsReport = () => (
        <div className="space-y-6">
            <div className="bg-card-dark border border-white/10 rounded-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-white">Produtos Mais Vendidos</h3>
                    <div className="flex gap-2">
                        <DateRangeFilter />
                    </div>
                </div>

                {topProducts.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">#</th>
                                    <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Produto</th>
                                    <th className="text-right p-4 text-xs uppercase tracking-wider text-gray-400">Pedidos</th>
                                    <th className="text-right p-4 text-xs uppercase tracking-wider text-gray-400">Qtd Vendida</th>
                                    <th className="text-right p-4 text-xs uppercase tracking-wider text-gray-400">Receita</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {topProducts.map((product, index) => (
                                    <tr key={index} className="hover:bg-white/5">
                                        <td className="p-4 text-gray-400">{index + 1}</td>
                                        <td className="p-4 text-white font-medium">{product.name}</td>
                                        <td className="p-4 text-right text-gray-400">{product.order_count}</td>
                                        <td className="p-4 text-right text-white">{product.total_sold}</td>
                                        <td className="p-4 text-right text-primary font-semibold">{formatCurrency(Number(product.total_revenue))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <span className="material-symbols-outlined text-4xl mb-2 block">inventory_2</span>
                        Sem dados para o período selecionado
                    </div>
                )}
            </div>
        </div>
    );

    const renderCustomersReport = () => (
        <div className="space-y-6">
            <div className="flex justify-end">
                <DateRangeFilter />
            </div>
            {customerData ? (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-card-dark border border-white/10 p-6 rounded-sm">
                            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Total Clientes</p>
                            <p className="text-2xl font-bold text-white">{customerData.summary?.total_customers || 0}</p>
                        </div>
                        <div className="bg-card-dark border border-white/10 p-6 rounded-sm">
                            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Novos</p>
                            <p className="text-2xl font-bold text-emerald-400">{customerData.summary?.new_customers || 0}</p>
                        </div>
                        <div className="bg-card-dark border border-white/10 p-6 rounded-sm">
                            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Recorrentes</p>
                            <p className="text-2xl font-bold text-primary">{customerData.summary?.returning_customers || 0}</p>
                        </div>
                        <div className="bg-card-dark border border-white/10 p-6 rounded-sm">
                            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Ticket Médio</p>
                            <p className="text-2xl font-bold text-white">{formatCurrency(Number(customerData.summary?.average_customer_value) || 0)}</p>
                        </div>
                    </div>

                    {customerData.topCustomers?.length > 0 && (
                        <div className="bg-card-dark border border-white/10 rounded-sm p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Top Clientes</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Cliente</th>
                                            <th className="text-right p-4 text-xs uppercase tracking-wider text-gray-400">Pedidos</th>
                                            <th className="text-right p-4 text-xs uppercase tracking-wider text-gray-400">Total Gasto</th>
                                            <th className="text-right p-4 text-xs uppercase tracking-wider text-gray-400">Ticket Médio</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {customerData.topCustomers.map((c: any, i: number) => (
                                            <tr key={i} className="hover:bg-white/5">
                                                <td className="p-4">
                                                    <p className="text-white font-medium">{c.customer_name}</p>
                                                    <p className="text-gray-500 text-xs">{c.customer_phone}</p>
                                                </td>
                                                <td className="p-4 text-right text-white">{c.order_count}</td>
                                                <td className="p-4 text-right text-primary font-semibold">{formatCurrency(Number(c.total_spent))}</td>
                                                <td className="p-4 text-right text-gray-400">{formatCurrency(Number(c.average_order))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    <span className="material-symbols-outlined text-4xl mb-2 block">people</span>
                    Sem dados para o período selecionado
                </div>
            )}
        </div>
    );

    const renderFinanceReport = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <DateRangeFilter />
                <button
                    onClick={() => handleExport('transactions')}
                    className="px-4 py-2 bg-primary text-background-dark text-xs font-bold uppercase rounded hover:brightness-110"
                >
                    Exportar
                </button>
            </div>
            {financeData.length > 0 ? (
                <div className="bg-card-dark border border-white/10 rounded-sm p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Relatório Financeiro</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Tipo</th>
                                    <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Categoria</th>
                                    <th className="text-right p-4 text-xs uppercase tracking-wider text-gray-400">Transações</th>
                                    <th className="text-right p-4 text-xs uppercase tracking-wider text-gray-400">Total</th>
                                    <th className="text-right p-4 text-xs uppercase tracking-wider text-gray-400">Média</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {financeData.map((row: any, index: number) => (
                                    <tr key={index} className="hover:bg-white/5">
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-[9px] font-bold uppercase rounded ${
                                                row.transaction_type === 'income'
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : 'bg-red-500/20 text-red-400'
                                            }`}>
                                                {row.transaction_type === 'income' ? 'Entrada' : row.transaction_type === 'expense' ? 'Saída' : row.transaction_type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-white">{row.category}</td>
                                        <td className="p-4 text-right text-gray-400">{row.transaction_count}</td>
                                        <td className="p-4 text-right text-white font-semibold">{formatCurrency(Number(row.total_amount))}</td>
                                        <td className="p-4 text-right text-gray-400">{formatCurrency(Number(row.average_amount))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    <span className="material-symbols-outlined text-4xl mb-2 block">account_balance</span>
                    Sem dados para o período selecionado
                </div>
            )}
        </div>
    );

    return (
        <div className="p-6">
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
                    {activeTab === 'products' && renderProductsReport()}
                    {activeTab === 'customers' && renderCustomersReport()}
                    {activeTab === 'finance' && renderFinanceReport()}
                </>
            )}
        </div>
    );
};

export default AdminReports;

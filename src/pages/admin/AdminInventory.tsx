import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../lib/inventory';
import type { StockMovement, Supplier, Product } from '../../types';

const AdminInventory: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'movements' | 'suppliers' | 'lowstock'>('overview');
    const [movements, setMovements] = useState<(StockMovement & { product: { name: string; image_url: string } })[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
    const [stats, setStats] = useState({
        totalProducts: 0,
        activeProducts: 0,
        lowStock: 0,
        outOfStock: 0,
        totalStock: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'overview' || activeTab === 'movements') {
                const res = await inventoryService.getStockMovements();
                if (res.data) setMovements(res.data);
            }
            if (activeTab === 'overview' || activeTab === 'suppliers') {
                const res = await inventoryService.getSuppliers();
                if (res.data) setSuppliers(res.data);
            }
            if (activeTab === 'overview' || activeTab === 'lowstock') {
                const res = await inventoryService.getLowStockProducts();
                if (res.data) setLowStockProducts(res.data);
            }
            if (activeTab === 'overview') {
                const res = await inventoryService.getInventoryStats();
                if (res.data) setStats(res.data);
            }
        } catch (error) {
            console.error('Error loading inventory data:', error);
        }
        setIsLoading(false);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR');
    };

    const getMovementTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            in: 'bg-green-500/20 text-green-400',
            out: 'bg-red-500/20 text-red-400',
            adjustment: 'bg-yellow-500/20 text-yellow-400',
            return: 'bg-blue-500/20 text-blue-400',
            transfer: 'bg-purple-500/20 text-purple-400',
        };
        return colors[type] || 'bg-gray-500/20 text-gray-400';
    };

    const getMovementTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            in: 'Entrada',
            out: 'Saída',
            adjustment: 'Ajuste',
            return: 'Devolução',
            transfer: 'Transferência',
        };
        return labels[type] || type;
    };

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-card-dark border border-white/10 p-6 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Total de Produtos</p>
                    <p className="text-2xl font-bold text-white">{stats.totalProducts}</p>
                </div>
                <div className="bg-card-dark border border-white/10 p-6 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Ativos</p>
                    <p className="text-2xl font-bold text-green-400">{stats.activeProducts}</p>
                </div>
                <div className="bg-card-dark border border-white/10 p-6 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Estoque Baixo</p>
                    <p className="text-2xl font-bold text-yellow-400">{stats.lowStock}</p>
                </div>
                <div className="bg-card-dark border border-white/10 p-6 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Sem Estoque</p>
                    <p className="text-2xl font-bold text-red-400">{stats.outOfStock}</p>
                </div>
                <div className="bg-card-dark border border-white/10 p-6 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Total em Estoque</p>
                    <p className="text-2xl font-bold text-white">{stats.totalStock}</p>
                </div>
            </div>

            {/* Low Stock Alert */}
            {lowStockProducts.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-red-400">warning</span>
                        <h3 className="text-lg font-semibold text-red-400">Alerta de Estoque Baixo</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {lowStockProducts.slice(0, 6).map((product) => (
                            <div key={product.id} className="flex items-center gap-3 p-3 bg-white/5 rounded">
                                {product.image_url && (
                                    <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{product.name}</p>
                                    <p className="text-red-400 text-xs">{product.stock} unidades</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {lowStockProducts.length > 6 && (
                        <p className="text-center text-gray-400 text-sm mt-3">
                            +{lowStockProducts.length - 6} produtos com estoque baixo
                        </p>
                    )}
                </div>
            )}

            {/* Recent Movements */}
            <div className="bg-card-dark border border-white/10 rounded-sm">
                <div className="p-4 border-b border-white/10">
                    <h3 className="text-lg font-semibold text-white">Movimentações Recentes</h3>
                </div>
                <div className="p-4">
                    {movements.slice(0, 5).map((movement) => (
                        <div key={movement.id} className="flex items-center gap-4 p-3 bg-white/5 rounded mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getMovementTypeColor(movement.movement_type)}`}>
                                {getMovementTypeLabel(movement.movement_type)}
                            </span>
                            <div className="flex-1">
                                <p className="text-white text-sm">{movement.product.name}</p>
                                <p className="text-gray-500 text-xs">{movement.reason || 'Sem motivo informado'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-white text-sm">
                                    {movement.previous_stock} → {movement.new_stock}
                                </p>
                                <p className="text-gray-500 text-xs">{formatDate(movement.created_at!)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderMovements = () => (
        <div className="bg-card-dark border border-white/10 rounded-sm">
            <div className="p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">Histórico de Movimentações</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-white/5">
                        <tr>
                            <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Data</th>
                            <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Produto</th>
                            <th className="text-center p-4 text-xs uppercase tracking-wider text-gray-400">Tipo</th>
                            <th className="text-center p-4 text-xs uppercase tracking-wider text-gray-400">Anterior</th>
                            <th className="text-center p-4 text-xs uppercase tracking-wider text-gray-400">Novo</th>
                            <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Motivo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {movements.map((m) => (
                            <tr key={m.id} className="hover:bg-white/5">
                                <td className="p-4 text-sm text-white">{formatDate(m.created_at!)}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        {m.product.image_url && (
                                            <img src={m.product.image_url} alt={m.product.name} className="w-10 h-10 object-cover rounded" />
                                        )}
                                        <span className="text-white text-sm">{m.product.name}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getMovementTypeColor(m.movement_type)}`}>
                                        {getMovementTypeLabel(m.movement_type)}
                                    </span>
                                </td>
                                <td className="p-4 text-center text-white">{m.previous_stock}</td>
                                <td className="p-4 text-center text-white font-medium">{m.new_stock}</td>
                                <td className="p-4 text-sm text-gray-400">{m.reason || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderSuppliers = () => (
        <div className="bg-card-dark border border-white/10 rounded-sm">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Fornecedores</h3>
                <button className="px-4 py-2 bg-primary text-background-dark text-xs font-bold uppercase tracking-wider rounded-sm hover:brightness-110">
                    Novo Fornecedor
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-white/5">
                        <tr>
                            <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Nome</th>
                            <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Contato</th>
                            <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Telefone</th>
                            <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Email</th>
                            <th className="text-center p-4 text-xs uppercase tracking-wider text-gray-400">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {suppliers.map((s) => (
                            <tr key={s.id} className="hover:bg-white/5">
                                <td className="p-4 text-sm text-white font-medium">{s.name}</td>
                                <td className="p-4 text-sm text-gray-400">{s.contact_name || '-'}</td>
                                <td className="p-4 text-sm text-gray-400">{s.phone || '-'}</td>
                                <td className="p-4 text-sm text-gray-400">{s.email || '-'}</td>
                                <td className="p-4 text-center">
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${
                                            s.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                        }`}
                                    >
                                        {s.is_active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderLowStock = () => (
        <div className="bg-card-dark border border-white/10 rounded-sm">
            <div className="p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">Produtos com Estoque Baixo</h3>
            </div>
            <div className="p-4">
                {lowStockProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
                        <p>Todos os produtos estão com estoque adequado</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {lowStockProducts.map((product) => (
                            <div key={product.id} className="p-4 bg-white/5 rounded border border-white/10">
                                <div className="flex items-start gap-3">
                                    {product.image_url && (
                                        <img src={product.image_url} alt={product.name} className="w-16 h-16 object-cover rounded" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium truncate">{product.name}</p>
                                        <p className="text-gray-400 text-sm">{product.category?.name}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span
                                                className={`text-lg font-bold ${
                                                    product.stock === 0 ? 'text-red-400' : 'text-yellow-400'
                                                }`}
                                            >
                                                {product.stock}
                                            </span>
                                            <span className="text-gray-500 text-xs">unidades</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-white/10 flex gap-2">
                                    <button className="flex-1 px-3 py-2 bg-primary/20 text-primary text-xs font-medium rounded hover:bg-primary/30">
                                        Repor Estoque
                                    </button>
                                    <button className="px-3 py-2 border border-white/10 text-gray-400 text-xs rounded hover:bg-white/5">
                                        Editar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">Controle de Estoque</h1>
                <p className="text-gray-400">Gerencie movimentações, fornecedores e níveis de estoque</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-white/10">
                {[
                    { id: 'overview', label: 'Visão Geral' },
                    { id: 'movements', label: 'Movimentações' },
                    { id: 'suppliers', label: 'Fornecedores' },
                    { id: 'lowstock', label: 'Estoque Baixo' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === tab.id
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
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
                    {activeTab === 'movements' && renderMovements()}
                    {activeTab === 'suppliers' && renderSuppliers()}
                    {activeTab === 'lowstock' && renderLowStock()}
                </>
            )}
        </div>
    );
};

export default AdminInventory;

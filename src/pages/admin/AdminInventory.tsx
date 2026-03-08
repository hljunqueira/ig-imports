import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../lib/inventory';
import { productService } from '../../lib/products';
import type { StockMovement, Supplier, Product } from '../../types';
import { useDialog } from '../../context/DialogContext';

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

const AdminInventory: React.FC = () => {
    const { alert: dialogAlert, confirm, error } = useDialog();
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

    // Modals state
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [allProducts, setAllProducts] = useState<Product[]>([]);

    // Form states
    const [supplierForm, setSupplierForm] = useState({
        name: '',
        contact_name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
    });
    const [stockForm, setStockForm] = useState({
        product_id: '',
        movement_type: 'in' as 'in' | 'out' | 'adjustment',
        quantity: '',
        reason: '',
    });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'overview' || activeTab === 'movements') {
                const data = await inventoryService.getStockMovements();
                setMovements(data as any);
            }
            if (activeTab === 'overview' || activeTab === 'suppliers') {
                const data = await inventoryService.getSuppliers();
                setSuppliers(data);
            }
            if (activeTab === 'overview' || activeTab === 'lowstock') {
                const data = await inventoryService.getLowStockProducts();
                setLowStockProducts(data as any);
            }
            if (activeTab === 'overview') {
                const data = await inventoryService.getInventoryStats();
                setStats(data);
            }
            // Load all products for stock modal
            if (activeTab === 'lowstock') {
                const products = await productService.getAll();
                setAllProducts(products);
            }
        } catch (err) {
            console.error('Error loading inventory data:', err);
        }
        setIsLoading(false);
    };

    const handleCreateSupplier = async () => {
        if (!supplierForm.name) {
            await dialogAlert('Nome do fornecedor é obrigatório');
            return;
        }
        try {
            await inventoryService.createSupplier(supplierForm);
            await dialogAlert('Fornecedor criado com sucesso!');
            setShowSupplierModal(false);
            setSupplierForm({ name: '', contact_name: '', phone: '', email: '', address: '', notes: '' });
            loadData();
        } catch (err) {
            await error('Erro ao criar fornecedor');
        }
    };

    const handleStockMovement = async () => {
        if (!stockForm.product_id || !stockForm.quantity) {
            await dialogAlert('Produto e quantidade são obrigatórios');
            return;
        }
        const quantity = parseInt(stockForm.quantity);
        if (isNaN(quantity) || quantity <= 0) {
            await dialogAlert('Quantidade inválida');
            return;
        }
        try {
            await inventoryService.createStockMovement({
                product_id: stockForm.product_id,
                movement_type: stockForm.movement_type,
                quantity,
                previous_stock: 0,
                new_stock: 0,
                reason: stockForm.reason,
            });
            await dialogAlert('Movimentação registrada com sucesso!');
            setShowStockModal(false);
            setStockForm({ product_id: '', movement_type: 'in', quantity: '', reason: '' });
            setSelectedProduct(null);
            loadData();
        } catch (err) {
            await error('Erro ao registrar movimentação');
        }
    };

    const openStockModal = (product?: Product) => {
        if (product) {
            setSelectedProduct(product);
            setStockForm({
                product_id: product.id,
                movement_type: 'in',
                quantity: '',
                reason: '',
            });
        } else {
            setSelectedProduct(null);
            setStockForm({
                product_id: '',
                movement_type: 'in',
                quantity: '',
                reason: '',
            });
        }
        setShowStockModal(true);
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
                                    <img src={getImageUrl(product.image_url)} alt={product.name} className="w-12 h-12 object-cover rounded" />
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
                                            <img src={getImageUrl(m.product.image_url)} alt={m.product.name} className="w-10 h-10 object-cover rounded" />
                                            
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
                <button 
                    onClick={() => setShowSupplierModal(true)}
                    className="px-4 py-2 bg-primary text-background-dark text-xs font-bold uppercase tracking-wider rounded-sm hover:brightness-110"
                >
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
                                    <button 
                                        onClick={() => openStockModal(product)}
                                        className="flex-1 px-3 py-2 bg-primary/20 text-primary text-xs font-medium rounded hover:bg-primary/30"
                                    >
                                        Repor Estoque
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

            {/* Supplier Modal */}
            {showSupplierModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-card-dark border border-white/10 rounded-sm max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-white mb-4">Novo Fornecedor</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Nome *</label>
                                <input
                                    type="text"
                                    value={supplierForm.name}
                                    onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                                    className="w-full bg-background-dark border border-white/10 rounded-sm px-4 py-2 text-white"
                                    placeholder="Nome do fornecedor"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Nome do Contato</label>
                                <input
                                    type="text"
                                    value={supplierForm.contact_name}
                                    onChange={(e) => setSupplierForm({ ...supplierForm, contact_name: e.target.value })}
                                    className="w-full bg-background-dark border border-white/10 rounded-sm px-4 py-2 text-white"
                                    placeholder="Nome da pessoa de contato"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Telefone</label>
                                    <input
                                        type="text"
                                        value={supplierForm.phone}
                                        onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                                        className="w-full bg-background-dark border border-white/10 rounded-sm px-4 py-2 text-white"
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={supplierForm.email}
                                        onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                                        className="w-full bg-background-dark border border-white/10 rounded-sm px-4 py-2 text-white"
                                        placeholder="email@exemplo.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Endereço</label>
                                <input
                                    type="text"
                                    value={supplierForm.address}
                                    onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                                    className="w-full bg-background-dark border border-white/10 rounded-sm px-4 py-2 text-white"
                                    placeholder="Endereço completo"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Observações</label>
                                <textarea
                                    value={supplierForm.notes}
                                    onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                                    className="w-full bg-background-dark border border-white/10 rounded-sm px-4 py-2 text-white h-20 resize-none"
                                    placeholder="Informações adicionais..."
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowSupplierModal(false);
                                    setSupplierForm({ name: '', contact_name: '', phone: '', email: '', address: '', notes: '' });
                                }}
                                className="flex-1 px-4 py-2 border border-white/10 text-white rounded-sm hover:bg-white/5"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateSupplier}
                                className="flex-1 px-4 py-2 bg-primary text-background-dark font-bold rounded-sm hover:brightness-110"
                            >
                                Criar Fornecedor
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stock Movement Modal */}
            {showStockModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-card-dark border border-white/10 rounded-sm max-w-lg w-full p-6">
                        <h3 className="text-xl font-bold text-white mb-4">
                            {selectedProduct ? `Repor Estoque - ${selectedProduct.name}` : 'Movimentação de Estoque'}
                        </h3>
                        <div className="space-y-4">
                            {!selectedProduct && (
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Produto *</label>
                                    <select
                                        value={stockForm.product_id}
                                        onChange={(e) => {
                                            const product = allProducts.find(p => p.id === e.target.value);
                                            setSelectedProduct(product || null);
                                            setStockForm({ ...stockForm, product_id: e.target.value });
                                        }}
                                        className="w-full bg-background-dark border border-white/10 rounded-sm px-4 py-2 text-white"
                                    >
                                        <option value="">Selecione um produto</option>
                                        {allProducts.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name} (Estoque: {p.stock})</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Tipo de Movimentação *</label>
                                <select
                                    value={stockForm.movement_type}
                                    onChange={(e) => setStockForm({ ...stockForm, movement_type: e.target.value as any })}
                                    className="w-full bg-background-dark border border-white/10 rounded-sm px-4 py-2 text-white"
                                >
                                    <option value="in">Entrada (Compra/Devolução)</option>
                                    <option value="out">Saída (Ajuste/Venda)</option>
                                    <option value="adjustment">Ajuste (Definir valor)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Quantidade *</label>
                                <input
                                    type="number"
                                    value={stockForm.quantity}
                                    onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                                    className="w-full bg-background-dark border border-white/10 rounded-sm px-4 py-2 text-white"
                                    placeholder="0"
                                    min="1"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Motivo/Observação</label>
                                <textarea
                                    value={stockForm.reason}
                                    onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
                                    className="w-full bg-background-dark border border-white/10 rounded-sm px-4 py-2 text-white h-20 resize-none"
                                    placeholder="Motivo da movimentação..."
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowStockModal(false);
                                    setSelectedProduct(null);
                                    setStockForm({ product_id: '', movement_type: 'in', quantity: '', reason: '' });
                                }}
                                className="flex-1 px-4 py-2 border border-white/10 text-white rounded-sm hover:bg-white/5"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleStockMovement}
                                className="flex-1 px-4 py-2 bg-primary text-background-dark font-bold rounded-sm hover:brightness-110"
                            >
                                Registrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInventory;

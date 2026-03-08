import React, { useState, useEffect } from 'react';
import { Order, orderService } from '../../lib/orders';
import { Product, productService } from '../../lib/products';
import Modal from '../../components/Modal';
import { useDialog } from '../../context/DialogContext';

interface OrderItem {
    product_id: string;
    product_name: string;
    size?: string;
    quantity: number;
    unit_price: number;
}

const AdminOrders: React.FC = () => {
    const { error, success } = useDialog();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [updating, setUpdating] = useState(false);

    // Modal de criação de pedido manual
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [orderForm, setOrderForm] = useState({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        delivery_type: 'pickup' as 'pickup' | 'delivery',
        address: '',
        notes: '',
    });
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedQuantity, setSelectedQuantity] = useState(1);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const data = await orderService.getAll();
            setOrders(data);
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadProducts = async () => {
        setLoadingProducts(true);
        try {
            const data = await productService.getAll({ status: 'active' });
            setProducts(data);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleOpenCreateModal = () => {
        setOrderForm({
            customer_name: '',
            customer_phone: '',
            customer_email: '',
            delivery_type: 'pickup',
            address: '',
            notes: '',
        });
        setOrderItems([]);
        setSelectedProductId('');
        setSelectedSize('');
        setSelectedQuantity(1);
        loadProducts();
        setCreateModalOpen(true);
    };

    const handleAddItem = () => {
        if (!selectedProductId) return;
        const product = products.find(p => p.id === selectedProductId);
        if (!product) return;

        const newItem: OrderItem = {
            product_id: product.id,
            product_name: product.name,
            size: selectedSize || undefined,
            quantity: selectedQuantity,
            unit_price: product.price,
        };

        setOrderItems([...orderItems, newItem]);
        setSelectedProductId('');
        setSelectedSize('');
        setSelectedQuantity(1);
    };

    const handleRemoveItem = (index: number) => {
        setOrderItems(orderItems.filter((_, i) => i !== index));
    };

    const calculateTotal = () => {
        return orderItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    };

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (orderItems.length === 0) {
            await error('Adicione pelo menos um item ao pedido');
            return;
        }
        if (!orderForm.customer_name || !orderForm.customer_phone) {
            await error('Nome e telefone do cliente são obrigatórios');
            return;
        }

        setCreating(true);
        try {
            await orderService.create({
                customer_name: orderForm.customer_name,
                customer_phone: orderForm.customer_phone,
                customer_email: orderForm.customer_email || undefined,
                delivery_type: orderForm.delivery_type,
                address: orderForm.delivery_type === 'delivery' ? orderForm.address : undefined,
                total: calculateTotal(),
                status: 'pending',
                notes: orderForm.notes || undefined,
                items: orderItems,
            });
            await success('Pedido criado com sucesso!');
            setCreateModalOpen(false);
            loadOrders();
        } catch (err) {
            console.error('Error creating order:', err);
            await error('Erro ao criar pedido');
        } finally {
            setCreating(false);
        }
    };

    const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
        setUpdating(true);
        try {
            await orderService.updateStatus(orderId, newStatus);
            await loadOrders();
            if (selectedOrder?.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
        } catch (err) {
            console.error('Error updating order status:', err);
            await error('Erro ao atualizar status do pedido');
        } finally {
            setUpdating(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        if (filterStatus && order.status !== filterStatus) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                order.customer_name.toLowerCase().includes(query) ||
                order.customer_phone.includes(query) ||
                order.order_number?.toString().includes(query) ||
                order.customer_email?.toLowerCase().includes(query)
            );
        }
        return true;
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
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

    const statusOptions = [
        { value: 'pending', label: 'Pendente' },
        { value: 'confirmed', label: 'Confirmado' },
        { value: 'ready', label: 'Pronto para Entrega' },
        { value: 'delivered', label: 'Entregue' },
        { value: 'cancelled', label: 'Cancelado' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header com botão Novo Pedido */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-display font-bold">Gerenciar Pedidos</h2>
                <button
                    onClick={handleOpenCreateModal}
                    className="gold-gradient text-background-dark px-6 py-3 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/10"
                >
                    <span className="material-symbols-outlined text-base">add</span>
                    Novo Pedido
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {statusOptions.map((status) => {
                    const count = orders.filter(o => o.status === status.value).length;
                    return (
                        <button
                            key={status.value}
                            onClick={() => setFilterStatus(filterStatus === status.value ? '' : status.value)}
                            className={`p-4 border transition-all ${filterStatus === status.value ? 'border-primary bg-primary/5' : 'border-white/5 hover:border-white/10'}`}
                        >
                            <p className="text-2xl font-display font-bold">{count}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{status.label}</p>
                        </button>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                        search
                    </span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por nome, telefone, email ou pedido..."
                        className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-sm focus:border-primary outline-none transition-all placeholder:text-gray-600"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-background-dark border border-white/10 text-[11px] uppercase tracking-widest px-4 py-2.5 outline-none focus:border-primary transition-colors"
                >
                    <option value="">Todos Status</option>
                    {statusOptions.map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                </select>
            </div>

            {/* Orders Table */}
            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-primary">Pedido</th>
                                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-primary">Cliente</th>
                                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-primary">Entrega</th>
                                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-primary">Total</th>
                                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-primary">Status</th>
                                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-primary text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-6">
                                        <p className="text-sm font-semibold">#{order.order_number}</p>
                                        <p className="text-[10px] text-gray-500">{formatDate(order.created_at || '')}</p>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-sm font-semibold">{order.customer_name}</p>
                                        <p className="text-[10px] text-gray-500">{order.customer_phone}</p>
                                        {order.customer_email && (
                                            <p className="text-[10px] text-gray-600">{order.customer_email}</p>
                                        )}
                                    </td>
                                    <td className="p-6">
                                        <span className={`text-[10px] uppercase tracking-widest ${order.delivery_type === 'pickup' ? 'text-blue-400' : 'text-purple-400'}`}>
                                            {order.delivery_type === 'pickup' ? '🏪 Retirada' : '🚗 Entrega'}
                                        </span>
                                        {order.address && (
                                            <p className="text-[10px] text-gray-500 mt-1 truncate max-w-50">{order.address}</p>
                                        )}
                                    </td>
                                    <td className="p-6">
                                        <p className="text-sm font-display font-bold">{formatCurrency(order.total)}</p>
                                        <p className="text-[10px] text-gray-500">{order.items?.length || 0} itens</p>
                                    </td>
                                    <td className="p-6">
                                        {getStatusBadge(order.status || 'pending')}
                                    </td>
                                    <td className="p-6 text-right">
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="p-2 hover:bg-white/5 text-gray-400 hover:text-primary transition-all"
                                        >
                                            <span className="material-symbols-outlined text-lg">visibility</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredOrders.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-gray-500">Nenhum pedido encontrado</p>
                    </div>
                )}
            </div>

            {/* Create Order Modal */}
            <Modal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title="Criar Pedido Manual"
                size="lg"
            >
                <form onSubmit={handleCreateOrder} className="space-y-6">
                    {/* Dados do Cliente */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                Nome do Cliente *
                            </label>
                            <input
                                type="text"
                                required
                                value={orderForm.customer_name}
                                onChange={(e) => setOrderForm({ ...orderForm, customer_name: e.target.value })}
                                className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                placeholder="Nome completo"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                Telefone *
                            </label>
                            <input
                                type="tel"
                                required
                                value={orderForm.customer_phone}
                                onChange={(e) => setOrderForm({ ...orderForm, customer_phone: e.target.value })}
                                className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                placeholder="(48) 99999-9999"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                            E-mail
                        </label>
                        <input
                            type="email"
                            value={orderForm.customer_email}
                            onChange={(e) => setOrderForm({ ...orderForm, customer_email: e.target.value })}
                            className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            placeholder="cliente@email.com"
                        />
                    </div>

                    {/* Tipo de Entrega */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setOrderForm({ ...orderForm, delivery_type: 'pickup' })}
                            className={`p-4 border text-center transition-all ${
                                orderForm.delivery_type === 'pickup'
                                    ? 'border-primary bg-primary/10'
                                    : 'border-white/10 hover:border-white/20'
                            }`}
                        >
                            <span className="material-symbols-outlined text-2xl mb-2 block">store</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Retirada</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setOrderForm({ ...orderForm, delivery_type: 'delivery' })}
                            className={`p-4 border text-center transition-all ${
                                orderForm.delivery_type === 'delivery'
                                    ? 'border-primary bg-primary/10'
                                    : 'border-white/10 hover:border-white/20'
                            }`}
                        >
                            <span className="material-symbols-outlined text-2xl mb-2 block">local_shipping</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Entrega</span>
                        </button>
                    </div>

                    {orderForm.delivery_type === 'delivery' && (
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                Endereço de Entrega *
                            </label>
                            <textarea
                                required={orderForm.delivery_type === 'delivery'}
                                rows={2}
                                value={orderForm.address}
                                onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                                className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors resize-none"
                                placeholder="Rua, número, bairro, cidade..."
                            />
                        </div>
                    )}

                    {/* Adicionar Itens */}
                    <div className="border border-white/10 p-4 space-y-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary">Adicionar Itens</h4>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="md:col-span-2">
                                <select
                                    value={selectedProductId}
                                    onChange={(e) => {
                                        setSelectedProductId(e.target.value);
                                        setSelectedSize('');
                                    }}
                                    className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                >
                                    <option value="">Selecione um produto...</option>
                                    {products.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name} — {formatCurrency(product.price)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <select
                                    value={selectedSize}
                                    onChange={(e) => setSelectedSize(e.target.value)}
                                    disabled={!selectedProductId}
                                    className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors disabled:opacity-50"
                                >
                                    <option value="">Tamanho</option>
                                    {selectedProductId && products.find(p => p.id === selectedProductId)?.sizes?.map((size) => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    value={selectedQuantity}
                                    onChange={(e) => setSelectedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="flex-1 bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                    placeholder="Qtd"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    disabled={!selectedProductId}
                                    className="px-4 bg-primary text-background-dark font-bold hover:bg-white transition-colors disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined">add</span>
                                </button>
                            </div>
                        </div>

                        {/* Lista de Itens */}
                        {orderItems.length > 0 ? (
                            <div className="space-y-2">
                                {orderItems.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-white/5">
                                        <div>
                                            <p className="text-sm font-semibold">{item.product_name}</p>
                                            {item.size && <p className="text-[10px] text-gray-500">Tamanho: {item.size}</p>}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm">{item.quantity}x {formatCurrency(item.unit_price)}</span>
                                            <span className="text-sm font-bold">{formatCurrency(item.unit_price * item.quantity)}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(index)}
                                                className="p-1 hover:text-red-500 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm text-center py-4">Nenhum item adicionado</p>
                        )}
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center pt-4 border-t border-white/10">
                        <span className="text-gray-400 text-sm">Total ({orderItems.length} itens)</span>
                        <span className="text-2xl font-display font-bold text-primary">{formatCurrency(calculateTotal())}</span>
                    </div>

                    {/* Observações */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                            Observações
                        </label>
                        <textarea
                            rows={2}
                            value={orderForm.notes}
                            onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                            className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors resize-none"
                            placeholder="Observações internas sobre o pedido..."
                        />
                    </div>

                    {/* Botões */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => setCreateModalOpen(false)}
                            className="flex-1 px-6 py-3 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:border-primary transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={creating || orderItems.length === 0}
                            className="flex-1 gold-gradient text-background-dark px-6 py-3 font-bold uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-50"
                        >
                            {creating ? 'Criando...' : 'Criar Pedido'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Order Details Modal */}
            <Modal
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                title={`Pedido #${selectedOrder?.order_number}`}
                size="lg"
            >
                {selectedOrder && (
                    <div className="space-y-6">
                        {/* Customer Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Cliente</h4>
                                <p className="text-sm font-semibold">{selectedOrder.customer_name}</p>
                                <p className="text-sm text-gray-400">{selectedOrder.customer_phone}</p>
                                {selectedOrder.customer_email && (
                                    <p className="text-sm text-gray-500">{selectedOrder.customer_email}</p>
                                )}
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Entrega</h4>
                                <p className="text-sm">
                                    {selectedOrder.delivery_type === 'pickup' ? '🏪 Retirada na loja' : '🚗 Entrega'}
                                </p>
                                {selectedOrder.address && (
                                    <p className="text-sm text-gray-400 mt-1">{selectedOrder.address}</p>
                                )}
                            </div>
                        </div>

                        {/* Items */}
                        <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Itens</h4>
                            <div className="space-y-3">
                                {selectedOrder.items?.map((item, index) => (
                                    <div key={index} className="flex items-center gap-4 p-3 bg-white/5">
                                        {item.product_image && (
                                            <div className="w-12 h-14 bg-card-dark border border-white/5 overflow-hidden">
                                                <img
                                                    src={item.product_image}
                                                    alt={item.product_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold">{item.product_name}</p>
                                            {item.size && (
                                                <p className="text-[10px] text-gray-500">Tamanho: {item.size}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm">{item.quantity}x {formatCurrency(item.unit_price)}</p>
                                            <p className="text-sm font-bold">{formatCurrency(item.unit_price * item.quantity)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        {selectedOrder.notes && (
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Observações</h4>
                                <p className="text-sm text-gray-300 bg-white/5 p-3">{selectedOrder.notes}</p>
                            </div>
                        )}

                        {/* Total */}
                        <div className="flex justify-between items-center pt-4 border-t border-white/10">
                            <span className="text-sm text-gray-400">Total</span>
                            <span className="text-xl font-display font-bold">{formatCurrency(selectedOrder.total)}</span>
                        </div>

                        {/* Status Change */}
                        <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Atualizar Status</h4>
                            <div className="flex flex-wrap gap-2">
                                {statusOptions.map((status) => (
                                    <button
                                        key={status.value}
                                        onClick={() => handleStatusChange(selectedOrder.id!, status.value as Order['status'])}
                                        disabled={updating || selectedOrder.status === status.value}
                                        className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                                            selectedOrder.status === status.value
                                                ? 'border-primary bg-primary text-background-dark'
                                                : 'border-white/20 text-gray-400 hover:border-primary hover:text-white'
                                        } disabled:opacity-50`}
                                    >
                                        {status.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Date */}
                        <p className="text-[10px] text-gray-500 text-center">
                            Pedido realizado em {formatDate(selectedOrder.created_at || '')}
                        </p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminOrders;

import React, { useState, useEffect } from 'react';
import { requestsService } from '../../lib/requests';
import type { ProductRequest } from '../../types';
import { useDialog } from '../../context/DialogContext';

const AdminRequests: React.FC = () => {
    const { alert: dialogAlert, error, success } = useDialog();
    const [requests, setRequests] = useState<ProductRequest[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        reviewing: 0,
        quoted: 0,
        urgent: 0,
        high: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'reviewing' | 'quoted' | 'approved'>('all');
    const [selectedRequest, setSelectedRequest] = useState<ProductRequest | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [quotePrice, setQuotePrice] = useState('');
    const [adminNotes, setAdminNotes] = useState('');

    // Modal de criação de solicitação
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        product_description: '',
        preferred_brand: '',
        preferred_size: '',
        quantity: 1,
        max_budget: '',
        urgency: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    });

    useEffect(() => {
        loadData();
    }, [filter]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const statusFilter = filter === 'all' ? undefined : filter;
            const [requestsData, statsData] = await Promise.all([
                requestsService.getRequests(statusFilter ? { status: statusFilter } : undefined),
                requestsService.getRequestStats(),
            ]);
            setRequests(requestsData);
            setStats(statsData);
        } catch (error) {
            console.error('Error loading requests:', error);
        }
        setIsLoading(false);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR');
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const getUrgencyColor = (urgency: string) => {
        const colors: Record<string, string> = {
            low: 'bg-gray-500/20 text-gray-400',
            normal: 'bg-blue-500/20 text-blue-400',
            high: 'bg-orange-500/20 text-orange-400',
            urgent: 'bg-red-500/20 text-red-400',
        };
        return colors[urgency] || colors.normal;
    };

    const getUrgencyLabel = (urgency: string) => {
        const labels: Record<string, string> = {
            low: 'Baixa',
            normal: 'Normal',
            high: 'Alta',
            urgent: 'Urgente',
        };
        return labels[urgency] || urgency;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-500/20 text-yellow-400',
            reviewing: 'bg-blue-500/20 text-blue-400',
            quoted: 'bg-purple-500/20 text-purple-400',
            approved: 'bg-green-500/20 text-green-400',
            ordered: 'bg-indigo-500/20 text-indigo-400',
            available: 'bg-green-500/20 text-green-400',
            cancelled: 'bg-red-500/20 text-red-400',
            rejected: 'bg-red-500/20 text-red-400',
        };
        return colors[status] || 'bg-gray-500/20 text-gray-400';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pending: 'Pendente',
            reviewing: 'Em Análise',
            quoted: 'Orçado',
            approved: 'Aprovado',
            ordered: 'Pedido Realizado',
            available: 'Disponível',
            cancelled: 'Cancelado',
            rejected: 'Rejeitado',
        };
        return labels[status] || status;
    };

    const handleQuote = async () => {
        if (!selectedRequest || !quotePrice) return;

        const price = parseFloat(quotePrice);
        if (isNaN(price) || price <= 0) {
            await dialogAlert('Preço inválido');
            return;
        }

        try {
            await requestsService.quoteRequest(selectedRequest.id, price, undefined, adminNotes);
            await dialogAlert('Orçamento enviado com sucesso!');
        } catch (err) {
            await error('Erro ao enviar orçamento');
            return;
        }

        setShowModal(false);
        setSelectedRequest(null);
        setQuotePrice('');
        setAdminNotes('');
        loadData();
    };

    const handleStatusChange = async (requestId: string, newStatus: ProductRequest['status']) => {
        try {
            await requestsService.updateStatus(requestId, newStatus);
            loadData();
        } catch (err) {
            await error('Erro ao atualizar status');
        }
    };

    const handleOpenCreateModal = () => {
        setCreateForm({
            customer_name: '',
            customer_phone: '',
            customer_email: '',
            product_description: '',
            preferred_brand: '',
            preferred_size: '',
            quantity: 1,
            max_budget: '',
            urgency: 'normal',
        });
        setShowCreateModal(true);
    };

    const handleCreateRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createForm.customer_name || !createForm.customer_phone || !createForm.product_description) {
            await dialogAlert('Nome, telefone e descrição do produto são obrigatórios');
            return;
        }

        setCreating(true);
        try {
            await requestsService.createRequest({
                customer_name: createForm.customer_name,
                customer_phone: createForm.customer_phone,
                customer_email: createForm.customer_email || undefined,
                product_description: createForm.product_description,
                preferred_brand: createForm.preferred_brand || undefined,
                preferred_size: createForm.preferred_size || undefined,
                quantity: createForm.quantity,
                max_budget: createForm.max_budget ? parseFloat(createForm.max_budget) : undefined,
                urgency: createForm.urgency,
            });
            await success('Solicitação criada com sucesso!');
            setShowCreateModal(false);
            loadData();
        } catch (err) {
            console.error('Error creating request:', err);
            await error('Erro ao criar solicitação');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex justify-end">
                <button
                    onClick={handleOpenCreateModal}
                    className="gold-gradient text-background-dark px-6 py-3 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/10"
                >
                    <span className="material-symbols-outlined text-base">add</span>
                    Nova Solicitação
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                <div className="bg-card-dark border border-white/10 p-4 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Total</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="bg-card-dark border border-white/10 p-4 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Pendentes</p>
                    <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                </div>
                <div className="bg-card-dark border border-white/10 p-4 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Em Análise</p>
                    <p className="text-2xl font-bold text-blue-400">{stats.reviewing}</p>
                </div>
                <div className="bg-card-dark border border-white/10 p-4 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Orçados</p>
                    <p className="text-2xl font-bold text-purple-400">{stats.quoted}</p>
                </div>
                <div className="bg-card-dark border border-white/10 p-4 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Urgentes</p>
                    <p className="text-2xl font-bold text-red-400">{stats.urgent}</p>
                </div>
                <div className="bg-card-dark border border-white/10 p-4 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Alta Prioridade</p>
                    <p className="text-2xl font-bold text-orange-400">{stats.high}</p>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-6">
                {[
                    { id: 'all', label: 'Todas' },
                    { id: 'pending', label: 'Pendentes' },
                    { id: 'reviewing', label: 'Em Análise' },
                    { id: 'quoted', label: 'Orçadas' },
                    { id: 'approved', label: 'Aprovadas' },
                ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id as typeof filter)}
                        className={`px-4 py-2 text-xs font-medium rounded-sm transition-colors ${
                            filter === f.id
                                ? 'bg-primary text-background-dark'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Requests Table */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-12 text-gray-400">Nenhuma solicitação encontrada</div>
            ) : (
                <div className="bg-card-dark border border-white/10 rounded-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Cliente</th>
                                    <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Produto</th>
                                    <th className="text-center p-4 text-xs uppercase tracking-wider text-gray-400">Urgência</th>
                                    <th className="text-center p-4 text-xs uppercase tracking-wider text-gray-400">Status</th>
                                    <th className="text-right p-4 text-xs uppercase tracking-wider text-gray-400">Orçamento</th>
                                    <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Data</th>
                                    <th className="text-center p-4 text-xs uppercase tracking-wider text-gray-400">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {requests.map((request) => (
                                    <tr key={request.id} className="hover:bg-white/5">
                                        <td className="p-4">
                                            <p className="text-white text-sm font-medium">{request.customer_name}</p>
                                            <p className="text-gray-500 text-xs">{request.customer_phone}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-white text-sm line-clamp-2">{request.product_description}</p>
                                            {request.preferred_brand && (
                                                <p className="text-gray-500 text-xs">Marca: {request.preferred_brand}</p>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                                                {getUrgencyLabel(request.urgency)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
                                                {getStatusLabel(request.status)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {request.quoted_price ? (
                                                <span className="text-white font-medium">
                                                    {formatCurrency(request.quoted_price)}
                                                </span>
                                            ) : (
                                                <span className="text-gray-500">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-gray-400">{formatDate(request.created_at!)}</td>
                                        <td className="p-4">
                                            <div className="flex gap-2 justify-center">
                                                {request.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleStatusChange(request.id, 'reviewing')}
                                                        className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded hover:bg-blue-500/30"
                                                    >
                                                        Analisar
                                                    </button>
                                                )}
                                                {request.status === 'reviewing' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRequest(request);
                                                            setShowModal(true);
                                                        }}
                                                        className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded hover:bg-purple-500/30"
                                                    >
                                                        Orçar
                                                    </button>
                                                )}
                                                {request.status === 'quoted' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusChange(request.id, 'approved')}
                                                            className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded hover:bg-green-500/30"
                                                        >
                                                            Aprovar
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(request.id, 'rejected')}
                                                            className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/30"
                                                        >
                                                            Rejeitar
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Quote Modal */}
            {showModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-card-dark border border-white/10 rounded-sm max-w-lg w-full p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Enviar Orçamento</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-gray-400 text-sm mb-2">Produto solicitado:</p>
                                <p className="text-white">{selectedRequest.product_description}</p>
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Preço do Orçamento (R$)</label>
                                <input
                                    type="number"
                                    value={quotePrice}
                                    onChange={(e) => setQuotePrice(e.target.value)}
                                    className="w-full bg-background-dark border border-white/10 rounded-sm px-4 py-2 text-white"
                                    placeholder="0,00"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Observações</label>
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    className="w-full bg-background-dark border border-white/10 rounded-sm px-4 py-2 text-white h-24 resize-none"
                                    placeholder="Informações adicionais para o cliente..."
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setSelectedRequest(null);
                                    setQuotePrice('');
                                    setAdminNotes('');
                                }}
                                className="flex-1 px-4 py-2 border border-white/10 text-white rounded-sm hover:bg-white/5"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleQuote}
                                className="flex-1 px-4 py-2 bg-primary text-background-dark font-bold rounded-sm hover:brightness-110"
                            >
                                Enviar Orçamento
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Request Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-card-dark border border-white/10 rounded-sm max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-white mb-6">Nova Solicitação de Encomenda</h3>
                        <form onSubmit={handleCreateRequest} className="space-y-5">
                            {/* Dados do Cliente */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                        Nome do Cliente *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.customer_name}
                                        onChange={(e) => setCreateForm({ ...createForm, customer_name: e.target.value })}
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
                                        value={createForm.customer_phone}
                                        onChange={(e) => setCreateForm({ ...createForm, customer_phone: e.target.value })}
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
                                    value={createForm.customer_email}
                                    onChange={(e) => setCreateForm({ ...createForm, customer_email: e.target.value })}
                                    className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                    placeholder="cliente@email.com"
                                />
                            </div>

                            {/* Descrição do Produto */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                    Descrição do Produto *
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={createForm.product_description}
                                    onChange={(e) => setCreateForm({ ...createForm, product_description: e.target.value })}
                                    className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors resize-none"
                                    placeholder="Descreva o produto que o cliente está solicitando..."
                                />
                            </div>

                            {/* Detalhes Adicionais */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                        Marca Preferida
                                    </label>
                                    <input
                                        type="text"
                                        value={createForm.preferred_brand}
                                        onChange={(e) => setCreateForm({ ...createForm, preferred_brand: e.target.value })}
                                        className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                        placeholder="Ex: Nike, Adidas..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                        Tamanho
                                    </label>
                                    <input
                                        type="text"
                                        value={createForm.preferred_size}
                                        onChange={(e) => setCreateForm({ ...createForm, preferred_size: e.target.value })}
                                        className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                        placeholder="Ex: M, 42, G..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                        Quantidade
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={createForm.quantity}
                                        onChange={(e) => setCreateForm({ ...createForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                                        className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Orçamento e Urgência */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                        Orçamento Máximo (R$)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={createForm.max_budget}
                                        onChange={(e) => setCreateForm({ ...createForm, max_budget: e.target.value })}
                                        className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                        placeholder="0,00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                        Urgência
                                    </label>
                                    <select
                                        value={createForm.urgency}
                                        onChange={(e) => setCreateForm({ ...createForm, urgency: e.target.value as any })}
                                        className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                    >
                                        <option value="low">Baixa</option>
                                        <option value="normal">Normal</option>
                                        <option value="high">Alta</option>
                                        <option value="urgent">Urgente</option>
                                    </select>
                                </div>
                            </div>

                            {/* Botões */}
                            <div className="flex gap-4 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-6 py-3 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:border-primary transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 gold-gradient text-background-dark px-6 py-3 font-bold uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-50"
                                >
                                    {creating ? 'Criando...' : 'Criar Solicitação'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRequests;

import React, { useState, useEffect } from 'react';
import { financeService } from '../../lib/finance';
import type { FinancialTransaction, AccountReceivable, AccountPayable, FinancialCategory } from '../../types';
import Modal from '../../components/Modal';
import { useDialog } from '../../context/DialogContext';

const AdminFinance: React.FC = () => {
    const { error, success } = useDialog();
    const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'receivable' | 'payable'>('overview');
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [receivables, setReceivables] = useState<AccountReceivable[]>([]);
    const [payables, setPayables] = useState<AccountPayable[]>([]);
    const [categories, setCategories] = useState<FinancialCategory[]>([]);
    const [summary, setSummary] = useState({ income: 0, expense: 0, refund: 0, balance: 0 });
    const [isLoading, setIsLoading] = useState(true);

    // Modais
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [showReceivableModal, setShowReceivableModal] = useState(false);
    const [showPayableModal, setShowPayableModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<AccountReceivable | AccountPayable | null>(null);
    const [paymentType, setPaymentType] = useState<'receive' | 'pay'>('receive');

    // Formulários
    const [transactionForm, setTransactionForm] = useState({
        transaction_type: 'income' as 'income' | 'expense' | 'refund' | 'adjustment',
        category: '',
        amount: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash' as 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer',
        payment_status: 'completed' as 'pending' | 'completed' | 'cancelled',
    });

    const [receivableForm, setReceivableForm] = useState({
        customer_name: '',
        description: '',
        amount: '',
        due_date: '',
        notes: '',
    });

    const [payableForm, setPayableForm] = useState({
        description: '',
        supplier_name: '',
        amount: '',
        due_date: '',
        notes: '',
    });

    const [paymentAmount, setPaymentAmount] = useState('');

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'overview' || activeTab === 'transactions') {
                const [transData, summaryData, catsData] = await Promise.all([
                    financeService.getTransactions(),
                    financeService.getFinancialSummary(),
                    financeService.getFinancialCategories(),
                ]);
                setTransactions(transData);
                setSummary(summaryData);
                setCategories(catsData);
            }
            if (activeTab === 'receivable' || activeTab === 'overview') {
                const data = await financeService.getAccountsReceivable();
                setReceivables(data);
            }
            if (activeTab === 'payable' || activeTab === 'overview') {
                const data = await financeService.getAccountsPayable();
                setPayables(data);
            }
        } catch (error) {
            console.error('Error loading finance data:', error);
        }
        setIsLoading(false);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR');
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'text-yellow-400',
            paid: 'text-green-400',
            partial: 'text-blue-400',
            overdue: 'text-red-400',
            completed: 'text-green-400',
            cancelled: 'text-gray-400',
        };
        return colors[status] || 'text-gray-400';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pending: 'Pendente',
            paid: 'Pago',
            partial: 'Parcial',
            overdue: 'Vencido',
            completed: 'Concluído',
            cancelled: 'Cancelado',
        };
        return labels[status] || status;
    };

    // Criar Transação
    const handleCreateTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await financeService.createTransaction({
                transaction_type: transactionForm.transaction_type,
                category: transactionForm.category,
                amount: parseFloat(transactionForm.amount),
                description: transactionForm.description || undefined,
                transaction_date: transactionForm.transaction_date,
                payment_method: transactionForm.payment_method,
                payment_status: transactionForm.payment_status,
                reference_id: undefined,
                reference_type: undefined,
            });
            await success('Transação criada com sucesso!');
            setShowTransactionModal(false);
            loadData();
            setTransactionForm({
                transaction_type: 'income',
                category: '',
                amount: '',
                description: '',
                transaction_date: new Date().toISOString().split('T')[0],
                payment_method: 'cash',
                payment_status: 'completed',
            });
        } catch (err) {
            console.error('Error creating transaction:', err);
            await error('Erro ao criar transação');
        }
    };

    // Criar Conta a Receber
    const handleCreateReceivable = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await financeService.createAccountReceivable({
                customer_name: receivableForm.customer_name,
                description: receivableForm.description || undefined,
                amount: parseFloat(receivableForm.amount),
                amount_paid: 0,
                due_date: receivableForm.due_date,
                status: 'pending',
                related_order_id: undefined,
                notes: receivableForm.notes || undefined,
            });
            await success('Conta a receber criada com sucesso!');
            setShowReceivableModal(false);
            loadData();
            setReceivableForm({ customer_name: '', description: '', amount: '', due_date: '', notes: '' });
        } catch (err) {
            console.error('Error creating receivable:', err);
            await error('Erro ao criar conta a receber');
        }
    };

    // Criar Conta a Pagar
    const handleCreatePayable = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await financeService.createAccountPayable({
                description: payableForm.description,
                supplier_name: payableForm.supplier_name || undefined,
                amount: parseFloat(payableForm.amount),
                amount_paid: 0,
                due_date: payableForm.due_date,
                status: 'pending',
                notes: payableForm.notes || undefined,
            });
            await success('Conta a pagar criada com sucesso!');
            setShowPayableModal(false);
            loadData();
            setPayableForm({ description: '', supplier_name: '', amount: '', due_date: '', notes: '' });
        } catch (err) {
            console.error('Error creating payable:', err);
            await error('Erro ao criar conta a pagar');
        }
    };

    // Receber Pagamento
    const handleReceivePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAccount) return;
        try {
            await financeService.receivePayment(selectedAccount.id, parseFloat(paymentAmount));
            await success('Pagamento registrado com sucesso!');
            setShowPaymentModal(false);
            loadData();
            setPaymentAmount('');
        } catch (err) {
            console.error('Error receiving payment:', err);
            await error('Erro ao registrar pagamento');
        }
    };

    // Fazer Pagamento
    const handleMakePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAccount) return;
        try {
            await financeService.makePayment(selectedAccount.id, parseFloat(paymentAmount));
            await success('Pagamento registrado com sucesso!');
            setShowPaymentModal(false);
            loadData();
            setPaymentAmount('');
        } catch (err) {
            console.error('Error making payment:', err);
            await error('Erro ao registrar pagamento');
        }
    };

    const openPaymentModal = (account: AccountReceivable | AccountPayable, type: 'receive' | 'pay') => {
        setSelectedAccount(account);
        setPaymentType(type);
        const remaining = account.amount - account.amount_paid;
        setPaymentAmount(remaining.toString());
        setShowPaymentModal(true);
    };

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card-dark border border-white/10 p-6 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Receitas</p>
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(summary.income)}</p>
                </div>
                <div className="bg-card-dark border border-white/10 p-6 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Despesas</p>
                    <p className="text-2xl font-bold text-red-400">{formatCurrency(summary.expense)}</p>
                </div>
                <div className="bg-card-dark border border-white/10 p-6 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Reembolsos</p>
                    <p className="text-2xl font-bold text-yellow-400">{formatCurrency(summary.refund)}</p>
                </div>
                <div className="bg-card-dark border border-white/10 p-6 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Saldo</p>
                    <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(summary.balance)}
                    </p>
                </div>
            </div>

            {/* Pending Accounts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Receivables */}
                <div className="bg-card-dark border border-white/10 rounded-sm">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-white">Contas a Receber</h3>
                        <button
                            onClick={() => setActiveTab('receivable')}
                            className="text-[10px] text-primary hover:underline uppercase tracking-widest"
                        >
                            Ver todas
                        </button>
                    </div>
                    <div className="p-4">
                        {receivables.filter((r) => r.status !== 'paid').length === 0 ? (
                            <p className="text-gray-500 text-center py-4">Nenhuma conta pendente</p>
                        ) : (
                            <div className="space-y-3">
                                {receivables
                                    .filter((r) => r.status !== 'paid')
                                    .slice(0, 5)
                                    .map((item) => (
                                        <div key={item.id} className="flex justify-between items-center p-3 bg-white/5 rounded">
                                            <div>
                                                <p className="text-white text-sm font-medium">{item.customer_name}</p>
                                                <p className="text-gray-500 text-xs">Vencimento: {formatDate(item.due_date)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white font-semibold">{formatCurrency(item.amount - item.amount_paid)}</p>
                                                <span className={`text-xs ${getStatusColor(item.status)}`}>{getStatusLabel(item.status)}</span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Payables */}
                <div className="bg-card-dark border border-white/10 rounded-sm">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-white">Contas a Pagar</h3>
                        <button
                            onClick={() => setActiveTab('payable')}
                            className="text-[10px] text-primary hover:underline uppercase tracking-widest"
                        >
                            Ver todas
                        </button>
                    </div>
                    <div className="p-4">
                        {payables.filter((p) => p.status !== 'paid').length === 0 ? (
                            <p className="text-gray-500 text-center py-4">Nenhuma conta pendente</p>
                        ) : (
                            <div className="space-y-3">
                                {payables
                                    .filter((p) => p.status !== 'paid')
                                    .slice(0, 5)
                                    .map((item) => (
                                        <div key={item.id} className="flex justify-between items-center p-3 bg-white/5 rounded">
                                            <div>
                                                <p className="text-white text-sm font-medium">{item.description}</p>
                                                <p className="text-gray-500 text-xs">Vencimento: {formatDate(item.due_date)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white font-semibold">{formatCurrency(item.amount - item.amount_paid)}</p>
                                                <span className={`text-xs ${getStatusColor(item.status)}`}>{getStatusLabel(item.status)}</span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTransactions = () => (
        <div className="bg-card-dark border border-white/10 rounded-sm">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Transações</h3>
                <button
                    onClick={() => setShowTransactionModal(true)}
                    className="px-4 py-2 bg-primary text-background-dark text-xs font-bold uppercase tracking-wider rounded-sm hover:brightness-110"
                >
                    Nova Transação
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-white/5">
                        <tr>
                            <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Data</th>
                            <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Tipo</th>
                            <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Categoria</th>
                            <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Descrição</th>
                            <th className="text-right p-4 text-xs uppercase tracking-wider text-gray-400">Valor</th>
                            <th className="text-center p-4 text-xs uppercase tracking-wider text-gray-400">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {transactions.map((t) => (
                            <tr key={t.id} className="hover:bg-white/5">
                                <td className="p-4 text-sm text-white">{formatDate(t.transaction_date)}</td>
                                <td className="p-4">
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${
                                            t.transaction_type === 'income'
                                                ? 'bg-green-500/20 text-green-400'
                                                : t.transaction_type === 'expense'
                                                ? 'bg-red-500/20 text-red-400'
                                                : 'bg-yellow-500/20 text-yellow-400'
                                        }`}
                                    >
                                        {t.transaction_type === 'income' && 'Receita'}
                                        {t.transaction_type === 'expense' && 'Despesa'}
                                        {t.transaction_type === 'refund' && 'Reembolso'}
                                        {t.transaction_type === 'adjustment' && 'Ajuste'}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-white">{t.category}</td>
                                <td className="p-4 text-sm text-gray-400">{t.description || '-'}</td>
                                <td className="p-4 text-sm text-white text-right font-medium">{formatCurrency(t.amount)}</td>
                                <td className="p-4 text-center">
                                    <span className={`text-xs ${getStatusColor(t.payment_status)}`}>
                                        {getStatusLabel(t.payment_status)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderReceivables = () => (
        <div className="bg-card-dark border border-white/10 rounded-sm">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Contas a Receber</h3>
                <button
                    onClick={() => setShowReceivableModal(true)}
                    className="px-4 py-2 bg-primary text-background-dark text-xs font-bold uppercase tracking-wider rounded-sm hover:brightness-110"
                >
                    Nova Conta
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-white/5">
                        <tr>
                            <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Cliente</th>
                            <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Descrição</th>
                            <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Vencimento</th>
                            <th className="text-right p-4 text-xs uppercase tracking-wider text-gray-400">Valor</th>
                            <th className="text-right p-4 text-xs uppercase tracking-wider text-gray-400">Recebido</th>
                            <th className="text-center p-4 text-xs uppercase tracking-wider text-gray-400">Status</th>
                            <th className="text-center p-4 text-xs uppercase tracking-wider text-gray-400">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {receivables.map((item) => (
                            <tr key={item.id} className="hover:bg-white/5">
                                <td className="p-4 text-sm text-white font-medium">{item.customer_name}</td>
                                <td className="p-4 text-sm text-gray-400">{item.description || '-'}</td>
                                <td className="p-4 text-sm text-white">{formatDate(item.due_date)}</td>
                                <td className="p-4 text-sm text-white text-right">{formatCurrency(item.amount)}</td>
                                <td className="p-4 text-sm text-green-400 text-right">{formatCurrency(item.amount_paid)}</td>
                                <td className="p-4 text-center">
                                    <span className={`text-xs ${getStatusColor(item.status)}`}>
                                        {getStatusLabel(item.status)}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    {item.status !== 'paid' && (
                                        <button
                                            onClick={() => openPaymentModal(item, 'receive')}
                                            className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider rounded hover:bg-green-500/30 transition-colors"
                                        >
                                            Receber
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderPayables = () => (
        <div className="bg-card-dark border border-white/10 rounded-sm">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Contas a Pagar</h3>
                <button
                    onClick={() => setShowPayableModal(true)}
                    className="px-4 py-2 bg-primary text-background-dark text-xs font-bold uppercase tracking-wider rounded-sm hover:brightness-110"
                >
                    Nova Conta
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-white/5">
                        <tr>
                            <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Descrição</th>
                            <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Fornecedor</th>
                            <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-400">Vencimento</th>
                            <th className="text-right p-4 text-xs uppercase tracking-wider text-gray-400">Valor</th>
                            <th className="text-right p-4 text-xs uppercase tracking-wider text-gray-400">Pago</th>
                            <th className="text-center p-4 text-xs uppercase tracking-wider text-gray-400">Status</th>
                            <th className="text-center p-4 text-xs uppercase tracking-wider text-gray-400">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {payables.map((item) => (
                            <tr key={item.id} className="hover:bg-white/5">
                                <td className="p-4 text-sm text-white font-medium">{item.description}</td>
                                <td className="p-4 text-sm text-gray-400">{item.supplier_name || '-'}</td>
                                <td className="p-4 text-sm text-white">{formatDate(item.due_date)}</td>
                                <td className="p-4 text-sm text-white text-right">{formatCurrency(item.amount)}</td>
                                <td className="p-4 text-sm text-green-400 text-right">{formatCurrency(item.amount_paid)}</td>
                                <td className="p-4 text-center">
                                    <span className={`text-xs ${getStatusColor(item.status)}`}>
                                        {getStatusLabel(item.status)}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    {item.status !== 'paid' && (
                                        <button
                                            onClick={() => openPaymentModal(item, 'pay')}
                                            className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider rounded hover:bg-red-500/30 transition-colors"
                                        >
                                            Pagar
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">Módulo Financeiro</h1>
                <p className="text-gray-400">Controle de receitas, despesas e fluxo de caixa</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-white/10">
                {[
                    { id: 'overview', label: 'Visão Geral' },
                    { id: 'transactions', label: 'Transações' },
                    { id: 'receivable', label: 'Contas a Receber' },
                    { id: 'payable', label: 'Contas a Pagar' },
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
                    {activeTab === 'transactions' && renderTransactions()}
                    {activeTab === 'receivable' && renderReceivables()}
                    {activeTab === 'payable' && renderPayables()}
                </>
            )}

            {/* Modal Nova Transação */}
            <Modal
                isOpen={showTransactionModal}
                onClose={() => setShowTransactionModal(false)}
                title="Nova Transação"
                size="md"
            >
                <form onSubmit={handleCreateTransaction} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Tipo</label>
                            <select
                                value={transactionForm.transaction_type}
                                onChange={(e) => setTransactionForm({ ...transactionForm, transaction_type: e.target.value as any })}
                                className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            >
                                <option value="income">Receita</option>
                                <option value="expense">Despesa</option>
                                <option value="refund">Reembolso</option>
                                <option value="adjustment">Ajuste</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Valor *</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={transactionForm.amount}
                                onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                                className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                placeholder="0,00"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Categoria *</label>
                        <input
                            type="text"
                            required
                            value={transactionForm.category}
                            onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}
                            className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            placeholder="Ex: Vendas, Aluguel, Fornecedores..."
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Descrição</label>
                        <input
                            type="text"
                            value={transactionForm.description}
                            onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                            className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            placeholder="Detalhes da transação..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Data</label>
                            <input
                                type="date"
                                value={transactionForm.transaction_date}
                                onChange={(e) => setTransactionForm({ ...transactionForm, transaction_date: e.target.value })}
                                className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Forma de Pagamento</label>
                            <select
                                value={transactionForm.payment_method}
                                onChange={(e) => setTransactionForm({ ...transactionForm, payment_method: e.target.value as any })}
                                className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            >
                                <option value="cash">Dinheiro</option>
                                <option value="credit_card">Cartão de Crédito</option>
                                <option value="debit_card">Cartão de Débito</option>
                                <option value="pix">PIX</option>
                                <option value="bank_transfer">Transferência</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Status</label>
                        <select
                            value={transactionForm.payment_status}
                            onChange={(e) => setTransactionForm({ ...transactionForm, payment_status: e.target.value as any })}
                            className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                        >
                            <option value="completed">Concluído</option>
                            <option value="pending">Pendente</option>
                            <option value="cancelled">Cancelado</option>
                        </select>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowTransactionModal(false)}
                            className="flex-1 px-6 py-3 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:border-primary transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 gold-gradient text-background-dark px-6 py-3 font-bold uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                        >
                            Salvar
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Nova Conta a Receber */}
            <Modal
                isOpen={showReceivableModal}
                onClose={() => setShowReceivableModal(false)}
                title="Nova Conta a Receber"
                size="md"
            >
                <form onSubmit={handleCreateReceivable} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Cliente *</label>
                        <input
                            type="text"
                            required
                            value={receivableForm.customer_name}
                            onChange={(e) => setReceivableForm({ ...receivableForm, customer_name: e.target.value })}
                            className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            placeholder="Nome do cliente"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Descrição</label>
                        <input
                            type="text"
                            value={receivableForm.description}
                            onChange={(e) => setReceivableForm({ ...receivableForm, description: e.target.value })}
                            className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            placeholder="Descrição da conta..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Valor *</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={receivableForm.amount}
                                onChange={(e) => setReceivableForm({ ...receivableForm, amount: e.target.value })}
                                className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                placeholder="0,00"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Vencimento *</label>
                            <input
                                type="date"
                                required
                                value={receivableForm.due_date}
                                onChange={(e) => setReceivableForm({ ...receivableForm, due_date: e.target.value })}
                                className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Observações</label>
                        <textarea
                            rows={3}
                            value={receivableForm.notes}
                            onChange={(e) => setReceivableForm({ ...receivableForm, notes: e.target.value })}
                            className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors resize-none"
                            placeholder="Observações internas..."
                        />
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowReceivableModal(false)}
                            className="flex-1 px-6 py-3 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:border-primary transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 gold-gradient text-background-dark px-6 py-3 font-bold uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                        >
                            Salvar
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Nova Conta a Pagar */}
            <Modal
                isOpen={showPayableModal}
                onClose={() => setShowPayableModal(false)}
                title="Nova Conta a Pagar"
                size="md"
            >
                <form onSubmit={handleCreatePayable} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Descrição *</label>
                        <input
                            type="text"
                            required
                            value={payableForm.description}
                            onChange={(e) => setPayableForm({ ...payableForm, description: e.target.value })}
                            className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            placeholder="Descrição da despesa"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Fornecedor</label>
                        <input
                            type="text"
                            value={payableForm.supplier_name}
                            onChange={(e) => setPayableForm({ ...payableForm, supplier_name: e.target.value })}
                            className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            placeholder="Nome do fornecedor"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Valor *</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={payableForm.amount}
                                onChange={(e) => setPayableForm({ ...payableForm, amount: e.target.value })}
                                className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                placeholder="0,00"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Vencimento *</label>
                            <input
                                type="date"
                                required
                                value={payableForm.due_date}
                                onChange={(e) => setPayableForm({ ...payableForm, due_date: e.target.value })}
                                className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Observações</label>
                        <textarea
                            rows={3}
                            value={payableForm.notes}
                            onChange={(e) => setPayableForm({ ...payableForm, notes: e.target.value })}
                            className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors resize-none"
                            placeholder="Observações internas..."
                        />
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowPayableModal(false)}
                            className="flex-1 px-6 py-3 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:border-primary transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 gold-gradient text-background-dark px-6 py-3 font-bold uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                        >
                            Salvar
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Receber/Pagar */}
            <Modal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                title={paymentType === 'receive' ? 'Registrar Recebimento' : 'Registrar Pagamento'}
                size="sm"
            >
                <form onSubmit={paymentType === 'receive' ? handleReceivePayment : handleMakePayment} className="space-y-4">
                    {selectedAccount && (
                        <div className="bg-white/5 p-4 rounded">
                            <p className="text-sm text-gray-400">
                                {paymentType === 'receive' ? 'Cliente:' : 'Descrição:'}
                            </p>
                            <p className="text-white font-medium">
                                {paymentType === 'receive' 
                                    ? (selectedAccount as AccountReceivable).customer_name 
                                    : (selectedAccount as AccountPayable).description}
                            </p>
                            <p className="text-sm text-gray-400 mt-2">Valor restante:</p>
                            <p className="text-xl font-bold text-primary">
                                {formatCurrency(selectedAccount.amount - selectedAccount.amount_paid)}
                            </p>
                        </div>
                    )}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                            Valor a {paymentType === 'receive' ? 'Receber' : 'Pagar'}
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            placeholder="0,00"
                        />
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowPaymentModal(false)}
                            className="flex-1 px-6 py-3 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:border-primary transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={`flex-1 px-6 py-3 font-bold uppercase tracking-widest text-[10px] transition-all ${
                                paymentType === 'receive'
                                    ? 'bg-green-500 text-white hover:bg-green-600'
                                    : 'bg-red-500 text-white hover:bg-red-600'
                            }`}
                        >
                            {paymentType === 'receive' ? 'Confirmar Recebimento' : 'Confirmar Pagamento'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AdminFinance;

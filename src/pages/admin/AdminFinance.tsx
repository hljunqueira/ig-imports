import React, { useState, useEffect } from 'react';
import { financeService } from '../../lib/finance';
import type { FinancialTransaction, AccountReceivable, AccountPayable } from '../../types';

const AdminFinance: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'receivable' | 'payable'>('overview');
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [receivables, setReceivables] = useState<AccountReceivable[]>([]);
    const [payables, setPayables] = useState<AccountPayable[]>([]);
    const [summary, setSummary] = useState({ income: 0, expense: 0, refund: 0, balance: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'transaction' | 'receivable' | 'payable'>('transaction');

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'overview' || activeTab === 'transactions') {
                const [transRes, summaryRes] = await Promise.all([
                    financeService.getTransactions(),
                    financeService.getFinancialSummary(),
                ]);
                if (transRes.data) setTransactions(transRes.data);
                if (summaryRes.data) setSummary(summaryRes.data);
            }
            if (activeTab === 'receivable' || activeTab === 'overview') {
                const res = await financeService.getAccountsReceivable();
                if (res.data) setReceivables(res.data);
            }
            if (activeTab === 'payable' || activeTab === 'overview') {
                const res = await financeService.getAccountsPayable();
                if (res.data) setPayables(res.data);
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
                    <div className="p-4 border-b border-white/10">
                        <h3 className="text-lg font-semibold text-white">Contas a Receber</h3>
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
                    <div className="p-4 border-b border-white/10">
                        <h3 className="text-lg font-semibold text-white">Contas a Pagar</h3>
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
                    onClick={() => {
                        setModalType('transaction');
                        setShowModal(true);
                    }}
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
                    {activeTab === 'receivable' && (
                        <div className="text-center py-12 text-gray-400">Módulo em desenvolvimento</div>
                    )}
                    {activeTab === 'payable' && (
                        <div className="text-center py-12 text-gray-400">Módulo em desenvolvimento</div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminFinance;

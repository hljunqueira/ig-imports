import { apiClient } from './api';
import type {
    FinancialTransaction,
    AccountReceivable,
    AccountPayable,
    FinancialCategory,
} from '../types';

// ========================================
// SERVIÇO FINANCEIRO
// ========================================

export const financeService = {
    // Transações
    async getTransactions(filters?: { type?: string; startDate?: string; endDate?: string }): Promise<FinancialTransaction[]> {
        const params = new URLSearchParams();
        if (filters?.type) params.append('type', filters.type);
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);
        
        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await apiClient.get<{ success: boolean; data: FinancialTransaction[] }>(`/finance/transactions${query}`);
        return response.success ? response.data : [];
    },

    async createTransaction(transaction: Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<FinancialTransaction> {
        const response = await apiClient.post<{ success: boolean; data: FinancialTransaction }>('/finance/transactions', transaction);
        if (!response.success) throw new Error('Failed to create transaction');
        return response.data;
    },

    async getFinancialSummary(startDate?: string, endDate?: string) {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        
        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await apiClient.get<{ success: boolean; data: { income: number; expense: number; refund: number; balance: number } }>(`/finance/summary${query}`);
        return response.success ? response.data : { income: 0, expense: 0, refund: 0, balance: 0 };
    },

    // Contas a Receber
    async getAccountsReceivable(status?: string): Promise<AccountReceivable[]> {
        const params = status ? `?status=${status}` : '';
        const response = await apiClient.get<{ success: boolean; data: AccountReceivable[] }>(`/finance/receivable${params}`);
        return response.success ? response.data : [];
    },

    async createAccountReceivable(account: Omit<AccountReceivable, 'id' | 'created_at' | 'updated_at'>): Promise<AccountReceivable> {
        const response = await apiClient.post<{ success: boolean; data: AccountReceivable }>('/finance/receivable', account);
        if (!response.success) throw new Error('Failed to create account receivable');
        return response.data;
    },

    async receivePayment(id: string, amount: number): Promise<AccountReceivable> {
        const response = await apiClient.post<{ success: boolean; data: AccountReceivable }>(`/finance/receivable/${id}/payment`, { amount });
        if (!response.success) throw new Error('Failed to receive payment');
        return response.data;
    },

    // Contas a Pagar
    async getAccountsPayable(status?: string): Promise<AccountPayable[]> {
        const params = status ? `?status=${status}` : '';
        const response = await apiClient.get<{ success: boolean; data: AccountPayable[] }>(`/finance/payable${params}`);
        return response.success ? response.data : [];
    },

    async createAccountPayable(account: Omit<AccountPayable, 'id' | 'created_at' | 'updated_at'>): Promise<AccountPayable> {
        const response = await apiClient.post<{ success: boolean; data: AccountPayable }>('/finance/payable', account);
        if (!response.success) throw new Error('Failed to create account payable');
        return response.data;
    },

    async makePayment(id: string, amount: number): Promise<AccountPayable> {
        const response = await apiClient.post<{ success: boolean; data: AccountPayable }>(`/finance/payable/${id}/payment`, { amount });
        if (!response.success) throw new Error('Failed to make payment');
        return response.data;
    },

    // Categorias
    async getFinancialCategories(type?: 'income' | 'expense'): Promise<FinancialCategory[]> {
        const params = type ? `?type=${type}` : '';
        const response = await apiClient.get<{ success: boolean; data: FinancialCategory[] }>(`/finance/categories${params}`);
        return response.success ? response.data : [];
    },

    async createCategory(category: Omit<FinancialCategory, 'id' | 'created_at'>): Promise<FinancialCategory> {
        const response = await apiClient.post<{ success: boolean; data: FinancialCategory }>('/finance/categories', category);
        if (!response.success) throw new Error('Failed to create category');
        return response.data;
    },
};

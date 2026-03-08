import { supabase } from './supabase';
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
    async getTransactions(filters?: { type?: string; startDate?: string; endDate?: string }) {
        let query = supabase
            .from('financial_transactions')
            .select('*')
            .order('transaction_date', { ascending: false });

        if (filters?.type) {
            query = query.eq('transaction_type', filters.type);
        }
        if (filters?.startDate) {
            query = query.gte('transaction_date', filters.startDate);
        }
        if (filters?.endDate) {
            query = query.lte('transaction_date', filters.endDate);
        }

        const { data, error } = await query;
        return { data: data as FinancialTransaction[] | null, error };
    },

    async createTransaction(transaction: Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at'>) {
        const { data, error } = await supabase
            .from('financial_transactions')
            .insert(transaction)
            .select()
            .single();
        return { data: data as FinancialTransaction | null, error };
    },

    async getFinancialSummary(startDate?: string, endDate?: string) {
        let query = supabase.from('financial_transactions').select('transaction_type, amount');

        if (startDate) query = query.gte('transaction_date', startDate);
        if (endDate) query = query.lte('transaction_date', endDate);

        const { data, error } = await query;

        if (error) return { data: null, error };

        const summary = {
            income: 0,
            expense: 0,
            refund: 0,
            balance: 0,
        };

        data?.forEach((t) => {
            if (t.transaction_type === 'income') summary.income += Number(t.amount);
            if (t.transaction_type === 'expense') summary.expense += Number(t.amount);
            if (t.transaction_type === 'refund') summary.refund += Number(t.amount);
        });

        summary.balance = summary.income - summary.expense - summary.refund;

        return { data: summary, error: null };
    },

    // Contas a Receber
    async getAccountsReceivable(status?: string) {
        let query = supabase
            .from('accounts_receivable')
            .select('*')
            .order('due_date', { ascending: true });

        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        return { data: data as AccountReceivable[] | null, error };
    },

    async createAccountReceivable(account: Omit<AccountReceivable, 'id' | 'created_at' | 'updated_at'>) {
        const { data, error } = await supabase
            .from('accounts_receivable')
            .insert(account)
            .select()
            .single();
        return { data: data as AccountReceivable | null, error };
    },

    async receivePayment(id: string, amount: number) {
        const { data: account } = await supabase
            .from('accounts_receivable')
            .select('*')
            .eq('id', id)
            .single();

        if (!account) return { data: null, error: { message: 'Account not found' } };

        const newAmountPaid = Number(account.amount_paid) + amount;
        const newStatus = newAmountPaid >= Number(account.amount) ? 'paid' : 'partial';

        const { data, error } = await supabase
            .from('accounts_receivable')
            .update({ amount_paid: newAmountPaid, status: newStatus })
            .eq('id', id)
            .select()
            .single();

        return { data: data as AccountReceivable | null, error };
    },

    // Contas a Pagar
    async getAccountsPayable(status?: string) {
        let query = supabase
            .from('accounts_payable')
            .select('*')
            .order('due_date', { ascending: true });

        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        return { data: data as AccountPayable[] | null, error };
    },

    async createAccountPayable(account: Omit<AccountPayable, 'id' | 'created_at' | 'updated_at'>) {
        const { data, error } = await supabase
            .from('accounts_payable')
            .insert(account)
            .select()
            .single();
        return { data: data as AccountPayable | null, error };
    },

    async makePayment(id: string, amount: number) {
        const { data: account } = await supabase
            .from('accounts_payable')
            .select('*')
            .eq('id', id)
            .single();

        if (!account) return { data: null, error: { message: 'Account not found' } };

        const newAmountPaid = Number(account.amount_paid) + amount;
        const newStatus = newAmountPaid >= Number(account.amount) ? 'paid' : 'partial';

        const { data, error } = await supabase
            .from('accounts_payable')
            .update({ amount_paid: newAmountPaid, status: newStatus })
            .eq('id', id)
            .select()
            .single();

        return { data: data as AccountPayable | null, error };
    },

    // Categorias
    async getFinancialCategories(type?: 'income' | 'expense') {
        let query = supabase
            .from('financial_categories')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (type) query = query.eq('type', type);

        const { data, error } = await query;
        return { data: data as FinancialCategory[] | null, error };
    },

    async createCategory(category: Omit<FinancialCategory, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('financial_categories')
            .insert(category)
            .select()
            .single();
        return { data: data as FinancialCategory | null, error };
    },
};

import { supabase } from './supabase';
import type { ProductRequest, RequestStatusHistory } from '../types';

// ========================================
// SERVIÇO DE ENCOMENDAS/SOLICITAÇÕES
// ========================================

export const requestsService = {
    // Solicitações
    async getRequests(filters?: { status?: string; urgency?: string; handledBy?: string }) {
        let query = supabase
            .from('product_requests')
            .select('*, handler:admin_profiles(full_name)')
            .order('created_at', { ascending: false });

        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.urgency) query = query.eq('urgency', filters.urgency);
        if (filters?.handledBy) query = query.eq('handled_by', filters.handledBy);

        const { data, error } = await query;
        return { data: data as ProductRequest[] | null, error };
    },

    async getPendingRequests() {
        const { data, error } = await supabase
            .from('product_requests')
            .select('*')
            .in('status', ['pending', 'reviewing'])
            .order('urgency', { ascending: false })
            .order('created_at', { ascending: true });

        return { data: data as ProductRequest[] | null, error };
    },

    async getRequestById(id: string) {
        const { data, error } = await supabase
            .from('product_requests')
            .select('*, history:request_status_history(*, changed_by:admin_profiles(full_name))')
            .eq('id', id)
            .single();

        return { data: data as ProductRequest | null, error };
    },

    async createRequest(request: Omit<ProductRequest, 'id' | 'created_at' | 'updated_at' | 'status' | 'quoted_at'>) {
        const { data, error } = await supabase
            .from('product_requests')
            .insert({
                ...request,
                status: 'pending',
            })
            .select()
            .single();
        return { data: data as ProductRequest | null, error };
    },

    async updateRequest(id: string, updates: Partial<ProductRequest>) {
        const { data, error } = await supabase
            .from('product_requests')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return { data: data as ProductRequest | null, error };
    },

    async updateStatus(
        id: string,
        newStatus: ProductRequest['status'],
        changedBy: string,
        notes?: string
    ) {
        // Get current status
        const { data: current } = await supabase
            .from('product_requests')
            .select('status')
            .eq('id', id)
            .single();

        if (!current) return { data: null, error: { message: 'Request not found' } };

        // Update request status
        const updates: Partial<ProductRequest> = { status: newStatus };

        if (newStatus === 'quoted') {
            updates.quoted_at = new Date().toISOString();
        }

        const { data: request, error: updateError } = await supabase
            .from('product_requests')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (updateError) return { data: null, error: updateError };

        // Add status history
        await supabase.from('request_status_history').insert({
            request_id: id,
            old_status: current.status,
            new_status: newStatus,
            changed_by: changedBy,
            notes,
        });

        return { data: request as ProductRequest, error: null };
    },

    async assignRequest(id: string, adminId: string) {
        const { data, error } = await supabase
            .from('product_requests')
            .update({
                handled_by: adminId,
                status: 'reviewing',
            })
            .eq('id', id)
            .select()
            .single();
        return { data: data as ProductRequest | null, error };
    },

    async quoteRequest(id: string, price: number, adminId: string, notes?: string) {
        return this.updateStatus(id, 'quoted', adminId, `Orçamento: R$ ${price.toFixed(2)}${notes ? ` - ${notes}` : ''}`);
    },

    async deleteRequest(id: string) {
        const { error } = await supabase.from('product_requests').delete().eq('id', id);
        return { error };
    },

    // Estatísticas
    async getRequestStats() {
        const { data, error } = await supabase
            .from('product_requests')
            .select('status, urgency');

        if (error) return { data: null, error };

        const stats = {
            total: 0,
            pending: 0,
            reviewing: 0,
            quoted: 0,
            approved: 0,
            ordered: 0,
            available: 0,
            urgent: 0,
            high: 0,
        };

        data?.forEach((r) => {
            stats.total++;
            stats[r.status as keyof typeof stats]++;
            if (r.urgency === 'urgent') stats.urgent++;
            if (r.urgency === 'high') stats.high++;
        });

        return { data: stats, error: null };
    },
};

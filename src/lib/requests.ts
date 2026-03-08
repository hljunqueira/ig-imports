import { apiClient } from './api';
import type { ProductRequest, RequestStatusHistory } from '../types';

// ========================================
// SERVIÇO DE ENCOMENDAS/SOLICITAÇÕES
// ========================================

export const requestsService = {
    // Solicitações
    async getRequests(filters?: { status?: string; urgency?: string; handledBy?: string }): Promise<ProductRequest[]> {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.urgency) params.append('urgency', filters.urgency);
        if (filters?.handledBy) params.append('handledBy', filters.handledBy);
        
        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await apiClient.get<{ success: boolean; data: ProductRequest[] }>(`/requests${query}`);
        return response.success ? response.data : [];
    },

    async getPendingRequests(): Promise<ProductRequest[]> {
        const response = await apiClient.get<{ success: boolean; data: ProductRequest[] }>('/requests/pending');
        return response.success ? response.data : [];
    },

    async getRequestById(id: string): Promise<ProductRequest | null> {
        try {
            const response = await apiClient.get<{ success: boolean; data: ProductRequest }>(`/requests/${id}`);
            return response.success ? response.data : null;
        } catch {
            return null;
        }
    },

    async createRequest(request: Omit<ProductRequest, 'id' | 'created_at' | 'updated_at' | 'status' | 'quoted_at'>): Promise<ProductRequest> {
        const response = await apiClient.post<{ success: boolean; data: ProductRequest }>('/requests', request);
        if (!response.success) throw new Error('Failed to create request');
        return response.data;
    },

    async updateRequest(id: string, updates: Partial<ProductRequest>): Promise<ProductRequest> {
        const response = await apiClient.put<{ success: boolean; data: ProductRequest }>(`/requests/${id}`, updates);
        if (!response.success) throw new Error('Failed to update request');
        return response.data;
    },

    async updateStatus(
        id: string,
        newStatus: ProductRequest['status'],
        changedBy: string,
        notes?: string
    ): Promise<ProductRequest> {
        const response = await apiClient.patch<{ success: boolean; data: ProductRequest }>(`/requests/${id}/status`, {
            newStatus,
            changedBy,
            notes
        });
        if (!response.success) throw new Error('Failed to update status');
        return response.data;
    },

    async assignRequest(id: string, adminId: string): Promise<ProductRequest> {
        const response = await apiClient.patch<{ success: boolean; data: ProductRequest }>(`/requests/${id}/assign`, { adminId });
        if (!response.success) throw new Error('Failed to assign request');
        return response.data;
    },

    async quoteRequest(id: string, price: number, adminId: string, notes?: string): Promise<ProductRequest> {
        return this.updateStatus(id, 'quoted', adminId, `Orçamento: R$ ${price.toFixed(2)}${notes ? ` - ${notes}` : ''}`);
    },

    async deleteRequest(id: string): Promise<void> {
        await apiClient.delete(`/requests/${id}`);
    },

    // Estatísticas
    async getRequestStats() {
        const response = await apiClient.get<{ success: boolean; data: { total: number; pending: number; reviewing: number; quoted: number; approved: number; ordered: number; available: number; urgent: number; high: number } }>('/requests/stats');
        return response.success ? response.data : { total: 0, pending: 0, reviewing: 0, quoted: 0, approved: 0, ordered: 0, available: 0, urgent: 0, high: 0 };
    },
};

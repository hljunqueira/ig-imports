import { apiClient } from './api';
import type { ProductReview, ReviewReply } from '../types';

// ========================================
// SERVIÇO DE AVALIAÇÕES/FEEDBACKS
// ========================================

export const reviewsService = {
    // Reviews
    async getReviews(filters?: { productId?: string; approved?: boolean; featured?: boolean }): Promise<ProductReview[]> {
        const params = new URLSearchParams();
        if (filters?.productId) params.append('productId', filters.productId);
        if (filters?.approved !== undefined) params.append('approved', String(filters.approved));
        if (filters?.featured) params.append('featured', 'true');
        
        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await apiClient.get<{ success: boolean; data: ProductReview[] }>(`/reviews${query}`);
        return response.success ? response.data : [];
    },

    async getPendingReviews(): Promise<ProductReview[]> {
        const response = await apiClient.get<{ success: boolean; data: ProductReview[] }>('/reviews/pending');
        return response.success ? response.data : [];
    },

    async createReview(review: Omit<ProductReview, 'id' | 'created_at' | 'updated_at' | 'is_approved' | 'is_featured' | 'helpful_count'>): Promise<ProductReview> {
        const response = await apiClient.post<{ success: boolean; data: ProductReview }>('/reviews', review);
        if (!response.success) throw new Error('Failed to create review');
        return response.data;
    },

    async approveReview(id: string): Promise<ProductReview> {
        const response = await apiClient.patch<{ success: boolean; data: ProductReview }>(`/reviews/${id}/approve`, {});
        if (!response.success) throw new Error('Failed to approve review');
        return response.data;
    },

    async rejectReview(id: string): Promise<void> {
        await apiClient.delete(`/reviews/${id}`);
    },

    async featureReview(id: string, featured: boolean): Promise<ProductReview> {
        const response = await apiClient.patch<{ success: boolean; data: ProductReview }>(`/reviews/${id}/feature`, { featured });
        if (!response.success) throw new Error('Failed to feature review');
        return response.data;
    },

    async incrementHelpful(id: string): Promise<void> {
        await apiClient.patch(`/reviews/${id}/helpful`, {});
    },

    // Replies
    async addReply(reply: Omit<ReviewReply, 'id' | 'created_at'>): Promise<ReviewReply> {
        const response = await apiClient.post<{ success: boolean; data: ReviewReply }>('/reviews/replies', reply);
        if (!response.success) throw new Error('Failed to add reply');
        return response.data;
    },

    async deleteReply(id: string): Promise<void> {
        await apiClient.delete(`/reviews/replies/${id}`);
    },

    // Estatísticas
    async getProductReviewStats(productId: string) {
        const response = await apiClient.get<{ success: boolean; data: { total: number; average: number; distribution: Record<string, number> } }>(`/reviews/stats/${productId}`);
        return response.success ? response.data : { total: 0, average: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    },
};

import { supabase } from './supabase';
import type { ProductReview, ReviewReply } from '../types';

// ========================================
// SERVIÇO DE AVALIAÇÕES/FEEDBACKS
// ========================================

export const reviewsService = {
    // Reviews
    async getReviews(filters?: { productId?: string; approved?: boolean; featured?: boolean }) {
        let query = supabase
            .from('product_reviews')
            .select('*, replies:review_replies(*)')
            .order('created_at', { ascending: false });

        if (filters?.productId) query = query.eq('product_id', filters.productId);
        if (filters?.approved !== undefined) query = query.eq('is_approved', filters.approved);
        if (filters?.featured) query = query.eq('is_featured', true);

        const { data, error } = await query;
        return { data: data as ProductReview[] | null, error };
    },

    async getPendingReviews() {
        const { data, error } = await supabase
            .from('product_reviews')
            .select('*, product:products(name, image_url)')
            .eq('is_approved', false)
            .order('created_at', { ascending: false });

        return { data: data as (ProductReview & { product: { name: string; image_url: string } })[] | null, error };
    },

    async createReview(review: Omit<ProductReview, 'id' | 'created_at' | 'updated_at' | 'is_approved' | 'is_featured' | 'helpful_count'>) {
        const { data, error } = await supabase
            .from('product_reviews')
            .insert({
                ...review,
                is_approved: false,
                is_featured: false,
                helpful_count: 0,
            })
            .select()
            .single();
        return { data: data as ProductReview | null, error };
    },

    async approveReview(id: string) {
        const { data, error } = await supabase
            .from('product_reviews')
            .update({ is_approved: true })
            .eq('id', id)
            .select()
            .single();
        return { data: data as ProductReview | null, error };
    },

    async rejectReview(id: string) {
        const { error } = await supabase.from('product_reviews').delete().eq('id', id);
        return { error };
    },

    async featureReview(id: string, featured: boolean) {
        const { data, error } = await supabase
            .from('product_reviews')
            .update({ is_featured: featured })
            .eq('id', id)
            .select()
            .single();
        return { data: data as ProductReview | null, error };
    },

    async incrementHelpful(id: string) {
        const { data: review } = await supabase
            .from('product_reviews')
            .select('helpful_count')
            .eq('id', id)
            .single();

        if (!review) return { data: null, error: { message: 'Review not found' } };

        const { data, error } = await supabase
            .from('product_reviews')
            .update({ helpful_count: (review.helpful_count || 0) + 1 })
            .eq('id', id)
            .select()
            .single();

        return { data: data as ProductReview | null, error };
    },

    // Replies
    async addReply(reply: Omit<ReviewReply, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('review_replies')
            .insert(reply)
            .select()
            .single();
        return { data: data as ReviewReply | null, error };
    },

    async deleteReply(id: string) {
        const { error } = await supabase.from('review_replies').delete().eq('id', id);
        return { error };
    },

    // Estatísticas
    async getProductReviewStats(productId: string) {
        const { data, error } = await supabase
            .from('product_reviews')
            .select('rating')
            .eq('product_id', productId)
            .eq('is_approved', true);

        if (error) return { data: null, error };

        const reviews = data || [];
        const total = reviews.length;
        const average = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;

        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach((r) => {
            distribution[r.rating as 1 | 2 | 3 | 4 | 5]++;
        });

        return {
            data: {
                total,
                average: Number(average.toFixed(1)),
                distribution,
            },
            error: null,
        };
    },
};

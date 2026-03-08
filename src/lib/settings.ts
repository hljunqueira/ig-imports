import { apiClient } from './api';

// ========================================
// TYPES
// ========================================

export interface StoreSettings {
    id: number;
    store_name: string;
    store_email?: string;
    store_phone?: string;
    store_whatsapp?: string;
    store_address?: string;
    store_city?: string;
    store_state?: string;
    store_zip?: string;
    instagram_url?: string;
    facebook_url?: string;
    meta_title?: string;
    meta_description?: string;
    primary_color?: string;
    logo_url?: string;
    currency?: string;
    delivery_fee?: number;
    free_delivery_min?: number;
    enable_delivery?: boolean;
    enable_pickup?: boolean;
    require_login?: boolean;
}

export interface Coupon {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_order_value?: number;
    max_uses?: number;
    current_uses: number;
    valid_from?: string;
    valid_until?: string;
    is_active: boolean;
}

export interface CouponInput {
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_order_value?: number;
    max_uses?: number;
    valid_from?: string;
    valid_until?: string;
    is_active?: boolean;
}

// ========================================
// STORE SETTINGS SERVICE
// ========================================

export const settingsService = {
    async get(): Promise<StoreSettings | null> {
        try {
            const response = await apiClient.get<{ success: boolean; data: StoreSettings }>('/settings');
            return response.success ? response.data : null;
        } catch (error) {
            console.error('Error fetching settings:', error);
            return null;
        }
    },

    async update(settings: Partial<StoreSettings>): Promise<StoreSettings> {
        const response = await apiClient.put<{ success: boolean; data: StoreSettings }>('/settings', settings);
        if (!response.success) throw new Error('Failed to update settings');
        return response.data;
    },
};

// ========================================
// COUPON SERVICE
// ========================================

export const couponService = {
    async getAll(): Promise<Coupon[]> {
        const response = await apiClient.get<{ success: boolean; data: Coupon[] }>('/coupons');
        return response.success ? response.data : [];
    },

    async getByCode(code: string): Promise<Coupon | null> {
        try {
            const response = await apiClient.get<{ success: boolean; data: Coupon }>(`/coupons/code/${code}`);
            return response.success ? response.data : null;
        } catch {
            return null;
        }
    },

    async create(coupon: CouponInput): Promise<Coupon> {
        const response = await apiClient.post<{ success: boolean; data: Coupon }>('/coupons', {
            ...coupon,
            code: coupon.code.toUpperCase()
        });
        if (!response.success) throw new Error('Failed to create coupon');
        return response.data;
    },

    async update(id: string, coupon: Partial<CouponInput>): Promise<Coupon> {
        const response = await apiClient.put<{ success: boolean; data: Coupon }>(`/coupons/${id}`, coupon);
        if (!response.success) throw new Error('Failed to update coupon');
        return response.data;
    },

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/coupons/${id}`);
    },

    async incrementUsage(id: string): Promise<void> {
        await apiClient.patch(`/coupons/${id}/increment`, {});
    },

    validate(coupon: Coupon, orderTotal: number): { valid: boolean; message?: string } {
        if (!coupon.is_active) {
            return { valid: false, message: 'Cupom inativo' };
        }

        if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
            return { valid: false, message: 'Cupom expirado' };
        }

        if (coupon.valid_from && new Date(coupon.valid_from) > new Date()) {
            return { valid: false, message: 'Cupom ainda não válido' };
        }

        if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
            return { valid: false, message: 'Cupom esgotado' };
        }

        if (coupon.min_order_value && orderTotal < coupon.min_order_value) {
            return { 
                valid: false, 
                message: `Valor mínimo: R$ ${coupon.min_order_value.toFixed(2).replace('.', ',')}` 
            };
        }

        return { valid: true };
    },

    calculateDiscount(coupon: Coupon, orderTotal: number): number {
        if (coupon.discount_type === 'percentage') {
            return (orderTotal * coupon.discount_value) / 100;
        }
        return coupon.discount_value;
    },
};

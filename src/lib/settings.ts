import { supabase } from './supabase';

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
        const { data, error } = await supabase
            .from('store_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (error) {
            console.error('Error fetching settings:', error);
            return null;
        }
        return data;
    },

    async update(settings: Partial<StoreSettings>): Promise<StoreSettings> {
        const { data, error } = await supabase
            .from('store_settings')
            .update(settings)
            .eq('id', 1)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },
};

// ========================================
// COUPON SERVICE
// ========================================

export const couponService = {
    async getAll(): Promise<Coupon[]> {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data || [];
    },

    async getByCode(code: string): Promise<Coupon | null> {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code.toUpperCase())
            .eq('is_active', true)
            .single();

        if (error) return null;
        return data;
    },

    async create(coupon: CouponInput): Promise<Coupon> {
        const { data, error } = await supabase
            .from('coupons')
            .insert({ ...coupon, code: coupon.code.toUpperCase() })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async update(id: string, coupon: Partial<CouponInput>): Promise<Coupon> {
        const { data, error } = await supabase
            .from('coupons')
            .update(coupon)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
    },

    async incrementUsage(id: string): Promise<void> {
        const { error } = await supabase.rpc('increment_coupon_usage', { coupon_id: id });
        if (error) {
            // Fallback: update directly
            const { data: coupon } = await supabase
                .from('coupons')
                .select('current_uses')
                .eq('id', id)
                .single();
            
            if (coupon) {
                await supabase
                    .from('coupons')
                    .update({ current_uses: coupon.current_uses + 1 })
                    .eq('id', id);
            }
        }
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

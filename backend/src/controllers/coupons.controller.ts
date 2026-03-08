import { Request, Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Get all coupons
export const getAllCoupons = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await query(
            'SELECT * FROM coupons ORDER BY created_at DESC',
            []
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar cupons' });
    }
};

// Get coupon by ID
export const getCouponById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await query('SELECT * FROM coupons WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Cupom não encontrado' });
            return;
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching coupon:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar cupom' });
    }
};

// Get coupon by code
export const getCouponByCode = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code } = req.params;
        const result = await query(
            'SELECT * FROM coupons WHERE UPPER(code) = UPPER($1)',
            [code]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Cupom não encontrado' });
            return;
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching coupon:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar cupom' });
    }
};

// Create coupon (admin only)
export const createCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {
            code,
            discount_type,
            discount_value,
            min_order_value,
            max_uses,
            valid_from,
            valid_until,
            is_active,
        } = req.body;

        // Check if code already exists
        const existing = await query(
            'SELECT id FROM coupons WHERE UPPER(code) = UPPER($1)',
            [code]
        );

        if (existing.rows.length > 0) {
            res.status(400).json({ success: false, error: 'Este código de cupom já existe' });
            return;
        }

        const result = await query(
            `INSERT INTO coupons (
                code, discount_type, discount_value, min_order_value, max_uses,
                valid_from, valid_until, is_active, current_uses
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0)
            RETURNING *`,
            [
                code.toUpperCase(),
                discount_type,
                discount_value,
                min_order_value,
                max_uses,
                valid_from || null,
                valid_until || null,
                is_active !== false,
            ]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error creating coupon:', error);
        res.status(500).json({ success: false, error: 'Erro ao criar cupom' });
    }
};

// Update coupon (admin only)
export const updateCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const {
            code,
            discount_type,
            discount_value,
            min_order_value,
            max_uses,
            valid_from,
            valid_until,
            is_active,
        } = req.body;

        // Check if coupon exists
        const existing = await query('SELECT id FROM coupons WHERE id = $1', [id]);

        if (existing.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Cupom não encontrado' });
            return;
        }

        const result = await query(
            `UPDATE coupons SET
                code = COALESCE($1, code),
                discount_type = COALESCE($2, discount_type),
                discount_value = COALESCE($3, discount_value),
                min_order_value = COALESCE($4, min_order_value),
                max_uses = COALESCE($5, max_uses),
                valid_from = COALESCE($6, valid_from),
                valid_until = COALESCE($7, valid_until),
                is_active = COALESCE($8, is_active),
                updated_at = NOW()
            WHERE id = $9
            RETURNING *`,
            [
                code?.toUpperCase(),
                discount_type,
                discount_value,
                min_order_value,
                max_uses,
                valid_from,
                valid_until,
                is_active,
                id,
            ]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(500).json({ success: false, error: 'Erro ao atualizar cupom' });
    }
};

// Delete coupon (admin only)
export const deleteCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM coupons WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Cupom não encontrado' });
            return;
        }

        res.json({ success: true, message: 'Cupom excluído com sucesso' });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ success: false, error: 'Erro ao excluir cupom' });
    }
};

// Increment coupon usage
export const incrementCouponUsage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await query(
            'UPDATE coupons SET current_uses = current_uses + 1 WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Cupom não encontrado' });
            return;
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error incrementing coupon usage:', error);
        res.status(500).json({ success: false, error: 'Erro ao atualizar uso do cupom' });
    }
};

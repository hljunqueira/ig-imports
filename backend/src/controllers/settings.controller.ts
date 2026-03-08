import { Request, Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Get store settings
export const getSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await query('SELECT * FROM store_settings LIMIT 1', []);
        
        if (result.rows.length === 0) {
            // Return default settings if none exist
            res.json({
                success: true,
                data: {
                    store_name: 'IG Imports',
                    store_email: '',
                    store_phone: '',
                    store_whatsapp: '',
                    store_address: '',
                    store_city: '',
                    store_state: '',
                    store_zip: '',
                    instagram_url: '',
                    facebook_url: '',
                    meta_title: 'IG Imports - Camisas de Time',
                    meta_description: 'As melhores camisas de time com preço justo',
                    primary_color: '#3b82f6',
                    logo_url: '',
                    currency: 'BRL',
                    delivery_fee: 15.00,
                    free_delivery_min: 200.00,
                    enable_delivery: true,
                    enable_pickup: true,
                    require_login: false,
                }
            });
            return;
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar configurações' });
    }
};

// Update store settings (admin only)
export const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {
            store_name,
            store_email,
            store_phone,
            store_whatsapp,
            store_address,
            store_city,
            store_state,
            store_zip,
            instagram_url,
            facebook_url,
            meta_title,
            meta_description,
            primary_color,
            logo_url,
            currency,
            delivery_fee,
            free_delivery_min,
            enable_delivery,
            enable_pickup,
            require_login,
        } = req.body;

        // Check if settings exist
        const existing = await query('SELECT id FROM store_settings LIMIT 1', []);

        let result;
        if (existing.rows.length === 0) {
            // Insert new settings
            result = await query(
                `INSERT INTO store_settings (
                    store_name, store_email, store_phone, store_whatsapp, store_address,
                    store_city, store_state, store_zip, instagram_url, facebook_url,
                    meta_title, meta_description, primary_color, logo_url, currency,
                    delivery_fee, free_delivery_min, enable_delivery, enable_pickup, require_login
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                RETURNING *`,
                [
                    store_name, store_email, store_phone, store_whatsapp, store_address,
                    store_city, store_state, store_zip, instagram_url, facebook_url,
                    meta_title, meta_description, primary_color, logo_url, currency,
                    delivery_fee, free_delivery_min, enable_delivery, enable_pickup, require_login,
                ]
            );
        } else {
            // Update existing settings
            result = await query(
                `UPDATE store_settings SET
                    store_name = $1, store_email = $2, store_phone = $3, store_whatsapp = $4,
                    store_address = $5, store_city = $6, store_state = $7, store_zip = $8,
                    instagram_url = $9, facebook_url = $10, meta_title = $11, meta_description = $12,
                    primary_color = $13, logo_url = $14, currency = $15, delivery_fee = $16,
                    free_delivery_min = $17, enable_delivery = $18, enable_pickup = $19,
                    require_login = $20, updated_at = NOW()
                WHERE id = $21
                RETURNING *`,
                [
                    store_name, store_email, store_phone, store_whatsapp, store_address,
                    store_city, store_state, store_zip, instagram_url, facebook_url,
                    meta_title, meta_description, primary_color, logo_url, currency,
                    delivery_fee, free_delivery_min, enable_delivery, enable_pickup, require_login,
                    existing.rows[0].id,
                ]
            );
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ success: false, error: 'Erro ao atualizar configurações' });
    }
};

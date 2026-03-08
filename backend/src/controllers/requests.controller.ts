import { Request, Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Get all requests
export const getRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, urgency, handled_by } = req.query;
        
        let sql = `
            SELECT r.*, u.full_name as handled_by_name
            FROM product_requests r
            LEFT JOIN admin_profiles u ON r.handled_by = u.id
            WHERE 1=1
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (status) {
            sql += ` AND r.status = $${paramIndex++}`;
            params.push(status);
        }

        if (urgency) {
            sql += ` AND r.urgency = $${paramIndex++}`;
            params.push(urgency);
        }

        if (handled_by) {
            sql += ` AND r.handled_by = $${paramIndex++}`;
            params.push(handled_by);
        }

        sql += ` ORDER BY 
            CASE r.urgency 
                WHEN 'urgent' THEN 1 
                WHEN 'high' THEN 2 
                WHEN 'normal' THEN 3 
                ELSE 4 
            END,
            r.created_at DESC`;

        const result = await query(sql, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch requests' });
    }
};

// Get request by ID
export const getRequestById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        
        const requestResult = await query(
            `SELECT r.*, u.full_name as handled_by_name
             FROM product_requests r
             LEFT JOIN admin_profiles u ON r.handled_by = u.id
             WHERE r.id = $1`,
            [id]
        );

        if (requestResult.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Request not found' });
            return;
        }

        // Get status history
        const historyResult = await query(
            `SELECT h.*, u.full_name as changed_by_name
             FROM request_status_history h
             LEFT JOIN admin_profiles u ON h.changed_by = u.id
             WHERE h.request_id = $1
             ORDER BY h.created_at DESC`,
            [id]
        );

        res.json({
            success: true,
            data: {
                ...requestResult.rows[0],
                history: historyResult.rows,
            },
        });
    } catch (error) {
        console.error('Error fetching request:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch request' });
    }
};

// Create request (public)
export const createRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            customer_name,
            customer_phone,
            customer_email,
            product_description,
            preferred_brand,
            preferred_size,
            quantity,
            max_budget,
            urgency,
        } = req.body;

        const result = await query(
            `INSERT INTO product_requests (
                customer_name, customer_phone, customer_email,
                product_description, preferred_brand, preferred_size,
                quantity, max_budget, urgency, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending') RETURNING *`,
            [
                customer_name,
                customer_phone,
                customer_email,
                product_description,
                preferred_brand,
                preferred_size,
                quantity || 1,
                max_budget,
                urgency || 'normal',
            ]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error creating request:', error);
        res.status(500).json({ success: false, error: 'Failed to create request' });
    }
};

// Update request status (admin)
export const updateStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        // Get current status
        const current = await query('SELECT status FROM product_requests WHERE id = $1', [id]);
        if (current.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Request not found' });
            return;
        }

        const oldStatus = current.rows[0].status;

        // Update request
        const updates: string[] = [`status = $1`];
        const values: any[] = [status];
        let paramIndex = 2;

        if (status === 'quoted') {
            updates.push(`quoted_at = $${paramIndex++}`);
            values.push(new Date());
        }

        values.push(id);
        const sql = `UPDATE product_requests SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;

        const result = await query(sql, values);

        // Add status history
        await query(
            `INSERT INTO request_status_history (request_id, old_status, new_status, changed_by, notes)
             VALUES ($1, $2, $3, $4, $5)`,
            [id, oldStatus, status, req.user?.id, notes]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating request status:', error);
        res.status(500).json({ success: false, error: 'Failed to update request status' });
    }
};

// Assign request to admin
export const assignRequest = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        
        const result = await query(
            `UPDATE product_requests SET handled_by = $1, status = 'reviewing', updated_at = NOW() WHERE id = $2 RETURNING *`,
            [req.user?.id, id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Request not found' });
            return;
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error assigning request:', error);
        res.status(500).json({ success: false, error: 'Failed to assign request' });
    }
};

// Quote request
export const quoteRequest = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { quoted_price, admin_notes } = req.body;

        const result = await query(
            `UPDATE product_requests 
             SET quoted_price = $1, admin_notes = $2, status = 'quoted', quoted_at = NOW(), updated_at = NOW()
             WHERE id = $3 RETURNING *`,
            [quoted_price, admin_notes, id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Request not found' });
            return;
        }

        // Add status history
        await query(
            `INSERT INTO request_status_history (request_id, old_status, new_status, changed_by, notes)
             VALUES ($1, 'reviewing', 'quoted', $2, $3)`,
            [id, req.user?.id, `Orçamento: R$ ${quoted_price}`]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error quoting request:', error);
        res.status(500).json({ success: false, error: 'Failed to quote request' });
    }
};

// Delete request
export const deleteRequest = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM product_requests WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Request not found' });
            return;
        }

        res.json({ success: true, message: 'Request deleted successfully' });
    } catch (error) {
        console.error('Error deleting request:', error);
        res.status(500).json({ success: false, error: 'Failed to delete request' });
    }
};

// Get request statistics
export const getRequestStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await query(
            `SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'reviewing' THEN 1 END) as reviewing,
                COUNT(CASE WHEN status = 'quoted' THEN 1 END) as quoted,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
                COUNT(CASE WHEN status = 'ordered' THEN 1 END) as ordered,
                COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
                COUNT(CASE WHEN urgency = 'urgent' THEN 1 END) as urgent,
                COUNT(CASE WHEN urgency = 'high' THEN 1 END) as high
             FROM product_requests`
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching request stats:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch request stats' });
    }
};

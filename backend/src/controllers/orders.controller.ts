import { Request, Response } from 'express';
import { query, withTransaction } from '../config/database';

// Get all orders
export const getOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, payment_status, search } = req.query;
        
        let sql = `
            SELECT o.*, 
                   COUNT(oi.id) as items_count,
                   SUM(oi.quantity) as total_items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE 1=1
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (status) {
            sql += ` AND o.status = $${paramIndex++}`;
            params.push(status);
        }

        if (payment_status) {
            sql += ` AND o.payment_status = $${paramIndex++}`;
            params.push(payment_status);
        }

        if (search) {
            sql += ` AND (o.customer_name ILIKE $${paramIndex} OR o.customer_phone ILIKE $${paramIndex} OR o.customer_email ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
        }

        sql += ` GROUP BY o.id ORDER BY o.created_at DESC`;

        const result = await query(sql, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar pedidos' });
    }
};

// Get order by ID with items
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        
        // Get order
        const orderResult = await query('SELECT * FROM orders WHERE id = $1', [id]);
        
        if (orderResult.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Pedido não encontrado' });
            return;
        }

        // Get items
        const itemsResult = await query(
            `SELECT oi.*, p.name as product_name, p.image_url as product_image
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = $1`,
            [id]
        );

        res.json({
            success: true,
            data: {
                ...orderResult.rows[0],
                items: itemsResult.rows,
            },
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch order' });
    }
};

// Create order
export const createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            customer_name,
            customer_phone,
            customer_email,
            delivery_type,
            address,
            notes,
            items,
        } = req.body;

        if (!items || items.length === 0) {
            res.status(400).json({ success: false, error: 'O pedido deve ter pelo menos um item' });
            return;
        }

        const result = await withTransaction(async (client) => {
            // Calculate total
            let total = 0;
            for (const item of items) {
                total += item.unit_price * item.quantity;
            }

            // Create order
            const orderResult = await client.query(
                `INSERT INTO orders (customer_name, customer_phone, customer_email, delivery_type, address, total, notes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [customer_name, customer_phone, customer_email, delivery_type, address, total, notes]
            );

            const order = orderResult.rows[0];

            // Create order items
            for (const item of items) {
                await client.query(
                    `INSERT INTO order_items (order_id, product_id, product_name, product_image, size, quantity, unit_price)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        order.id,
                        item.product_id,
                        item.product_name,
                        item.product_image,
                        item.size,
                        item.quantity,
                        item.unit_price,
                    ]
                );

                // Update stock
                await client.query(
                    `UPDATE products SET stock = stock - $1 WHERE id = $2`,
                    [item.quantity, item.product_id]
                );
            }

            return order;
        });

        res.status(201).json({ success: true, data: result });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, error: 'Erro ao criar pedido' });
    }
};

// Update order status
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status, payment_status } = req.body;

        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (status) {
            updates.push(`status = $${paramIndex++}`);
            values.push(status);
        }

        if (payment_status) {
            updates.push(`payment_status = $${paramIndex++}`);
            values.push(payment_status);
        }

        if (updates.length === 0) {
            res.status(400).json({ success: false, error: 'Nenhum status para atualizar' });
            return;
        }

        values.push(id);
        const sql = `UPDATE orders SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;

        const result = await query(sql, values);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Pedido não encontrado' });
            return;
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ success: false, error: 'Erro ao atualizar pedido' });
    }
};

// Delete order
export const deleteOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        
        await withTransaction(async (client) => {
            // Return stock
            const items = await client.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
            
            for (const item of items.rows) {
                await client.query(
                    'UPDATE products SET stock = stock + $1 WHERE id = $2',
                    [item.quantity, item.product_id]
                );
            }

            // Delete order (cascade will delete items)
            await client.query('DELETE FROM orders WHERE id = $1', [id]);
        });

        res.json({ success: true, message: 'Pedido excluído com sucesso' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ success: false, error: 'Erro ao excluir pedido' });
    }
};

// Get order statistics
export const getOrderStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const { startDate, endDate } = req.query;
        
        let sql = `
            SELECT 
                COUNT(*) as total_orders,
                SUM(total) as total_revenue,
                AVG(total) as average_order_value,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
                COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders
            FROM orders
            WHERE 1=1
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (startDate) {
            sql += ` AND created_at >= $${paramIndex++}`;
            params.push(startDate);
        }

        if (endDate) {
            sql += ` AND created_at <= $${paramIndex++}`;
            params.push(endDate);
        }

        const result = await query(sql, params);
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching order stats:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar estatísticas de pedidos' });
    }
};

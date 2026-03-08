import { Request, Response } from 'express';
import { query, withTransaction } from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Get stock movements
export const getStockMovements = async (req: Request, res: Response): Promise<void> => {
    try {
        const { product_id } = req.query;
        
        let sql = `
            SELECT sm.*, p.name as product_name, p.image_url as product_image
            FROM stock_movements sm
            LEFT JOIN products p ON sm.product_id = p.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (product_id) {
            sql += ` AND sm.product_id = $1`;
            params.push(product_id);
        }

        sql += ` ORDER BY sm.created_at DESC`;

        const result = await query(sql, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching stock movements:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar movimentações de estoque' });
    }
};

// Create stock movement
export const createStockMovement = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { product_id, movement_type, quantity, reason, reference_order_id, reference_request_id } = req.body;

        const result = await withTransaction(async (client) => {
            // Get current stock
            const productResult = await client.query('SELECT stock FROM products WHERE id = $1', [product_id]);
            if (productResult.rows.length === 0) {
                throw new Error('Product not found');
            }

            const previousStock = productResult.rows[0].stock;
            let newStock = previousStock;

            // Calculate new stock
            switch (movement_type) {
                case 'in':
                case 'return':
                    newStock = previousStock + quantity;
                    break;
                case 'out':
                    newStock = previousStock - quantity;
                    break;
                case 'adjustment':
                    newStock = quantity;
                    break;
            }

            // Create movement
            const movementResult = await client.query(
                `INSERT INTO stock_movements (product_id, movement_type, quantity, previous_stock, new_stock, reason, reference_order_id, reference_request_id, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
                [product_id, movement_type, quantity, previousStock, newStock, reason, reference_order_id, reference_request_id, req.user?.id]
            );

            // Update product stock
            await client.query('UPDATE products SET stock = $1 WHERE id = $2', [newStock, product_id]);

            return movementResult.rows[0];
        });

        res.status(201).json({ success: true, data: result });
    } catch (error) {
        console.error('Error creating stock movement:', error);
        res.status(500).json({ success: false, error: 'Erro ao criar movimentação de estoque' });
    }
};

// Get low stock products
export const getLowStockProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await query(
            `SELECT p.*, c.name as category_name
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.stock <= p.min_stock AND p.status = 'active'
             ORDER BY p.stock ASC`
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching low stock products:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar produtos com estoque baixo' });
    }
};

// Get inventory stats
export const getInventoryStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await query(
            `SELECT 
                COUNT(*) as total_products,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
                COUNT(CASE WHEN stock = 0 THEN 1 END) as out_of_stock,
                COUNT(CASE WHEN stock <= min_stock AND stock > 0 THEN 1 END) as low_stock,
                SUM(stock) as total_stock
             FROM products`
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching inventory stats:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar estatísticas de estoque' });
    }
};

// Suppliers
export const getSuppliers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { active } = req.query;
        
        let sql = `SELECT * FROM suppliers WHERE 1=1`;
        const params: any[] = [];

        if (active === 'true') {
            sql += ` AND is_active = true`;
        }

        sql += ` ORDER BY name ASC`;

        const result = await query(sql, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar fornecedores' });
    }
};

export const createSupplier = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, contact_name, phone, email, address, notes } = req.body;

        const result = await query(
            `INSERT INTO suppliers (name, contact_name, phone, email, address, notes, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING *`,
            [name, contact_name, phone, email, address, notes]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error creating supplier:', error);
        res.status(500).json({ success: false, error: 'Erro ao criar fornecedor' });
    }
};

export const updateSupplier = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const allowedFields = ['name', 'contact_name', 'phone', 'email', 'address', 'notes', 'is_active'];
        const setClauses: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                setClauses.push(`${key} = $${paramIndex++}`);
                values.push(value);
            }
        }

        if (setClauses.length === 0) {
            res.status(400).json({ success: false, error: 'Nenhum campo válido para atualizar' });
            return;
        }

        values.push(id);
        const sql = `UPDATE suppliers SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;

        const result = await query(sql, values);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Fornecedor não encontrado' });
            return;
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating supplier:', error);
        res.status(500).json({ success: false, error: 'Erro ao atualizar fornecedor' });
    }
};

// Purchase Orders
export const getPurchaseOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status } = req.query;
        
        let sql = `
            SELECT po.*, s.name as supplier_name
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (status) {
            sql += ` AND po.status = $1`;
            params.push(status);
        }

        sql += ` ORDER BY po.created_at DESC`;

        const result = await query(sql, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching purchase orders:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar pedidos de compra' });
    }
};

export const getPurchaseOrderById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        
        const orderResult = await query(
            `SELECT po.*, s.name as supplier_name
             FROM purchase_orders po
             LEFT JOIN suppliers s ON po.supplier_id = s.id
             WHERE po.id = $1`,
            [id]
        );

        if (orderResult.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Pedido de compra não encontrado' });
            return;
        }

        const itemsResult = await query(
            `SELECT poi.*, p.name as product_name, p.image_url as product_image
             FROM purchase_order_items poi
             LEFT JOIN products p ON poi.product_id = p.id
             WHERE poi.purchase_order_id = $1`,
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
        console.error('Error fetching purchase order:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar pedido de compra' });
    }
};

export const createPurchaseOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { supplier_id, expected_delivery, notes, items } = req.body;

        const totalAmount = items.reduce((sum: number, item: any) => sum + item.total_cost, 0);

        const result = await withTransaction(async (client) => {
            // Create order
            const orderResult = await client.query(
                `INSERT INTO purchase_orders (supplier_id, total_amount, expected_delivery, notes, status, created_by)
                 VALUES ($1, $2, $3, $4, 'draft', $5) RETURNING *`,
                [supplier_id, totalAmount, expected_delivery, notes, req.user?.id]
            );

            const order = orderResult.rows[0];

            // Create items
            for (const item of items) {
                await client.query(
                    `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost, total_cost)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [order.id, item.product_id, item.quantity, item.unit_cost, item.total_cost]
                );
            }

            return order;
        });

        res.status(201).json({ success: true, data: result });
    } catch (error) {
        console.error('Error creating purchase order:', error);
        res.status(500).json({ success: false, error: 'Erro ao criar pedido de compra' });
    }
};

export const updatePurchaseOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status, actual_delivery } = req.body;

        const result = await query(
            `UPDATE purchase_orders SET status = $1, actual_delivery = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
            [status, actual_delivery, id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Pedido de compra não encontrado' });
            return;
        }

        // If received, update stock
        if (status === 'received') {
            const items = await query('SELECT * FROM purchase_order_items WHERE purchase_order_id = $1', [id]);
            
            for (const item of items.rows) {
                await query(
                    `INSERT INTO stock_movements (product_id, movement_type, quantity, previous_stock, new_stock, reason)
                     SELECT id, 'in', $1, stock, stock + $1, 'Recebimento de pedido de compra'
                     FROM products WHERE id = $2`,
                    [item.quantity, item.product_id]
                );
                
                await query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);
            }
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating purchase order:', error);
        res.status(500).json({ success: false, error: 'Erro ao atualizar pedido de compra' });
    }
};

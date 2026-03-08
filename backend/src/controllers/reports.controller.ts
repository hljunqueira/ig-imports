import { Request, Response } from 'express';
import { query } from '../config/database';

// Sales report by period
export const getSalesReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;
        
        let dateFormat: string;
        switch (groupBy) {
            case 'month':
                dateFormat = 'YYYY-MM';
                break;
            case 'week':
                dateFormat = 'YYYY-WW';
                break;
            case 'day':
            default:
                dateFormat = 'YYYY-MM-DD';
        }

        const result = await query(
            `SELECT 
                TO_CHAR(created_at, $1) as period,
                COUNT(*) as total_orders,
                SUM(total) as total_revenue,
                AVG(total) as average_order_value,
                COUNT(DISTINCT customer_phone) as unique_customers
             FROM orders
             WHERE created_at >= $2 AND created_at <= $3
             AND status != 'cancelled'
             GROUP BY TO_CHAR(created_at, $1)
             ORDER BY period ASC`,
            [dateFormat, startDate || '2024-01-01', endDate || '2024-12-31']
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).json({ success: false, error: 'Failed to generate sales report' });
    }
};

// Top selling products
export const getTopProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { limit = 10, startDate, endDate } = req.query;

        const result = await query(
            `SELECT 
                p.id,
                p.name,
                p.image_url,
                c.name as category_name,
                SUM(oi.quantity) as total_sold,
                SUM(oi.quantity * oi.unit_price) as total_revenue,
                COUNT(DISTINCT oi.order_id) as order_count
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             LEFT JOIN categories c ON p.category_id = c.id
             JOIN orders o ON oi.order_id = o.id
             WHERE o.status != 'cancelled'
             ${startDate ? 'AND o.created_at >= $2' : ''}
             ${endDate ? 'AND o.created_at <= $3' : ''}
             GROUP BY p.id, p.name, p.image_url, c.name
             ORDER BY total_sold DESC
             LIMIT $1`,
            [limit, startDate, endDate].filter(Boolean)
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching top products:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch top products' });
    }
};

// Sales by category
export const getSalesByCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { startDate, endDate } = req.query;

        const result = await query(
            `SELECT 
                c.name as category,
                COUNT(DISTINCT o.id) as order_count,
                SUM(oi.quantity) as items_sold,
                SUM(oi.quantity * oi.unit_price) as revenue,
                ROUND(SUM(oi.quantity * oi.unit_price) * 100.0 / SUM(SUM(oi.quantity * oi.unit_price)) OVER(), 2) as percentage
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             LEFT JOIN categories c ON p.category_id = c.id
             JOIN orders o ON oi.order_id = o.id
             WHERE o.status != 'cancelled'
             ${startDate ? 'AND o.created_at >= $1' : ''}
             ${endDate ? 'AND o.created_at <= $2' : ''}
             GROUP BY c.id, c.name
             ORDER BY revenue DESC`,
            [startDate, endDate].filter(Boolean)
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching sales by category:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch sales by category' });
    }
};

// Financial report
export const getFinancialReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { startDate, endDate } = req.query;

        const result = await query(
            `SELECT 
                transaction_type,
                category,
                COUNT(*) as transaction_count,
                SUM(amount) as total_amount,
                AVG(amount) as average_amount
             FROM financial_transactions
             WHERE transaction_date >= $1 AND transaction_date <= $2
             AND payment_status = 'completed'
             GROUP BY transaction_type, category
             ORDER BY transaction_type, total_amount DESC`,
            [startDate || '2024-01-01', endDate || '2024-12-31']
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error generating financial report:', error);
        res.status(500).json({ success: false, error: 'Failed to generate financial report' });
    }
};

// Customer analytics
export const getCustomerAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
        const { startDate, endDate } = req.query;

        // New vs returning customers
        const customerResult = await query(
            `WITH customer_orders AS (
                SELECT 
                    customer_phone,
                    customer_name,
                    COUNT(*) as order_count,
                    SUM(total) as total_spent,
                    MIN(created_at) as first_order,
                    MAX(created_at) as last_order
                FROM orders
                WHERE status != 'cancelled'
                ${startDate ? 'AND created_at >= $1' : ''}
                ${endDate ? 'AND created_at <= $2' : ''}
                GROUP BY customer_phone, customer_name
            )
            SELECT 
                COUNT(*) as total_customers,
                COUNT(CASE WHEN order_count = 1 THEN 1 END) as new_customers,
                COUNT(CASE WHEN order_count > 1 THEN 1 END) as returning_customers,
                AVG(total_spent) as average_customer_value,
                MAX(total_spent) as top_customer_value
            FROM customer_orders`,
            [startDate, endDate].filter(Boolean)
        );

        // Top customers
        const topCustomers = await query(
            `SELECT 
                customer_name,
                customer_phone,
                COUNT(*) as order_count,
                SUM(total) as total_spent,
                AVG(total) as average_order
             FROM orders
             WHERE status != 'cancelled'
             ${startDate ? 'AND created_at >= $1' : ''}
             ${endDate ? 'AND created_at <= $2' : ''}
             GROUP BY customer_name, customer_phone
             ORDER BY total_spent DESC
             LIMIT 10`,
            [startDate, endDate].filter(Boolean)
        );

        res.json({
            success: true,
            data: {
                summary: customerResult.rows[0],
                topCustomers: topCustomers.rows,
            },
        });
    } catch (error) {
        console.error('Error generating customer analytics:', error);
        res.status(500).json({ success: false, error: 'Failed to generate customer analytics' });
    }
};

// Inventory report
export const getInventoryReport = async (req: Request, res: Response): Promise<void> => {
    try {
        // Current inventory status
        const inventoryResult = await query(
            `SELECT 
                c.name as category,
                COUNT(p.id) as product_count,
                SUM(p.stock) as total_stock,
                AVG(p.stock) as average_stock,
                COUNT(CASE WHEN p.stock = 0 THEN 1 END) as out_of_stock,
                COUNT(CASE WHEN p.stock <= p.min_stock AND p.stock > 0 THEN 1 END) as low_stock
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.status = 'active'
             GROUP BY c.id, c.name
             ORDER BY total_stock DESC`
        );

        // Stock movement summary
        const movementResult = await query(
            `SELECT 
                movement_type,
                COUNT(*) as movement_count,
                SUM(ABS(quantity)) as total_quantity
             FROM stock_movements
             WHERE created_at >= NOW() - INTERVAL '30 days'
             GROUP BY movement_type`
        );

        res.json({
            success: true,
            data: {
                byCategory: inventoryResult.rows,
                movements: movementResult.rows,
            },
        });
    } catch (error) {
        console.error('Error generating inventory report:', error);
        res.status(500).json({ success: false, error: 'Failed to generate inventory report' });
    }
};

// Dashboard summary
export const getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
    try {
        // Today's stats
        const todayResult = await query(
            `SELECT 
                COUNT(*) as orders_today,
                COALESCE(SUM(total), 0) as revenue_today
             FROM orders
             WHERE DATE(created_at) = CURRENT_DATE
             AND status != 'cancelled'`
        );

        // This month
        const monthResult = await query(
            `SELECT 
                COUNT(*) as orders_this_month,
                COALESCE(SUM(total), 0) as revenue_this_month
             FROM orders
             WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
             AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
             AND status != 'cancelled'`
        );

        // Pending orders
        const pendingResult = await query(
            `SELECT COUNT(*) as pending_orders FROM orders WHERE status = 'pending'`
        );

        // Low stock count
        const lowStockResult = await query(
            `SELECT COUNT(*) as low_stock_products FROM products WHERE stock <= min_stock AND status = 'active'`
        );

        // Pending requests
        const requestsResult = await query(
            `SELECT COUNT(*) as pending_requests FROM product_requests WHERE status IN ('pending', 'reviewing')`
        );

        // Recent activity
        const recentOrders = await query(
            `SELECT o.*, COUNT(oi.id) as item_count
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             GROUP BY o.id
             ORDER BY o.created_at DESC
             LIMIT 5`
        );

        res.json({
            success: true,
            data: {
                today: todayResult.rows[0],
                thisMonth: monthResult.rows[0],
                pendingOrders: parseInt(pendingResult.rows[0].pending_orders),
                lowStockProducts: parseInt(lowStockResult.rows[0].low_stock_products),
                pendingRequests: parseInt(requestsResult.rows[0].pending_requests),
                recentOrders: recentOrders.rows,
            },
        });
    } catch (error) {
        console.error('Error generating dashboard summary:', error);
        res.status(500).json({ success: false, error: 'Failed to generate dashboard summary' });
    }
};

// Export data
export const exportData = async (req: Request, res: Response): Promise<void> => {
    try {
        const { type, format = 'json', startDate, endDate } = req.query;

        let data: any[] = [];
        let filename: string;

        switch (type) {
            case 'orders':
                const ordersResult = await query(
                    `SELECT o.*, json_agg(oi.*) as items
                     FROM orders o
                     LEFT JOIN order_items oi ON o.id = oi.order_id
                     WHERE o.created_at >= $1 AND o.created_at <= $2
                     GROUP BY o.id`,
                    [startDate, endDate]
                );
                data = ordersResult.rows;
                filename = `orders_${startDate}_${endDate}`;
                break;

            case 'products':
                const productsResult = await query('SELECT * FROM products');
                data = productsResult.rows;
                filename = 'products_export';
                break;

            case 'transactions':
                const transactionsResult = await query(
                    `SELECT * FROM financial_transactions 
                     WHERE transaction_date >= $1 AND transaction_date <= $2`,
                    [startDate, endDate]
                );
                data = transactionsResult.rows;
                filename = `transactions_${startDate}_${endDate}`;
                break;

            default:
                res.status(400).json({ success: false, error: 'Invalid export type' });
                return;
        }

        if (format === 'csv') {
            // Simple CSV conversion
            if (data.length === 0) {
                res.status(404).json({ success: false, error: 'No data to export' });
                return;
            }

            const headers = Object.keys(data[0]).join(',');
            const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(','));
            const csv = [headers, ...rows].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
            res.send(csv);
        } else {
            res.json({ success: true, data });
        }
    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({ success: false, error: 'Failed to export data' });
    }
};

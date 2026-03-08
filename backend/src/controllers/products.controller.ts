import { Request, Response } from 'express';
import { query } from '../config/database';

// Get all products
export const getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { category, status, search } = req.query;
        
        let sql = `
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE 1=1
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (category) {
            sql += ` AND p.category_id = $${paramIndex++}`;
            params.push(category);
        }

        if (status) {
            sql += ` AND p.status = $${paramIndex++}`;
            params.push(status);
        }

        if (search) {
            sql += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
        }

        sql += ` ORDER BY p.created_at DESC`;

        const result = await query(sql, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar produtos' });
    }
};

// Get product by slug
export const getProductBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
        const { slug } = req.params;
        const result = await query(
            `SELECT p.*, c.name as category_name 
             FROM products p 
             LEFT JOIN categories c ON p.category_id = c.id 
             WHERE p.slug = $1`,
            [slug]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Produto não encontrado' });
            return;
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching product by slug:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar produto' });
    }
};

// Get product by ID
export const getProductById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await query(
            `SELECT p.*, c.name as category_name 
             FROM products p 
             LEFT JOIN categories c ON p.category_id = c.id 
             WHERE p.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Produto não encontrado' });
            return;
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar produto' });
    }
};

// Create product
export const createProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            name,
            description,
            price,
            original_price,
            category_id,
            image_url,
            sizes,
            stock,
            min_stock,
            status,
            is_featured,
            tags,
            cost_price,
        } = req.body;

        const result = await query(
            `INSERT INTO products (
                name, description, price, original_price, category_id, 
                image_url, sizes, stock, min_stock, status, 
                is_featured, tags, cost_price
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
            RETURNING *`,
            [
                name,
                description,
                price,
                original_price,
                category_id,
                image_url,
                sizes,
                stock,
                min_stock || 5,
                status || 'active',
                is_featured || false,
                tags,
                cost_price,
            ]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ success: false, error: 'Erro ao criar produto' });
    }
};

// Update product
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const allowedFields = [
            'name', 'description', 'price', 'original_price', 'category_id',
            'image_url', 'sizes', 'stock', 'min_stock', 'status',
            'is_featured', 'tags', 'cost_price', 'supplier_id'
        ];

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
        const sql = `UPDATE products SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

        const result = await query(sql, values);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Produto não encontrado' });
            return;
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ success: false, error: 'Erro ao atualizar produto' });
    }
};

// Delete product
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Produto não encontrado' });
            return;
        }

        res.json({ success: true, message: 'Produto excluído com sucesso' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ success: false, error: 'Erro ao excluir produto' });
    }
};

// Get featured products
export const getFeaturedProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await query(
            `SELECT p.*, c.name as category_name 
             FROM products p 
             LEFT JOIN categories c ON p.category_id = c.id 
             WHERE p.is_featured = true AND p.status = 'active'
             ORDER BY p.created_at DESC 
             LIMIT 8`
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching featured products:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar produtos em destaque' });
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

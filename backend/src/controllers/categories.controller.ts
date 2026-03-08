import { Request, Response } from 'express';
import { query } from '../config/database';

// Get all categories
export const getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
        const { active } = req.query;
        
        let sql = `SELECT * FROM categories WHERE 1=1`;
        const params: any[] = [];

        if (active === 'true') {
            sql += ` AND is_active = true`;
        }

        sql += ` ORDER BY sort_order ASC, name ASC`;

        const result = await query(sql, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar categorias' });
    }
};

// Get category by ID
export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await query('SELECT * FROM categories WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Categoria não encontrada' });
            return;
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar categoria' });
    }
};

// Get category by slug
export const getCategoryBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
        const { slug } = req.params;
        const result = await query('SELECT * FROM categories WHERE slug = $1', [slug]);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Categoria não encontrada' });
            return;
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar categoria' });
    }
};

// Create category
export const createCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, slug, image_url, sort_order } = req.body;

        // Check if slug already exists
        const existing = await query('SELECT * FROM categories WHERE slug = $1', [slug]);
        if (existing.rows.length > 0) {
            res.status(400).json({ success: false, error: 'Slug já existe' });
            return;
        }

        const result = await query(
            `INSERT INTO categories (name, slug, image_url, sort_order, is_active)
             VALUES ($1, $2, $3, $4, true) RETURNING *`,
            [name, slug, image_url, sort_order || 0]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ success: false, error: 'Erro ao criar categoria' });
    }
};

// Update category
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, slug, image_url, sort_order, is_active } = req.body;

        // Check if slug already exists (excluding current category)
        if (slug) {
            const existing = await query('SELECT * FROM categories WHERE slug = $1 AND id != $2', [slug, id]);
            if (existing.rows.length > 0) {
                res.status(400).json({ success: false, error: 'Slug já existe' });
                return;
            }
        }

        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            values.push(name);
        }

        if (slug !== undefined) {
            updates.push(`slug = $${paramIndex++}`);
            values.push(slug);
        }

        if (image_url !== undefined) {
            updates.push(`image_url = $${paramIndex++}`);
            values.push(image_url);
        }

        if (sort_order !== undefined) {
            updates.push(`sort_order = $${paramIndex++}`);
            values.push(sort_order);
        }

        if (is_active !== undefined) {
            updates.push(`is_active = $${paramIndex++}`);
            values.push(is_active);
        }

        if (updates.length === 0) {
            res.status(400).json({ success: false, error: 'Nenhum campo para atualizar' });
            return;
        }

        values.push(id);
        const sql = `UPDATE categories SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;

        const result = await query(sql, values);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Categoria não encontrada' });
            return;
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ success: false, error: 'Erro ao atualizar categoria' });
    }
};

// Delete category
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Check if category has products
        const products = await query('SELECT COUNT(*) FROM products WHERE category_id = $1', [id]);
        if (parseInt(products.rows[0].count) > 0) {
            res.status(400).json({ success: false, error: 'Não é possível excluir uma categoria com produtos vinculados' });
            return;
        }

        const result = await query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Categoria não encontrada' });
            return;
        }

        res.json({ success: true, message: 'Categoria excluída com sucesso' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ success: false, error: 'Erro ao excluir categoria' });
    }
};

// Get category with products
export const getCategoryWithProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { slug } = req.params;
        
        const categoryResult = await query('SELECT * FROM categories WHERE slug = $1 AND is_active = true', [slug]);
        
        if (categoryResult.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Categoria não encontrada' });
            return;
        }

        const productsResult = await query(
            `SELECT * FROM products WHERE category_id = $1 AND status = 'active' ORDER BY created_at DESC`,
            [categoryResult.rows[0].id]
        );

        res.json({
            success: true,
            data: {
                ...categoryResult.rows[0],
                products: productsResult.rows,
            },
        });
    } catch (error) {
        console.error('Error fetching category with products:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar categoria' });
    }
};

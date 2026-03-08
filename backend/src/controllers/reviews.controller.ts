import { Request, Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Get all reviews
export const getReviews = async (req: Request, res: Response): Promise<void> => {
    try {
        const { product_id, approved, featured } = req.query;
        
        let sql = `
            SELECT r.*, p.name as product_name, p.image_url as product_image
            FROM product_reviews r
            LEFT JOIN products p ON r.product_id = p.id
            WHERE 1=1
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (product_id) {
            sql += ` AND r.product_id = $${paramIndex++}`;
            params.push(product_id);
        }

        if (approved !== undefined) {
            sql += ` AND r.is_approved = $${paramIndex++}`;
            params.push(approved === 'true');
        }

        if (featured === 'true') {
            sql += ` AND r.is_featured = true`;
        }

        sql += ` ORDER BY r.created_at DESC`;

        const result = await query(sql, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar avaliações' });
    }
};

// Get review by ID
export const getReviewById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await query(
            `SELECT r.*, p.name as product_name, p.image_url as product_image
             FROM product_reviews r
             LEFT JOIN products p ON r.product_id = p.id
             WHERE r.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Avaliação não encontrada' });
            return;
        }

        // Get replies
        const repliesResult = await query(
            `SELECT rr.*, u.full_name as replied_by_name
             FROM review_replies rr
             LEFT JOIN admin_profiles u ON rr.replied_by = u.id
             WHERE rr.review_id = $1
             ORDER BY rr.created_at ASC`,
            [id]
        );

        res.json({
            success: true,
            data: {
                ...result.rows[0],
                replies: repliesResult.rows,
            },
        });
    } catch (error) {
        console.error('Error fetching review:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar avaliação' });
    }
};

// Create review (public)
export const createReview = async (req: Request, res: Response): Promise<void> => {
    try {
        const { product_id, customer_name, customer_email, rating, title, comment, order_id } = req.body;

        // Validate rating
        if (rating < 1 || rating > 5) {
            res.status(400).json({ success: false, error: 'A nota deve ser entre 1 e 5' });
            return;
        }

        const result = await query(
            `INSERT INTO product_reviews (product_id, customer_name, customer_email, rating, title, comment, order_id, is_approved, is_featured, helpful_count)
             VALUES ($1, $2, $3, $4, $5, $6, $7, false, false, 0) RETURNING *`,
            [product_id, customer_name, customer_email, rating, title, comment, order_id]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ success: false, error: 'Erro ao criar avaliação' });
    }
};

// Approve review (admin)
export const approveReview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await query(
            `UPDATE product_reviews SET is_approved = true, updated_at = NOW() WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Avaliação não encontrada' });
            return;
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error approving review:', error);
        res.status(500).json({ success: false, error: 'Erro ao aprovar avaliação' });
    }
};

// Feature review (admin)
export const featureReview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { featured } = req.body;

        const result = await query(
            `UPDATE product_reviews SET is_featured = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [featured, id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Avaliação não encontrada' });
            return;
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error featuring review:', error);
        res.status(500).json({ success: false, error: 'Erro ao destacar avaliação' });
    }
};

// Delete review (admin)
export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM product_reviews WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Avaliação não encontrada' });
            return;
        }

        res.json({ success: true, message: 'Avaliação excluída com sucesso' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ success: false, error: 'Erro ao excluir avaliação' });
    }
};

// Add reply (admin)
export const addReply = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { reply_text } = req.body;

        const result = await query(
            `INSERT INTO review_replies (review_id, reply_text, replied_by)
             VALUES ($1, $2, $3) RETURNING *`,
            [id, reply_text, req.user?.id]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error adding reply:', error);
        res.status(500).json({ success: false, error: 'Erro ao adicionar resposta' });
    }
};

// Increment helpful count (public)
export const incrementHelpful = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await query(
            `UPDATE product_reviews SET helpful_count = helpful_count + 1 WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Avaliação não encontrada' });
            return;
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error incrementing helpful:', error);
        res.status(500).json({ success: false, error: 'Erro ao contabilizar votos úteis' });
    }
};

// Get review stats for product
export const getProductReviewStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const { product_id } = req.params;

        const result = await query(
            `SELECT 
                COUNT(*) as total,
                AVG(rating) as average,
                COUNT(CASE WHEN rating = 1 THEN 1 END) as star_1,
                COUNT(CASE WHEN rating = 2 THEN 1 END) as star_2,
                COUNT(CASE WHEN rating = 3 THEN 1 END) as star_3,
                COUNT(CASE WHEN rating = 4 THEN 1 END) as star_4,
                COUNT(CASE WHEN rating = 5 THEN 1 END) as star_5
             FROM product_reviews
             WHERE product_id = $1 AND is_approved = true`,
            [product_id]
        );

        const stats = result.rows[0];
        res.json({
            success: true,
            data: {
                total: parseInt(stats.total),
                average: parseFloat(stats.average) || 0,
                distribution: {
                    1: parseInt(stats.star_1),
                    2: parseInt(stats.star_2),
                    3: parseInt(stats.star_3),
                    4: parseInt(stats.star_4),
                    5: parseInt(stats.star_5),
                },
            },
        });
    } catch (error) {
        console.error('Error fetching review stats:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar estatísticas da avaliação' });
    }
};

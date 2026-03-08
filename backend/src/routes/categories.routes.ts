import { Router } from 'express';
import {
    getCategories,
    getCategoryById,
    getCategoryBySlug,
    getCategoryWithProducts,
    createCategory,
    updateCategory,
    deleteCategory,
} from '../controllers/categories.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getCategories);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/with-products/:slug', getCategoryWithProducts);
router.get('/:id', getCategoryById);

// Protected admin routes
router.post('/', authenticate, requireAdmin, createCategory);
router.put('/:id', authenticate, requireAdmin, updateCategory);
router.delete('/:id', authenticate, requireAdmin, deleteCategory);

export default router;

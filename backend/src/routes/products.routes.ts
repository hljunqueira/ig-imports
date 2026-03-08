import { Router } from 'express';
import {
    getProducts,
    getProductById,
    getProductBySlug,
    createProduct,
    updateProduct,
    deleteProduct,
    getFeaturedProducts,
    getLowStockProducts,
} from '../controllers/products.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/featured', getFeaturedProducts);
router.get('/low-stock', authenticate, requireAdmin, getLowStockProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/', getProducts);
router.get('/:id', getProductById);

// Protected admin routes
router.post('/', authenticate, requireAdmin, createProduct);
router.put('/:id', authenticate, requireAdmin, updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);

export default router;

import { Router } from 'express';
import {
    getOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    deleteOrder,
    getOrderStats,
} from '../controllers/orders.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/', createOrder);

// Protected admin routes
router.get('/stats', authenticate, requireAdmin, getOrderStats);
router.get('/', authenticate, requireAdmin, getOrders);
router.get('/:id', authenticate, requireAdmin, getOrderById);
router.put('/:id/status', authenticate, requireAdmin, updateOrderStatus);
router.delete('/:id', authenticate, requireAdmin, deleteOrder);

export default router;

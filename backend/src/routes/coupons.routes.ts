import { Router } from 'express';
import {
    getAllCoupons,
    getCouponById,
    getCouponByCode,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    incrementCouponUsage,
} from '../controllers/coupons.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/code/:code', getCouponByCode);

// Protected admin routes
router.get('/', authenticate, requireAdmin, getAllCoupons);
router.get('/:id', authenticate, requireAdmin, getCouponById);
router.post('/', authenticate, requireAdmin, createCoupon);
router.put('/:id', authenticate, requireAdmin, updateCoupon);
router.delete('/:id', authenticate, requireAdmin, deleteCoupon);
router.patch('/:id/increment', incrementCouponUsage);

export default router;

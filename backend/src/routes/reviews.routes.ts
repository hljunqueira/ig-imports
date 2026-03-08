import { Router } from 'express';
import {
    getReviews,
    getReviewById,
    createReview,
    approveReview,
    featureReview,
    deleteReview,
    addReply,
    incrementHelpful,
    getProductReviewStats,
} from '../controllers/reviews.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getReviews);
router.get('/stats/:product_id', getProductReviewStats);
router.get('/:id', getReviewById);
router.post('/', createReview);
router.post('/:id/helpful', incrementHelpful);

// Protected admin routes
router.post('/:id/approve', authenticate, requireAdmin, approveReview);
router.post('/:id/feature', authenticate, requireAdmin, featureReview);
router.post('/:id/reply', authenticate, requireAdmin, addReply);
router.delete('/:id', authenticate, requireAdmin, deleteReview);

export default router;

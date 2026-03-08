import { Router } from 'express';
import {
    getRequests,
    getRequestById,
    createRequest,
    updateStatus,
    assignRequest,
    quoteRequest,
    deleteRequest,
    getRequestStats,
} from '../controllers/requests.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/', createRequest);

// Protected admin routes
router.get('/stats', authenticate, requireAdmin, getRequestStats);
router.get('/', authenticate, requireAdmin, getRequests);
router.get('/:id', authenticate, requireAdmin, getRequestById);
router.put('/:id/status', authenticate, requireAdmin, updateStatus);
router.post('/:id/assign', authenticate, requireAdmin, assignRequest);
router.post('/:id/quote', authenticate, requireAdmin, quoteRequest);
router.delete('/:id', authenticate, requireAdmin, deleteRequest);

export default router;

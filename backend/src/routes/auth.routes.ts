import { Router } from 'express';
import {
    login,
    getCurrentUser,
    register,
    changePassword,
} from '../controllers/auth.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.post('/change-password', authenticate, changePassword);

// Admin only
router.post('/register', authenticate, requireAdmin, register);

export default router;

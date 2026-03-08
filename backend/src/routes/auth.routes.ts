import { Router } from 'express';
import {
    login,
    getCurrentUser,
    register,
    changePassword,
} from '../controllers/auth.controller';
import { authenticate, requireAdmin } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limit específico para login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.' },
});

// Public routes
router.post('/login', loginLimiter, login);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.post('/change-password', authenticate, changePassword);

// Admin only
router.post('/register', authenticate, requireAdmin, register);

export default router;

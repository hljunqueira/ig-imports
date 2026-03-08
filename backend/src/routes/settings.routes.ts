import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public route - get settings
router.get('/', getSettings);

// Protected admin route - update settings
router.put('/', authenticate, requireAdmin, updateSettings);

export default router;

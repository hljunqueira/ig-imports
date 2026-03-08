import { Router } from 'express';
import {
    getSalesReport,
    getTopProducts,
    getSalesByCategory,
    getFinancialReport,
    getCustomerAnalytics,
    getInventoryReport,
    getDashboardSummary,
    exportData,
} from '../controllers/reports.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All report routes are protected
router.use(authenticate, requireAdmin);

// Dashboard
router.get('/dashboard', getDashboardSummary);

// Sales reports
router.get('/sales', getSalesReport);
router.get('/top-products', getTopProducts);
router.get('/sales-by-category', getSalesByCategory);

// Financial reports
router.get('/financial', getFinancialReport);

// Customer analytics
router.get('/customers', getCustomerAnalytics);

// Inventory reports
router.get('/inventory', getInventoryReport);

// Export
router.get('/export', exportData);

export default router;

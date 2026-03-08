import { Router } from 'express';
import {
    getStockMovements,
    createStockMovement,
    getLowStockProducts,
    getInventoryStats,
    getSuppliers,
    createSupplier,
    updateSupplier,
    getPurchaseOrders,
    getPurchaseOrderById,
    createPurchaseOrder,
    updatePurchaseOrderStatus,
} from '../controllers/inventory.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All inventory routes are protected
router.use(authenticate, requireAdmin);

// Stock Movements
router.get('/movements', getStockMovements);
router.post('/movements', createStockMovement);
router.get('/low-stock', getLowStockProducts);
router.get('/stats', getInventoryStats);

// Suppliers
router.get('/suppliers', getSuppliers);
router.post('/suppliers', createSupplier);
router.put('/suppliers/:id', updateSupplier);

// Purchase Orders
router.get('/purchase-orders', getPurchaseOrders);
router.get('/purchase-orders/:id', getPurchaseOrderById);
router.post('/purchase-orders', createPurchaseOrder);
router.put('/purchase-orders/:id/status', updatePurchaseOrderStatus);

export default router;

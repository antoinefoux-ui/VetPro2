import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { InventoryController } from '../controllers/inventory.controller';

const router = Router();

// Public route for dashboard stats
router.get('/', (req, res) => InventoryController.getAll(req, res));

// Protected routes
router.get('/alerts', authMiddleware, (req, res) => InventoryController.getAlerts(req, res));
router.get('/reports/valuation', authMiddleware, (req, res) => InventoryController.getValuation(req, res));
router.post('/purchase-orders', authMiddleware, (req, res) => InventoryController.createPurchaseOrder(req, res));
router.post('/purchase-orders/:id/approve', authMiddleware, (req, res) => InventoryController.approvePurchaseOrder(req, res));
router.post('/purchase-orders/:id/receive', authMiddleware, (req, res) => InventoryController.receiveInventory(req, res));

router.post('/', authMiddleware, (req, res) => InventoryController.create(req, res));
router.get('/:id', authMiddleware, (req, res) => InventoryController.getById(req, res));
router.put('/:id', authMiddleware, (req, res) => InventoryController.update(req, res));
router.delete('/:id', authMiddleware, (req, res) => InventoryController.delete(req, res));
router.post('/:id/adjust', authMiddleware, (req, res) => InventoryController.adjustStock(req, res));
router.get('/:id/history', authMiddleware, (req, res) => InventoryController.getHistory(req, res));

export default router;

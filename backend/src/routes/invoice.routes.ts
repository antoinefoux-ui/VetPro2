import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import InvoiceController from '../controllers/invoice.controller';

const router = Router();

// Public route for dashboard stats
router.get('/', (req, res) => InvoiceController.getAll(req, res));

// Protected routes
router.post('/', authMiddleware, (req, res) => InvoiceController.create(req, res));
router.get('/:id', authMiddleware, (req, res) => InvoiceController.getById(req, res));
router.put('/:id', authMiddleware, (req, res) => InvoiceController.update(req, res));
router.delete('/:id', authMiddleware, (req, res) => InvoiceController.delete(req, res));

export default router;

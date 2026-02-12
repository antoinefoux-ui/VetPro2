import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { InvoiceController } from '../controllers/invoice.controller';

const router = Router();

// Public route for dashboard stats
router.get('/', InvoiceController.getAll);

// Protected routes
router.post('/', authenticate, InvoiceController.create);
router.get('/:id', authenticate, InvoiceController.getById);
router.put('/:id', authenticate, InvoiceController.update);
router.delete('/:id', authenticate, InvoiceController.delete);

export default router;

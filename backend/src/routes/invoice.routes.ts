import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as invoiceController from '../controllers/invoice.controller';

const router = Router();

// Public route for dashboard stats
router.get('/', invoiceController.getAllInvoices); // Remove authenticate

// Protected routes
router.post('/', authenticate, invoiceController.createInvoice);
router.get('/:id', authenticate, invoiceController.getInvoiceById);
router.put('/:id', authenticate, invoiceController.updateInvoice);
router.delete('/:id', authenticate, invoiceController.deleteInvoice);

export default router;

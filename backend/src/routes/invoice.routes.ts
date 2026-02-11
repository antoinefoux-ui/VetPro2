import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';

const router = Router();

router.get('/', InvoiceController.getAll);
router.get('/:id', InvoiceController.getById);
router.post('/', InvoiceController.create);
router.post('/generate-from-voice', InvoiceController.generateFromVoice);
router.post('/:id/approve', InvoiceController.approve);
router.post('/:id/payments', InvoiceController.recordPayment);
router.get('/:id/pdf', InvoiceController.generatePDF);
router.post('/:id/send', InvoiceController.send);

export default router;

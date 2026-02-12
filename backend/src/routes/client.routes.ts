import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { ClientController } from '../controllers/client.controller';

const router = Router();

// Public route for dashboard stats
router.get('/', ClientController.getAll);

// Protected routes
router.post('/', authenticate, ClientController.create);
router.get('/:id', authenticate, ClientController.getById);
router.put('/:id', authenticate, ClientController.update);
router.delete('/:id', authenticate, ClientController.delete);
router.get('/:id/communications', authenticate, ClientController.getCommunications);
router.post('/:id/communications', authenticate, ClientController.sendCommunication);
router.get('/:id/statistics', authenticate, ClientController.getStatistics);
router.post('/merge', authenticate, ClientController.merge);
router.get('/:id/export', authenticate, ClientController.exportData);

export default router;

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import ClientController from '../controllers/client.controller';

const router = Router();

// Public route for dashboard stats
router.get('/', (req, res) => ClientController.getAll(req, res));

// Protected routes  
router.post('/', authenticate, (req, res) => ClientController.create(req, res));
router.get('/:id/communications', authenticate, (req, res) => ClientController.getCommunications(req, res));
router.post('/:id/communications', authenticate, (req, res) => ClientController.sendCommunication(req, res));
router.get('/:id/statistics', authenticate, (req, res) => ClientController.getStatistics(req, res));
router.get('/:id/export', authenticate, (req, res) => ClientController.exportData(req, res));
router.get('/:id', authenticate, (req, res) => ClientController.getById(req, res));
router.put('/:id', authenticate, (req, res) => ClientController.update(req, res));
router.delete('/:id', authenticate, (req, res) => ClientController.delete(req, res));
router.post('/merge', authenticate, (req, res) => ClientController.merge(req, res));

export default router;

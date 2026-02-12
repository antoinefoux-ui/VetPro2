import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import ClientController from '../controllers/client.controller';

const router = Router();

// Public route for dashboard stats
router.get('/', (req, res) => ClientController.getAll(req, res));

// Protected routes  
router.post('/', authMiddleware, (req, res) => ClientController.create(req, res));
router.get('/:id/communications', authMiddleware, (req, res) => ClientController.getCommunications(req, res));
router.post('/:id/communications', authMiddleware, (req, res) => ClientController.sendCommunication(req, res));
router.get('/:id/statistics', authMiddleware, (req, res) => ClientController.getStatistics(req, res));
router.get('/:id/export', authMiddleware, (req, res) => ClientController.exportData(req, res));
router.get('/:id', authMiddleware, (req, res) => ClientController.getById(req, res));
router.put('/:id', authMiddleware, (req, res) => ClientController.update(req, res));
router.delete('/:id', authMiddleware, (req, res) => ClientController.delete(req, res));
router.post('/merge', authMiddleware, (req, res) => ClientController.merge(req, res));

export default router;

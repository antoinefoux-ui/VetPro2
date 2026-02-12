import { Router } from 'express';
// import { authenticate } from '../middleware/auth.middleware'; // COMMENTED OUT
import ClientController from '../controllers/client.controller';

const router = Router();

// ALL PUBLIC for testing - NO AUTHENTICATE
router.get('/', (req, res) => ClientController.getAll(req, res));
router.post('/', (req, res) => ClientController.create(req, res));
router.get('/:id/communications', (req, res) => ClientController.getCommunications(req, res));
router.post('/:id/communications', (req, res) => ClientController.sendCommunication(req, res));
router.get('/:id/statistics', (req, res) => ClientController.getStatistics(req, res));
router.get('/:id/export', (req, res) => ClientController.exportData(req, res));
router.get('/:id', (req, res) => ClientController.getById(req, res));
router.put('/:id', (req, res) => ClientController.update(req, res));
router.delete('/:id', (req, res) => ClientController.delete(req, res));
router.post('/merge', (req, res) => ClientController.merge(req, res));

export default router;

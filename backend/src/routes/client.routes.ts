import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as clientController from '../controllers/client.controller';

const router = Router();

// Public route for dashboard stats
router.get('/', clientController.getAllClients); // Remove authenticate middleware

// Protected routes
router.post('/', authenticate, clientController.createClient);
router.get('/:id', authenticate, clientController.getClientById);
router.put('/:id', authenticate, clientController.updateClient);
router.delete('/:id', authenticate, clientController.deleteClient);

export default router;

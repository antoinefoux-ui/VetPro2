import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { AppointmentController } from '../controllers/appointment.controller';

const router = Router();

// Public route for dashboard stats
router.get('/', AppointmentController.getAll);

// Protected routes
router.post('/', authenticate, AppointmentController.create);
router.get('/:id', authenticate, AppointmentController.getById);
router.put('/:id', authenticate, AppointmentController.update);
router.delete('/:id', authenticate, AppointmentController.delete);

export default router;

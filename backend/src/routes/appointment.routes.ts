import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as appointmentController from '../controllers/appointment.controller';

const router = Router();

// Public route for dashboard stats
router.get('/', appointmentController.getAllAppointments); // Remove authenticate

// Protected routes
router.post('/', authenticate, appointmentController.createAppointment);
router.get('/:id', authenticate, appointmentController.getAppointmentById);
router.put('/:id', authenticate, appointmentController.updateAppointment);
router.delete('/:id', authenticate, appointmentController.deleteAppointment);

export default router;

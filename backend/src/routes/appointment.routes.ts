import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import AppointmentController from '../controllers/appointment.controller';

const router = Router();

// Public route for dashboard stats
router.get('/', (req, res) => AppointmentController.getAll(req, res));

// Protected routes
router.post('/', authMiddleware, (req, res) => AppointmentController.create(req, res));
router.get('/:id', authMiddleware, (req, res) => AppointmentController.getById(req, res));
router.put('/:id', authMiddleware, (req, res) => AppointmentController.update(req, res));
router.delete('/:id', authMiddleware, (req, res) => AppointmentController.delete(req, res));

export default router;

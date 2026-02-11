import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

// Placeholder routes - implement with controllers
router.get('/', (req, res) => res.json({ message: 'Get all clients' }));
router.get('/:id', (req, res) => res.json({ message: 'Get client by ID' }));
router.post('/', (req, res) => res.json({ message: 'Create client' }));
router.put('/:id', (req, res) => res.json({ message: 'Update client' }));
router.delete('/:id', (req, res) => res.json({ message: 'Delete client' }));

export default router;

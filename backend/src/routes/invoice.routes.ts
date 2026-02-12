import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => res.json({ message: 'Route working' }));

export default router;

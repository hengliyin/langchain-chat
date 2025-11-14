import express from 'express';
import chainRoutes from './chain.routes.js';
import chatRoutes from './chat.routes.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(rateLimiter);
router.use('/chain', chainRoutes);
router.use('/chat', chatRoutes);

export default router;

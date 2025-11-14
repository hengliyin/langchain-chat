import express from 'express';
import { processChain, extractTopic, streamChain } from '../controllers/chain.controller.js';
import { validateRequest } from '../middleware/validator.js';
import { chainProcessSchema, extractTopicSchema } from '../middleware/schemas.js';

const router = express.Router();

router.post('/process', validateRequest(chainProcessSchema), processChain);
router.post('/extract', validateRequest(extractTopicSchema), extractTopic);
router.post('/stream', validateRequest(chainProcessSchema), streamChain);

export default router;

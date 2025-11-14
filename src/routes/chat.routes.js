import express from 'express';
import { chat, streamChat } from '../controllers/chat.controller.js';
import { validateRequest } from '../middleware/validator.js';
import { chatSchema } from '../middleware/schemas.js';

const router = express.Router();

router.post('/', validateRequest(chatSchema), chat);
router.post('/stream', validateRequest(chatSchema), streamChat);

export default router;

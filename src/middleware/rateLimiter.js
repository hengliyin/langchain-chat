import rateLimit from 'express-rate-limit';
import { RATE_LIMIT } from '../config/app.config.js';

export const rateLimiter = rateLimit({
  windowMs: RATE_LIMIT.windowMs,
  max: RATE_LIMIT.max,
  message: { success: false, message: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

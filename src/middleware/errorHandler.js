import logger from '../utils/logger.js';
import { NODE_ENV } from '../config/app.config.js';

export const errorHandler = (err, req, res, next) => {
  logger.error('Error', { error: err.message, stack: err.stack });
  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    message: err.message || 'Internal Server Error',
    ...(NODE_ENV === 'development' && { stack: err.stack })
  };
  res.status(statusCode).json(response);
};

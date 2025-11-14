import app from './src/app.js';
import { PORT, NODE_ENV } from './src/config/app.config.js';
import logger from './src/utils/logger.js';

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
  logger.info(`📡 API endpoint: http://localhost:${PORT}/api`);
  logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
  logger.info(`🎨 Test page: http://localhost:${PORT}/test-stream.html`);
});

process.on('SIGTERM', () => {
  logger.info('⚠️  SIGTERM signal received');
  server.close(() => {
    logger.info('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('⚠️  SIGINT signal received');
  server.close(() => {
    logger.info('✅ HTTP server closed');
    process.exit(0);
  });
});

// Load environment variables FIRST before importing app
const env = require('./config/env');
const app = require('./app');
const logger = require('./utils/logger');

const PORT = env.PORT;

async function startServer() {
  try {
    // Auto-initialize SQLite schema if not using PostgreSQL
    if (!process.env.DATABASE_URL) {
      logger.info('Initializing SQLite schema...');
      const { initSQLiteSchema } = require('./config/init-sqlite');
      await initSQLiteSchema();
      logger.info('SQLite schema initialized successfully');
    }
  } catch (error) {
    logger.error('Error initializing SQLite schema:', error);
    // Don't crash - server can still run, just OAuth might fail if tables missing
  }

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
  });
}

startServer();

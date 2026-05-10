// Load environment variables FIRST
const env = require('./config/env');
const logger = require('./utils/logger');
const fs = require('fs');
const path = require('path');

async function runAutoMigrations() {
  const { query } = require('./config/database');
  const migrationsDir = __dirname + '/migrations';
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      await query(sql);
      logger.info(`Migration ${file} completed`);
    } catch (err) {
      logger.warn(`Migration ${file} skipped (may already exist): ${err.message}`);
    }
  }
}

async function startServer() {
  await runAutoMigrations();

  // Now load app (passport/AuthService will find the tables)
  const app = require('./app');
  const PORT = env.PORT;

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
  });
}

startServer();
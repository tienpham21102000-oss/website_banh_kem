require('dotenv').config({ path: 'backend/.env' });
const { query } = require('./backend/src/config/database');
const logger = require('./backend/src/utils/logger');

async function migrate() {
  try {
    logger.info('Adding meta column to users table...');
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT \'{}\';');
    logger.info('Migration successful!');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();

// Load environment variables FIRST
const env = require('./config/env');
const logger = require('./utils/logger');

async function startServer() {
  try {
    // Ensure oauth_accounts table exists BEFORE passport/AuthService is loaded
    const { query } = require('./config/database');
    await query(`
      CREATE TABLE IF NOT EXISTS oauth_accounts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        provider VARCHAR(50) NOT NULL,
        provider_user_id VARCHAR(255) NOT NULL,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (provider, provider_user_id),
        UNIQUE (provider, user_id)
      )
    `);
    logger.info('Ensured oauth_accounts table exists');
  } catch (error) {
    logger.debug('oauth_accounts table check: ' + error.message);
  }

  // Now load app (passport/AuthService will find the table)
  const app = require('./app');
  const PORT = env.PORT;

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
  });
}

startServer();
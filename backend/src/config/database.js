const { Pool } = require('pg');
const logger = require('../utils/logger');

// Require PostgreSQL connection string
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  logger.error('DATABASE_URL is required. Set DATABASE_URL environment variable for PostgreSQL connection.');
  process.exit(1);
}

logger.info('Using PostgreSQL for database connection');
const pgPool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

const query = (text, params = []) => {
  return pgPool.query(text, params);
};

module.exports = {
  query,
  connect: async () => pgPool.connect(),
  end: () => pgPool.end(),
};
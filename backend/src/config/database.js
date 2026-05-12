const { Pool } = require('pg');
const logger = require('../utils/logger');

const databaseUrl = process.env.DATABASE_URL;

let pgPool = null;

if (databaseUrl) {
  logger.info('Using PostgreSQL for database connection');
  // Only use SSL when DATABASE_URL contains 'sslmode=require' or in production
  const useSSL = process.env.NODE_ENV === 'production' || process.env.PGSSLMODE === 'require';
  pgPool = new Pool({
    connectionString: databaseUrl,
    ssl: useSSL ? { rejectUnauthorized: false } : false,
  });
} else {
  logger.warn('DATABASE_URL not set. Database queries will throw an error until configured.');
}

const query = async (text, params = []) => {
  if (!pgPool) {
    throw new Error('DATABASE_URL not configured. Please set the DATABASE_URL environment variable.');
  }
  return pgPool.query(text, params);
};

module.exports = {
  query,
  connect: async () => {
    if (!pgPool) throw new Error('DATABASE_URL not configured.');
    return pgPool.connect();
  },
  end: async () => {
    if (pgPool) await pgPool.end();
  },
};

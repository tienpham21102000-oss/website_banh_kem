const pool = require('./database');
const logger = require('../utils/logger');

async function addMissingTables() {
  try {
    logger.info('Adding missing tables for SQLite...');

    // 7. Blackout Dates
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blackout_dates (
        id TEXT PRIMARY KEY,
        date_start DATETIME NOT NULL,
        date_end DATETIME NOT NULL,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 8. Coupons
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        discount_type TEXT NOT NULL,
        discount_value DECIMAL(12, 2) NOT NULL,
        max_uses INTEGER,
        usage_count INTEGER DEFAULT 0,
        min_order_amount DECIMAL(12, 2),
        valid_from DATETIME NOT NULL,
        valid_until DATETIME NOT NULL,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 9. Coupon Usages
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coupon_usages (
        id TEXT PRIMARY KEY,
        coupon_id TEXT REFERENCES coupons(id) ON DELETE CASCADE,
        order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
        applied_discount DECIMAL(12, 2),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    logger.info('Missing tables added!');
  } catch (error) {
    logger.error('Failed to add missing tables:', error);
  }
}

addMissingTables();

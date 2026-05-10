const { Pool } = require('pg');
const path = require('path');
const logger = require('../utils/logger');

// Database configuration
const isProduction = !!process.env.DATABASE_URL;
let pgPool;
let sqliteDb;

if (isProduction) {
  logger.info('Using PostgreSQL for database connection');
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  // IMPORTANT: Lazy-require sqlite3 only in dev/local mode.
  // On some Linux environments (e.g. Render) loading sqlite3 native bindings can fail
  // due to GLIBC version mismatches. We avoid loading it when DATABASE_URL is provided.
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.resolve(__dirname, '../../database.sqlite');
  logger.info('Using SQLite database at: ' + dbPath);
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) logger.error('Could not connect to SQLite database', err);
    else sqliteDb.run('PRAGMA foreign_keys = ON');
  });
}

// Wrapper to mimic pg.Pool.query for both databases
const query = (text, params = []) => {
  if (isProduction) {
    // Standard PostgreSQL query
    return pgPool.query(text, params);
  } else {
    // SQLite version of the query
    let sqliteQuery = text.replace(/\$(\d+)/g, '?').replace(/ILIKE/gi, 'LIKE');
    
    // Handle PostgreSQL ON CONFLICT for SQLite
    // Convert: INSERT ... ON CONFLICT (...) DO NOTHING
    // To: INSERT OR IGNORE ...
    sqliteQuery = sqliteQuery.replace(/ON\s+CONFLICT\s*\([^)]*\)\s+DO\s+NOTHING/gi, 'OR IGNORE');
    
    return new Promise((resolve, reject) => {
      const trimmedQuery = sqliteQuery.trim().toLowerCase();
      if (trimmedQuery.startsWith('select')) {
        sqliteDb.all(sqliteQuery, params, (err, rows) => {
          if (err) reject(err);
          else resolve({ rows });
        });
      } else {
        // Handle INSERT/UPDATE/DELETE with optional RETURNING
        if (sqliteQuery.toLowerCase().includes('returning')) {
          sqliteDb.all(sqliteQuery, params, (err, rows) => {
            if (err) {
              const fallbackQuery = sqliteQuery.split(/returning/i)[0];
              sqliteDb.run(fallbackQuery, params, function(err2) {
                if (err2) reject(err2);
                else resolve({ rows: [], lastId: this.lastID, changes: this.changes });
              });
            } else resolve({ rows });
          });
        } else {
          sqliteDb.run(sqliteQuery, params, function(err) {
            if (err) reject(err);
            else resolve({ rows: [], lastId: this.lastID, changes: this.changes });
          });
        }
      }
    });
  }
};

module.exports = {
  query,
  connect: async () => {
    if (isProduction) return pgPool.connect();
    return { query, release: () => {} };
  },
  end: () => isProduction ? pgPool.end() : new Promise((resolve) => sqliteDb.close(resolve)),
};

// Migration helper - runs SQL migrations on startup
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function migrate() {
  try {
    console.log('Starting database migrations...');
    
    const migrationsDir = path.join(__dirname);
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await pool.query(sql);
      console.log(`✓ Migration ${file} completed`);
    }

    console.log('✓ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  migrate();
}

module.exports = { migrate };

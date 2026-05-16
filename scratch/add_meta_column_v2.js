const { Pool } = require('pg');

const databaseUrl = 'postgresql://banh_kem_db_user:QuchNL3bzDXH6JT9Gtt1Qp9Jy81oYNTf@dpg-d805qi6gvqtc73d7ppk0-a.singapore-postgres.render.com/banh_kem_db';

async function migrate() {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Adding meta column to users table...');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT \'{}\';');
    console.log('Migration successful!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();

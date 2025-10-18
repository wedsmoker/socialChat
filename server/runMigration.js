// Migration runner for Phase 1
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting Phase 1 migration...');

    const migrationPath = path.join(__dirname, 'migrations', 'phase1_migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the entire migration in a single transaction
    await client.query('BEGIN');
    console.log('Executing migration SQL...');
    await client.query(migrationSQL);
    await client.query('COMMIT');

    console.log('✅ Phase 1 migration completed successfully!');
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

runMigration();

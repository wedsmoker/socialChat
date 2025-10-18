// Migration runner for friend display order
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting friend display order migration...');

    const migrationPath = path.join(__dirname, 'migrations', 'add_friend_display_order.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the entire migration in a single transaction
    await client.query('BEGIN');
    console.log('Executing migration SQL...');
    await client.query(migrationSQL);
    await client.query('COMMIT');

    console.log('✅ Friend display order migration completed successfully!');
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

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// PostgreSQL connection pool - supports both connection string and individual params
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      database: process.env.PGDATABASE || 'socialchat',
      user: process.env.PGUSER || 'postgres',
      password: String(process.env.PGPASSWORD || ''),
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };

const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to execute queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Initialize database with schema
const initDatabase = async () => {
  const fs = require('fs');
  const path = require('path');

  try {
    // Run main schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('Database schema initialized successfully');

    // Run moderation migration
    const migrationPath = path.join(__dirname, 'migrations', 'add_moderation.sql');
    if (fs.existsSync(migrationPath)) {
      const migration = fs.readFileSync(migrationPath, 'utf8');
      await pool.query(migration);
      console.log('Moderation features migrated successfully');
    }

    // Run Phase 0 features migration (visibility, audio, tags)
    const phase0MigrationPath = path.join(__dirname, 'migrations', 'add_phase0_features.sql');
    if (fs.existsSync(phase0MigrationPath)) {
      const phase0Migration = fs.readFileSync(phase0MigrationPath, 'utf8');
      await pool.query(phase0Migration);
      console.log('Phase 0 features migrated successfully (visibility, audio, tags)');
    }

    // Run Phase 1 migration (friends, comments, collections, guest support)
    const phase1MigrationPath = path.join(__dirname, 'migrations', 'phase1_migration.sql');
    if (fs.existsSync(phase1MigrationPath)) {
      const phase1Migration = fs.readFileSync(phase1MigrationPath, 'utf8');
      await pool.query(phase1Migration);
      console.log('Phase 1 features migrated successfully (friends, comments, collections, guests)');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

module.exports = {
  query,
  pool,
  initDatabase
};

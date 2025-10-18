const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

console.log('Environment variables:');
console.log('PGHOST:', process.env.PGHOST);
console.log('PGPORT:', process.env.PGPORT);
console.log('PGDATABASE:', process.env.PGDATABASE);
console.log('PGUSER:', process.env.PGUSER);
console.log('PGPASSWORD:', process.env.PGPASSWORD);
console.log('PGPASSWORD type:', typeof process.env.PGPASSWORD);
console.log('PGPASSWORD length:', process.env.PGPASSWORD ? process.env.PGPASSWORD.length : 'undefined');

const poolConfig = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'socialchat',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
};

console.log('\nPool config:');
console.log(JSON.stringify(poolConfig, null, 2));

const pool = new Pool(poolConfig);

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('\n✅ Connection successful!');
    console.log('Current time:', result.rows[0].now);
    await pool.end();
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    await pool.end();
  }
}

testConnection();

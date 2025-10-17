// Script to make a user an admin
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function makeAdmin(username) {
  try {
    const result = await pool.query(
      'UPDATE users SET is_admin = TRUE WHERE username = $1 RETURNING id, username, is_admin',
      [username]
    );

    if (result.rows.length === 0) {
      console.log(`User '${username}' not found.`);
    } else {
      console.log(`User '${username}' is now an admin!`);
      console.log(result.rows[0]);
    }
  } catch (error) {
    console.error('Error making user admin:', error);
  } finally {
    await pool.end();
  }
}

// Get username from command line argument
const username = process.argv[2] || 'admin';
makeAdmin(username);

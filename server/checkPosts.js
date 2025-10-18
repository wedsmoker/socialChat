const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { query } = require('./db');

async function checkPosts() {
  try {
    const result = await query('SELECT id, user_id, content, visibility, deleted_by_mod FROM posts ORDER BY created_at DESC');

    console.log('Total posts:', result.rows.length);
    console.log('\nPost details:');
    result.rows.forEach(post => {
      console.log(`\nID: ${post.id}`);
      console.log(`User ID: ${post.user_id}`);
      console.log(`Content: ${post.content.substring(0, 50)}...`);
      console.log(`Visibility: ${post.visibility}`);
      console.log(`Deleted by mod: ${post.deleted_by_mod}`);
    });

    // Check if users are banned
    const userCheck = await query('SELECT id, username, is_banned FROM users');
    console.log('\n\nUser ban status:');
    userCheck.rows.forEach(user => {
      console.log(`${user.username} (ID: ${user.id}): ${user.is_banned ? 'BANNED' : 'Active'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPosts();

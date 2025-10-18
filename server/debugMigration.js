const fs = require('fs');
const path = require('path');

const migrationPath = path.join(__dirname, 'migrations', 'phase1_migration.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`Total statements: ${statements.length}\n`);

statements.forEach((stmt, idx) => {
  console.log(`\n=== Statement ${idx + 1} ===`);
  console.log(stmt.substring(0, 200));
  if (stmt.includes('friendships')) {
    console.log('^^^ FRIENDSHIPS STATEMENT ^^^');
    console.log(stmt);
  }
});

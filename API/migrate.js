// API/migrate.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./db');

(async () => {
  const file = path.join(__dirname, 'sql', '001_init.sql');
  const sql = fs.readFileSync(file, 'utf8');

  // Split on semicolons at end-of-line to avoid enabling multipleStatements
  const statements = sql
    .split(/;\s*$/m)      // split by ; at line end
    .map(s => s.trim())
    .filter(s => s.length);

  const conn = await db.getConnection();
  try {
    for (const s of statements) {
      await conn.query(s);
    }
    console.log('✅ Migration applied');
  } catch (e) {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  } finally {
    conn.release();
    db.end && db.end(); // harmless if not present
  }
})();

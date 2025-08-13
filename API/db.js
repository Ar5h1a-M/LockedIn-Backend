const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Collect all .pem files from ./certs
const certsDir = path.join(__dirname, 'certs');
let caBundle = '';
try {
  const files = fs.readdirSync(certsDir).filter(f => f.toLowerCase().endsWith('.pem'));
  if (files.length === 0) {
    console.warn('[db] No .pem files found in ./certs. TLS will likely fail.');
  } else {
    caBundle = files
      .map(f => {
        const full = path.join(certsDir, f);
        const pem = fs.readFileSync(full, 'utf8');
        console.log('[db] Loaded CA:', f);
        return pem;
      })
      .join('\n');
  }
} catch (e) {
  console.warn('[db] Could not read ./certs folder:', e.message);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,                // e.g. lockedin-mysql.mysql.database.azure.com
  user: process.env.DB_USER,                // e.g. DB2542915@lockedin-mysql
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,            // e.g. lockedindb
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_INSECURE_SSL === 'true'
    ? { rejectUnauthorized: false }        // DEV ONLY: set DB_INSECURE_SSL=true to bypass (temporarily)
    : {
        minVersion: 'TLSv1.2',
        ca: caBundle,                       // one or multiple PEMs concatenated
        rejectUnauthorized: true
      }
});

module.exports = pool;
require('dotenv').config();
const db = require('./db');
const app = require('./app');

(async () => {
  try {
    const [rows] = await db.query('SELECT NOW() AS currentTime');
    console.log('Database connection OK:', rows[0].currentTime);
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }

  const port = process.env.PORT || 3000;   // HTTP port, not 3306
  app.listen(port, () => console.log(`API listening on ${port}`));
})();

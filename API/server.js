const db = require("./db");

(async () => {
  try {
    const [rows] = await db.query('SELECT NOW() AS currentTime');
    console.log('Database connected! Time:', rows[0].currentTime);
  } catch (err) {
    console.error('Database connection failed:', err);
  }
})();

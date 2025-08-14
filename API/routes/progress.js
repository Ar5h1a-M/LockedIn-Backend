const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/topics', async (req, res) => {
  const { title, description } = req.body || {};
  const [r] = await db.query(
    `INSERT INTO topics (title, description, created_by) VALUES (?,?,?)`,
    [title, description, req.user.uid]
  );
  res.json({ id: r.insertId });
});

router.post('/chapters', async (req, res) => {
  const { topic_id, title, order_index = 0 } = req.body || {};
  const [r] = await db.query(
    `INSERT INTO chapters (topic_id, title, order_index) VALUES (?,?,?)`,
    [topic_id, title, order_index]
  );
  res.json({ id: r.insertId });
});

router.put('/', async (req, res) => {
  const { chapter_id, status, hours } = req.body || {};
  await db.query(
    `INSERT INTO progress (user_id, chapter_id, status, hours)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE status=VALUES(status), hours=VALUES(hours)`,
    [req.user.uid, chapter_id, status, hours]
  );
  res.json({ ok: true });
});

router.get('/mine', async (req, res) => {
  const [rows] = await db.query(
    `SELECT p.chapter_id, p.status, p.hours, c.title AS chapter_title, t.title AS topic_title
       FROM progress p
       JOIN chapters c ON c.id = p.chapter_id
       JOIN topics t   ON t.id = c.topic_id
      WHERE p.user_id = ?`,
    [req.user.uid]
  );
  res.json(rows);
});

module.exports = router;

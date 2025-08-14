const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', async (req, res) => {
  const { type, payload, scheduled_at } = req.body || {};
  const [r] = await db.query(
    `INSERT INTO notifications (user_id, type, payload, scheduled_at)
     VALUES (?, ?, ?, ?)`,
    [req.user.uid, type, JSON.stringify(payload || {}), scheduled_at || null]
  );
  res.json({ id: r.insertId });
});

router.get('/mine', async (req, res) => {
  const [rows] = await db.query(
    `SELECT id, type, payload, is_read, scheduled_at, created_at
       FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC`,
    [req.user.uid]
  );
  res.json(rows);
});

router.put('/:id/read', async (req, res) => {
  await db.query(`UPDATE notifications SET is_read=TRUE WHERE id=? AND user_id=?`, [req.params.id, req.user.uid]);
  res.json({ ok: true });
});

module.exports = router;

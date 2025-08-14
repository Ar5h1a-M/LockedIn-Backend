const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/me', async (req, res) => {
  const [rows] = await db.query(
    `SELECT id, email, name, avatar_url, course, year_of_study, university, bio
     FROM users WHERE id = ?`,
    [req.user.uid]
  );
  res.json(rows[0] || null);
});

router.put('/me', async (req, res) => {
  const { name, university, course, year_of_study, bio, avatar_url } = req.body || {};
  await db.query(
    `UPDATE users SET name=?, university=?, course=?, year_of_study=?, bio=?, avatar_url=? WHERE id=?`,
    [name, university, course, year_of_study, bio, avatar_url, req.user.uid]
  );
  res.json({ ok: true });
});

router.get('/partners', async (req, res) => {
  const { course, year } = req.query;
  const [rows] = await db.query(
    `SELECT id, name, avatar_url, course, year_of_study, university, bio
       FROM users
      WHERE id <> ?
        AND (? IS NULL OR course = ?)
        AND (? IS NULL OR year_of_study = ?)
      LIMIT 50`,
    [req.user.uid, course || null, course || null, year || null, year || null]
  );
  res.json(rows);
});

module.exports = router;

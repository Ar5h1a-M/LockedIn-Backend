const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', async (req, res) => {
  const { name, description } = req.body || {};
  const [r] = await db.query(
    `INSERT INTO study_groups (name, description, created_by) VALUES (?,?,?)`,
    [name, description, req.user.uid]
  );
  await db.query(
    `INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'owner')`,
    [r.insertId, req.user.uid]
  );
  res.json({ id: r.insertId });
});

router.get('/mine', async (req, res) => {
  const [rows] = await db.query(
    `SELECT g.id, g.name, g.description, g.created_at, m.role
       FROM study_groups g
       JOIN group_members m ON m.group_id = g.id
      WHERE m.user_id = ?
      ORDER BY g.created_at DESC`,
    [req.user.uid]
  );
  res.json(rows);
});

router.post('/:groupId/members', async (req, res) => {
  const gid = req.params.groupId;
  await db.query(
    `INSERT IGNORE INTO group_members (group_id, user_id, role) VALUES (?, ?, 'member')`,
    [gid, req.user.uid]
  );
  res.json({ ok: true });
});

router.post('/:groupId/sessions', async (req, res) => {
  const gid = req.params.groupId;
  const { start_time, end_time, location, agenda } = req.body || {};
  const [r] = await db.query(
    `INSERT INTO study_sessions (group_id, start_time, end_time, location, agenda)
     VALUES (?, ?, ?, ?, ?)`,
    [gid, start_time, end_time, location, agenda]
  );
  res.json({ id: r.insertId });
});

router.get('/:groupId/sessions', async (req, res) => {
  const gid = req.params.groupId;
  const [rows] = await db.query(
    `SELECT id, start_time, end_time, location, agenda, created_at
       FROM study_sessions
      WHERE group_id = ?
      ORDER BY start_time`,
    [gid]
  );
  res.json(rows);
});

module.exports = router;

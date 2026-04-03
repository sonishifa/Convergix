const { Router } = require('express');
const { pool }   = require('../db/pool');

const router = Router();

// Wraps async route handlers so unhandled rejections go to Express error handler
// instead of crashing the process (required in Express 5)
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

router.get('/', wrap(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, title, created_at, updated_at FROM documents ORDER BY updated_at DESC'
  );
  res.json(rows);
}));

router.post('/', wrap(async (req, res) => {
  const { title = 'Untitled' } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO documents (title) VALUES ($1) RETURNING *',
    [title.trim().slice(0, 200)]
  );
  res.status(201).json(rows[0]);
}));

module.exports = router;
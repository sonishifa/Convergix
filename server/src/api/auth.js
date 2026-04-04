const { Router } = require('express');
const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcrypt');
const { pool }   = require('../db/pool');
const { USER_COLORS } = require('../constants/colors');

const router = Router();
const wrap   = fn => (req, res, next) => fn(req, res, next).catch(next);

// Existing endpoint for backward compatibility / anonymous join if needed
router.post('/token', (req, res) => {
  const { name, color } = req.body ?? {};

  if (!name?.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }

  const safeColor = USER_COLORS.includes(color) ? color : USER_COLORS[0];

  const payload = {
    sub:   require('crypto').randomUUID(),
    name:  name.trim().slice(0, 50),
    color: safeColor,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: payload });
});

router.post('/register', wrap(async (req, res) => {
  const { name, email, password, color } = req.body ?? {};

  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const safeColor = USER_COLORS.includes(color) ? color : USER_COLORS[0];
  const emailLower = email.trim().toLowerCase();

  const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [emailLower]);
  if (existing.length > 0) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const hash = await bcrypt.hash(password, 10);

  const { rows } = await pool.query(
    'INSERT INTO users (name, email, password_hash, color) VALUES ($1, $2, $3, $4) RETURNING id, name, email, color',
    [name.trim().slice(0, 50), emailLower, hash, safeColor]
  );

  const user = rows[0];
  const payload = { sub: user.id, name: user.name, color: user.color };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

  res.status(201).json({ token, user: payload });
}));

router.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email?.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const emailLower = email.trim().toLowerCase();
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [emailLower]);

  if (rows.length === 0) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const payload = { sub: user.id, name: user.name, color: user.color };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

  res.json({ token, user: payload });
}));

module.exports = router;
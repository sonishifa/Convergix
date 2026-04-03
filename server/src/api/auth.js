const { Router } = require('express');
const jwt        = require('jsonwebtoken');
const crypto     = require('crypto');
const { USER_COLORS } = require('../constants/colors');

const router = Router();

router.post('/token', (req, res) => {
  const { name, color } = req.body ?? {};

  if (!name?.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }

  // Reject any color not in the allowlist — prevents CSS injection
  const safeColor = USER_COLORS.includes(color) ? color : USER_COLORS[0];

  const payload = {
    sub:   crypto.randomUUID(),
    name:  name.trim().slice(0, 50),
    color: safeColor,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: payload });
});

module.exports = router;
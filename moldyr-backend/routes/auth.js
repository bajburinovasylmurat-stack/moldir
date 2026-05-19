const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');
const router = express.Router();

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Құпия сөз енгізіңіз' });
  const hash = db.getSetting('admin_password_hash');
  if (!hash || !bcrypt.compareSync(password, hash))
    return res.status(401).json({ error: 'Қате құпия сөз' });
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

router.post('/change-password', requireAuth, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4)
    return res.status(400).json({ error: 'Құпия сөз тым қысқа (4+ таңба)' });
  db.setSetting('admin_password_hash', bcrypt.hashSync(newPassword, 10));
  res.json({ ok: true });
});

module.exports = router;

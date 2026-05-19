const express = require('express');
const db = require('../database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/public', (req, res) => {
  const s = db.getSettings();
  res.json({ whatsapp: s.whatsapp, kaspi_link: s.kaspi_link });
});
router.get('/', requireAuth, (req, res) => {
  const s = db.getSettings();
  const { admin_password_hash, ...safe } = s;
  res.json(safe);
});
router.put('/', requireAuth, (req, res) => {
  db.updateSettings(req.body);
  const { admin_password_hash, ...safe } = db.getSettings();
  res.json(safe);
});

module.exports = router;

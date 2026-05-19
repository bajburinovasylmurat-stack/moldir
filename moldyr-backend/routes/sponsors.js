const express = require('express');
const db = require('../database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/', (req, res) => res.json(db.getSponsors()));
router.post('/', requireAuth, (req, res) => {
  if (!req.body.name) return res.status(400).json({ error: 'name міндетті' });
  res.status(201).json(db.createSponsor(req.body));
});
router.put('/:id', requireAuth, (req, res) => {
  if (!db.getSponsorById(req.params.id)) return res.status(404).json({ error: 'Табылмады' });
  res.json(db.updateSponsor(req.params.id, req.body));
});
router.delete('/:id', requireAuth, (req, res) => {
  if (!db.deleteSponsor(req.params.id)) return res.status(404).json({ error: 'Табылмады' });
  res.json({ ok: true });
});

module.exports = router;

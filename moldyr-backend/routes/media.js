const express = require('express');
const db = require('../database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/', (req, res) => res.json(db.getMedia()));
router.post('/', requireAuth, (req, res) => {
  if (!['photo','video'].includes(req.body.type))
    return res.status(400).json({ error: 'type "photo" немесе "video"' });
  res.status(201).json(db.createMedia(req.body));
});
router.put('/:id', requireAuth, (req, res) => {
  if (!db.getMediaById(req.params.id)) return res.status(404).json({ error: 'Табылмады' });
  res.json(db.updateMedia(req.params.id, req.body));
});
router.delete('/:id', requireAuth, (req, res) => {
  if (!db.deleteMedia(req.params.id)) return res.status(404).json({ error: 'Табылмады' });
  res.json({ ok: true });
});

module.exports = router;

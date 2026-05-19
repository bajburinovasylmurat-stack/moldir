const express = require('express');
const db = require('../database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/', (req, res) => res.json(db.getEvents()));
router.get('/today', (req, res) => res.json(db.getTodayEvent()));
router.get('/voting', (req, res) => res.json(db.getVotingEvent()));
router.get('/:id', (req, res) => {
  const ev = db.getEventById(req.params.id);
  if (!ev) return res.status(404).json({ error: 'Табылмады' });
  res.json(ev);
});
router.post('/', requireAuth, (req, res) => {
  const { date, region1, region2 } = req.body;
  if (!date || !region1 || !region2)
    return res.status(400).json({ error: 'date, region1, region2 міндетті' });
  res.status(201).json(db.createEvent(req.body));
});
router.put('/:id', requireAuth, (req, res) => {
  if (!db.getEventById(req.params.id)) return res.status(404).json({ error: 'Табылмады' });
  res.json(db.updateEvent(req.params.id, req.body));
});
router.patch('/:id/tickets', requireAuth, (req, res) => {
  const { delta } = req.body;
  if (typeof delta !== 'number') return res.status(400).json({ error: 'delta (сан) міндетті' });
  const val = db.changeTickets(req.params.id, delta);
  if (val === null) return res.status(404).json({ error: 'Табылмады' });
  res.json({ remainingTickets: val });
});
router.delete('/:id', requireAuth, (req, res) => {
  if (!db.deleteEvent(req.params.id)) return res.status(404).json({ error: 'Табылмады' });
  res.json({ ok: true });
});

module.exports = router;

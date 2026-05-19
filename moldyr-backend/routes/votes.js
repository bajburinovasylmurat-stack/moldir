const express = require('express');
const db = require('../database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.post('/', (req, res) => {
  const { eventId, regionChoice, token } = req.body;
  if (!eventId || ![1,2].includes(regionChoice) || !token)
    return res.status(400).json({ error: 'eventId, regionChoice (1|2), token міндетті' });

  const ev = db.getEventById(eventId);
  if (!ev || !ev.active) return res.status(404).json({ error: 'Айтыс табылмады' });
  if (!ev.votingOpen) return res.status(400).json({ error: 'Бұл айтысқа дауыс беру әлі басталған жоқ' });

  if (db.tokenExists(token)) return res.status(409).json({ error: 'Бұл токен бойынша дауыс берілген' });

  res.status(201).json(db.createVote(eventId, regionChoice, token));
});

router.get('/', requireAuth, (req, res) => res.json(db.getAllVotesSummary()));

router.get('/:eventId', (req, res) => {
  const ev = db.getEventById(req.params.eventId);
  if (!ev) return res.status(404).json({ error: 'Табылмады' });
  const votes = db.getVotesByEvent(ev.id);
  res.json({
    eventId: ev.id, region1: ev.region1, region2: ev.region2,
    r1Count: votes.filter(v=>v.regionChoice===1).length,
    r2Count: votes.filter(v=>v.regionChoice===2).length,
    total: votes.length,
    votes: votes.map(v=>({ id:v.id, regionChoice:v.regionChoice, createdAt:v.createdAt })),
  });
});

router.delete('/:eventId', requireAuth, (req, res) => {
  db.deleteVotesByEvent(req.params.eventId);
  res.json({ ok: true });
});

module.exports = router;

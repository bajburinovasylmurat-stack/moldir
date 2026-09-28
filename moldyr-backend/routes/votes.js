const express = require('express');
const db = require('../database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.post('/', (req, res) => {
  const { eventId, regionChoice, token } = req.body;
  if (!eventId || ![1,2,3].includes(regionChoice) || !token)
    return res.status(400).json({ error: 'eventId, regionChoice (1|2|3), token міндетті' });

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
  const off = ev.voteOffsets || { r1: 0, r2: 0, r3: 0 };
  const r1 = votes.filter(v=>v.regionChoice===1).length + (off.r1||0);
  const r2 = votes.filter(v=>v.regionChoice===2).length + (off.r2||0);
  const r3 = votes.filter(v=>v.regionChoice===3).length + (off.r3||0);
  res.json({
    eventId: ev.id, region1: ev.region1, region2: ev.region2, region3: ev.region3,
    r1Count: r1, r2Count: r2, r3Count: r3, total: r1+r2+r3,
    votes: votes.map(v=>({ id:v.id, regionChoice:v.regionChoice, createdAt:v.createdAt })),
  });
});

router.patch('/:eventId/adjust', requireAuth, (req, res) => {
  const { region, delta } = req.body;
  if (!['r1','r2','r3'].includes(region) || typeof delta !== 'number')
    return res.status(400).json({ error: 'region (r1|r2|r3) және delta міндетті' });
  const result = db.adjustVoteOffset(req.params.eventId, region, delta);
  if (!result) return res.status(404).json({ error: 'Табылмады' });
  res.json({ ok: true, voteOffsets: result });
});

router.delete('/:eventId', requireAuth, (req, res) => {
  db.deleteVotesByEvent(req.params.eventId);
  db.resetVoteOffsets(req.params.eventId);
  res.json({ ok: true });
});

module.exports = router;

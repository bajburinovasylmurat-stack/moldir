/**
 * database.js — JSON файлдық дерекқор (lowdb)
 * Барлық деректер moldyr.json файлына сақталады.
 */
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const bcrypt = require('bcryptjs');
const path = require('path');
const { v4: uuid } = require('./utils');

const DB_FILE = process.env.DB_PATH || path.join(__dirname, 'moldyr.json');

let _db;

function getDb() {
  if (_db) return _db;
  const adapter = new FileSync(DB_FILE);
  _db = low(adapter);
  _db.defaults({
    events:   [],
    votes:    [],
    media:    [],
    sponsors: [],
    settings: {
      admin_password_hash: bcrypt.hashSync('admin2024', 10),
      whatsapp:            '+77016202086',
      kaspi_link:          'https://kaspi.kz/pay',
      kaspi_merchant:      '',
    },
  }).write();
  if(process.env.ADMIN_PASSWORD){
    _db.set('settings.admin_password_hash', bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10)).write();
  }
  return _db;
}

// ─── Events ──────────────────────────────────────────────────
function getEvents() {
  return getDb().get('events').sortBy('date').value();
}
function getEventById(id) {
  return getDb().get('events').find({ id }).value();
}
function getTodayEvent() {
  const today = new Date().toISOString().slice(0, 10);
  return getDb().get('events').find(e => e.date === today && e.active).value() || null;
}
function getVotingEvent() {
  return getDb().get('events').find(e => e.active && e.votingOpen).value() || null;
}
function createEvent(data) {
  const ev = {
    id: uuid(), date: data.date, time: data.time || '19:00',
    region1: data.region1 || '', region2: data.region2 || '',
    poetsInfo: data.poetsInfo || '',
    guest: data.guest || null,
    poster: data.poster || null, ticketPrice: data.ticketPrice || 3000,
    totalTickets: data.totalTickets || 100,
    remainingTickets: data.remainingTickets ?? data.totalTickets ?? 100,
    kaspiLink: data.kaspiLink || null,
    kaspiLink1: data.kaspiLink1 || null,
    kaspiLink2: data.kaspiLink2 || null,
    tablePrices: data.tablePrices || defaultTablePrices(),
    votingOpen: data.votingOpen === true,
    active: data.active !== false, createdAt: new Date().toISOString(),
  };
  getDb().get('events').push(ev).write();
  return ev;
}
function updateEvent(id, data) {
  getDb().get('events').find({ id }).assign(data).write();
  return getEventById(id);
}
function deleteEvent(id) {
  if (!getEventById(id)) return false;
  getDb().get('events').remove({ id }).write();
  getDb().get('votes').remove({ eventId: id }).write();
  return true;
}
function changeTickets(id, delta) {
  const ev = getEventById(id);
  if (!ev) return null;
  const val = Math.max(0, Math.min(ev.totalTickets, ev.remainingTickets + delta));
  getDb().get('events').find({ id }).assign({ remainingTickets: val }).write();
  return val;
}

// ─── Vote Adjustments ─────────────────────────────────────────
function adjustVoteOffset(eventId, region, delta) {
  const ev = getEventById(eventId);
  if (!ev) return null;
  const offsets = ev.voteOffsets || { r1: 0, r2: 0 };
  offsets[region] = Math.max(0, (offsets[region] || 0) + delta);
  getDb().get('events').find({ id: eventId }).assign({ voteOffsets: offsets }).write();
  return offsets;
}
function resetVoteOffsets(eventId) {
  getDb().get('events').find({ id: eventId }).assign({ voteOffsets: { r1: 0, r2: 0 } }).write();
}

// ─── Tables & Seats ─────────────────────────────────────────────
// Мөлдір Өлең залы — 25 үстел × 4 орын = 100 орын. Seats keys: "<table>-<seat>", мыс. "1-3".
const TOTAL_TABLES = 25;
const SEATS_PER_TABLE = 4;
const TABLE_TIERS = {
  1: 'vip', 2: 'vip', 3: 'vip',
  4: 'mid', 5: 'mid', 6: 'mid', 7: 'mid',
  8: 'std', 9: 'std', 10: 'std', 11: 'std', 12: 'std',
  13: 'std', 14: 'std', 15: 'std', 16: 'std', 17: 'std',
  18: 'std', 19: 'std', 20: 'std', 21: 'std', 22: 'std',
  23: 'std', 24: 'std', 25: 'std',
};
const TIER_DEFAULT_PRICE = { vip: 10000, mid: 7000, std: 5000 };
function defaultTablePrices() {
  const out = {};
  for (let t = 1; t <= TOTAL_TABLES; t++) out[t] = TIER_DEFAULT_PRICE[TABLE_TIERS[t]];
  return out;
}
function _buildSeats(oldSeats) {
  const seats = {};
  for (let t = 1; t <= TOTAL_TABLES; t++) {
    for (let s = 1; s <= SEATS_PER_TABLE; s++) {
      const k = `${t}-${s}`;
      seats[k] = (oldSeats || {})[k] || 'free';
    }
  }
  return seats;
}
function toggleSeat(id, seatId) {
  let ev = getEventById(id);
  if (!ev) return null;
  if (!ev.seats || Object.keys(ev.seats).length === 0) {
    const seats = _buildSeats({});
    getDb().get('events').find({ id }).assign({
      seats, totalTickets: TOTAL_TABLES * SEATS_PER_TABLE, remainingTickets: TOTAL_TABLES * SEATS_PER_TABLE,
    }).write();
    ev = getEventById(id);
  }
  if (ev.seats[seatId] === undefined) return null;
  const newStatus = ev.seats[seatId] === 'taken' ? 'free' : 'taken';
  const seats = { ...ev.seats, [seatId]: newStatus };
  const remaining = Object.values(seats).filter(s => s === 'free').length;
  getDb().get('events').find({ id }).assign({ seats, remainingTickets: remaining }).write();
  return getEventById(id);
}

// ─── Votes ───────────────────────────────────────────────────
function getVotesByEvent(eventId) {
  return getDb().get('votes').filter({ eventId }).value();
}
function getAllVotesSummary() {
  return getEvents().map(ev => {
    const v = getVotesByEvent(ev.id);
    const off = ev.voteOffsets || { r1: 0, r2: 0 };
    const r1 = v.filter(x => x.regionChoice === 1).length + (off.r1 || 0);
    const r2 = v.filter(x => x.regionChoice === 2).length + (off.r2 || 0);
    return { eventId: ev.id, date: ev.date, region1: ev.region1, region2: ev.region2,
             r1Count: r1, r2Count: r2, total: r1 + r2 };
  });
}
function tokenExists(token) {
  return !!getDb().get('votes').find({ token }).value();
}
function createVote(eventId, regionChoice, token) {
  const vote = { id: uuid(), eventId, regionChoice, token, createdAt: new Date().toISOString() };
  getDb().get('votes').push(vote).write();
  return vote;
}
function deleteVotesByEvent(eventId) {
  getDb().get('votes').remove({ eventId }).write();
}

// ─── Media ───────────────────────────────────────────────────
function getMedia() {
  return getDb().get('media').value().slice().sort((a,b) => b.createdAt.localeCompare(a.createdAt));
}
function getMediaById(id) { return getDb().get('media').find({ id }).value(); }
function createMedia(data) {
  const item = { id: uuid(), type: data.type || 'photo', url: data.url || null,
                 image: data.image || null, caption: data.caption || '',
                 date: data.date || null, createdAt: new Date().toISOString() };
  getDb().get('media').push(item).write();
  return item;
}
function updateMedia(id, data) {
  getDb().get('media').find({ id }).assign(data).write();
  return getMediaById(id);
}
function deleteMedia(id) {
  if (!getMediaById(id)) return false;
  getDb().get('media').remove({ id }).write();
  return true;
}

// ─── Sponsors ────────────────────────────────────────────────
function getSponsors() { return getDb().get('sponsors').value(); }
function getSponsorById(id) { return getDb().get('sponsors').find({ id }).value(); }
function createSponsor(data) {
  const sp = { id: uuid(), name: data.name, image: data.image || null,
               website: data.website || '', createdAt: new Date().toISOString() };
  getDb().get('sponsors').push(sp).write();
  return sp;
}
function updateSponsor(id, data) {
  getDb().get('sponsors').find({ id }).assign(data).write();
  return getSponsorById(id);
}
function deleteSponsor(id) {
  if (!getSponsorById(id)) return false;
  getDb().get('sponsors').remove({ id }).write();
  return true;
}

// ─── Settings ────────────────────────────────────────────────
function getSettings() { return getDb().get('settings').value(); }
function getSetting(key) { return getDb().get('settings').value()[key]; }
function setSetting(key, value) { getDb().set(`settings.${key}`, value).write(); }
function updateSettings(updates) {
  ['whatsapp','kaspi_link','kaspi_merchant'].forEach(k => {
    if (updates[k] !== undefined) getDb().set(`settings.${k}`, updates[k]).write();
  });
  return getSettings();
}

module.exports = {
  getDb,
  getEvents, getEventById, getTodayEvent, getVotingEvent, createEvent, updateEvent, deleteEvent, changeTickets,
  adjustVoteOffset, resetVoteOffsets, toggleSeat,
  getVotesByEvent, getAllVotesSummary, tokenExists, createVote, deleteVotesByEvent,
  getMedia, getMediaById, createMedia, updateMedia, deleteMedia,
  getSponsors, getSponsorById, createSponsor, updateSponsor, deleteSponsor,
  getSettings, getSetting, setSetting, updateSettings,
};

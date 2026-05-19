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
  const defaultPass = process.env.ADMIN_PASSWORD || 'admin2024';
  _db.defaults({
    events:   [],
    votes:    [],
    media:    [],
    sponsors: [],
    settings: {
      admin_password_hash: bcrypt.hashSync(defaultPass, 10),
      whatsapp:            '+77016202086',
      kaspi_link:          'https://kaspi.kz/pay',
      kaspi_merchant:      '',
    },
  }).write();
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
    poster: data.poster || null, ticketPrice: data.ticketPrice || 3000,
    totalTickets: data.totalTickets || 100,
    remainingTickets: data.remainingTickets ?? data.totalTickets ?? 100,
    kaspiLink: data.kaspiLink || null,
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

// ─── Votes ───────────────────────────────────────────────────
function getVotesByEvent(eventId) {
  return getDb().get('votes').filter({ eventId }).value();
}
function getAllVotesSummary() {
  return getEvents().map(ev => {
    const v = getVotesByEvent(ev.id);
    return { eventId: ev.id, date: ev.date, region1: ev.region1, region2: ev.region2,
             r1Count: v.filter(x => x.regionChoice === 1).length,
             r2Count: v.filter(x => x.regionChoice === 2).length, total: v.length };
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
  getVotesByEvent, getAllVotesSummary, tokenExists, createVote, deleteVotesByEvent,
  getMedia, getMediaById, createMedia, updateMedia, deleteMedia,
  getSponsors, getSponsorById, createSponsor, updateSponsor, deleteSponsor,
  getSettings, getSetting, setSetting, updateSettings,
};

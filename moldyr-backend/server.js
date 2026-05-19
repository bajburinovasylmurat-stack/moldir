require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '20mb' }));   // large limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ─── Routes ─────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/events',   require('./routes/events'));
app.use('/api/votes',    require('./routes/votes'));
app.use('/api/media',    require('./routes/media'));
app.use('/api/sponsors', require('./routes/sponsors'));
app.use('/api/settings', require('./routes/settings'));

// ─── Health check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Мөлдір Өлең API', ts: new Date().toISOString() });
});

// ─── Static frontend (production) ────────────────────────────
// When you build your frontend, put the output in ./public
const fs = require('fs');
const localPublicDir = path.join(__dirname, 'public');
const siblingPublicDir = path.join(__dirname, '..', 'public');
const publicDir = fs.existsSync(path.join(siblingPublicDir, 'index.html')) ? siblingPublicDir : localPublicDir;
app.use(express.static(publicDir));
app.get('*', (req, res) => {
  const index = path.join(publicDir, 'index.html');
  if (fs.existsSync(index)) res.sendFile(index);
  else res.json({ message: 'Мөлдір Өлең API is running', docs: '/api/health' });
});

// ─── Error handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Сервер қатесі' });
});

// ─── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ✦ Мөлдір Өлең API
  ─────────────────────────
  🚀  http://localhost:${PORT}
  📋  /api/health
  `);
});

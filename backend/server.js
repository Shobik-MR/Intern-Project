// ──────────────────────────────────────────────────────────────
// server.js  –  EventHub Express backend entry point
// ──────────────────────────────────────────────────────────────
require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const connectDB = require('./config/db');

// ── Import route modules ────────────────────────────────────
const authRoutes          = require('./routes/auth');
const eventRoutes         = require('./routes/events');
const registrationRoutes  = require('./routes/registrations');

// ── Initialize Express ──────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the frontend as static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ── API Routes ──────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/events',        eventRoutes);
app.use('/api/registrations', registrationRoutes);

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Catch‑all: serve frontend for any non‑API route ─────────
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ── Connect to MongoDB and start server ─────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀  EventHub server running on http://localhost:${PORT}`);
  });
});

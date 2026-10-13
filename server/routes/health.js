const router = require('express').Router();
const mongoose = require('mongoose');

// GET /api/health -> confirms the API is up AND the database is connected.
router.get('/', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = states[mongoose.connection.readyState] || 'unknown';
  res.status(state === 'connected' ? 200 : 503).json({ status: 'ok', database: state, name: mongoose.connection.name });
});

module.exports = router;

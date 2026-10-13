// app.js: configuration and mounting only. The server is started in server.js.
const express = require('express');
const cors = require('cors');

const requestLogger = require('./middleware/logger');
const requireAuth = require('./middleware/auth');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// 1. Global middleware
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.use(requestLogger);

// 2. Routes
app.use('/api/health', require('./routes/health'));
app.use('/api/auth', require('./routes/auth')); // public: register + login
// Everything below needs a valid token (requireAuth sets req.user). It is attached per router so that
// unknown URLs still fall through to the JSON 404 catch-all instead of answering 401.
app.use('/api/users', requireAuth, require('./routes/users'));
app.use('/api/transactions', requireAuth, require('./routes/transactions'));
app.use('/api/stats', requireAuth, require('./routes/stats'));
app.use('/api/stalls', requireAuth, require('./routes/stalls'));
app.use('/api/wheel', requireAuth, require('./routes/wheel'));
app.use('/api/budgets', requireAuth, require('./routes/budgets'));
app.use('/api/savings', requireAuth, require('./routes/savings'));
app.use('/api/notifications', requireAuth, require('./routes/notifications'));

// 3. JSON 404 catch-all, then 4. error handler (order matters: these two must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;

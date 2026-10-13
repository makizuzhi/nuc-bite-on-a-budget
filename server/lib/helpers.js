const mongoose = require('mongoose');
const httpError = require('./httpError');

const DAY_MS = 24 * 60 * 60 * 1000;

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

// Local YYYY-MM-DD key (used to group transactions by calendar day)
const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

// Parse "YYYY-MM-DD" as a LOCAL date; throws 400 if invalid.
function parseDay(str, name = 'date') {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str || '');
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  // Reject impossible dates like 2026-13-45 (JS would silently roll them over)
  const valid = d && d.getFullYear() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3]);
  if (!valid) throw httpError(400, `"${name}" must be a date in YYYY-MM-DD format`);
  return d;
}

// Only copy whitelisted keys from a request body (prevents mass-assignment).
const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj && obj[k] !== undefined).map((k) => [k, obj[k]]));

// Express router.param handler: rejects malformed ids with a clean 400.
function validateObjectId(req, res, next, id) {
  if (!mongoose.isValidObjectId(id)) return next(httpError(400, `Invalid id: "${id}"`));
  next();
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { DAY_MS, round2, startOfDay, addDays, dayKey, parseDay, pick, validateObjectId, escapeRegex };

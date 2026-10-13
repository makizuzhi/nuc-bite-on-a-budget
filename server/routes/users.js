const router = require('express').Router();
const { getFinancials, syncAlerts } = require('../services/finance');
const { pick, round2 } = require('../lib/helpers');
const httpError = require('../lib/httpError');

const PROFILE_FIELDS = ['fullName', 'email', 'role', 'program', 'studentNumber', 'cycleLengthDays'];
const PREFERENCE_FIELDS = ['defaultMaxBudget', 'defaultStall', 'lowAllowanceAlertPercent'];

// GET /api/users/me -> the student's profile
router.get('/me', (req, res) => res.json(req.user));

// PUT /api/users/me -> edit profile + personal preferences (the "Edit profile" form)
router.put('/me', async (req, res, next) => {
  try {
    Object.assign(req.user, pick(req.body, PROFILE_FIELDS));
    if (req.body.preferences) Object.assign(req.user.preferences, pick(req.body.preferences, PREFERENCE_FIELDS));
    await req.user.save(); // runs schema validation -> 400 on bad data
    await syncAlerts(req.user);
    res.json(req.user);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/me/balance { allowance } -> "Set balance": sets the TOTAL allowance for the current cycle.
// Remaining, daily budget, weekly budget and every progress bar are derived from it, so they all follow.
router.patch('/me/balance', async (req, res, next) => {
  try {
    const allowance = Number(req.body.allowance ?? req.body.balance);
    if (req.body.allowance === undefined && req.body.balance === undefined) throw httpError(400, 'Allowance is required', { allowance: 'Allowance is required' });
    if (!Number.isFinite(allowance) || allowance < 0) throw httpError(400, 'Allowance must be a number that is 0 or more', { allowance: 'Allowance must be 0 or more' });

    const f = await getFinancials(req.user);
    // remaining = allowance + income - spent - net savings, so allowance - remaining = what is already committed.
    const minimum = Math.max(round2(f.allowance - f.remaining), 0);
    if (allowance < minimum) {
      const message = `Allowance cannot be lower than what you already spent and saved this cycle (${minimum}).`;
      throw httpError(400, message, { allowance: message });
    }
    req.user.allowance = round2(allowance);
    await req.user.save();
    await syncAlerts(req.user);
    res.json({ user: req.user, financials: await getFinancials(req.user) });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/me/cycle -> start a fresh allowance cycle today with a new allowance
router.post('/me/cycle', async (req, res, next) => {
  try {
    const { allowance, cycleLengthDays } = req.body;
    Object.assign(req.user, { cycleStart: new Date(), ...(allowance !== undefined && { allowance }), ...(cycleLengthDays !== undefined && { cycleLengthDays }) });
    await req.user.save();
    await syncAlerts(req.user);
    res.status(201).json({ user: req.user, financials: await getFinancials(req.user) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

const router = require('express').Router();
const { Transaction, SavingsEntry } = require('../models');
const { getFinancials, getCategoryTotals, getCycle } = require('../services/finance');
const { round2, startOfDay, addDays, dayKey, parseDay } = require('../lib/helpers');
const httpError = require('../lib/httpError');

// GET /api/stats/summary -> dashboard banner: remaining, spent, daily/weekly budget, savings pocket
router.get('/summary', async (req, res, next) => {
  try {
    res.json(await getFinancials(req.user));
  } catch (err) {
    next(err);
  }
});

// GET /api/stats/categories?from=YYYY-MM-DD&to=YYYY-MM-DD -> spending distribution (defaults to this cycle)
router.get('/categories', async (req, res, next) => {
  try {
    const cycle = getCycle(req.user);
    const from = req.query.from ? parseDay(req.query.from, 'from') : cycle.start;
    const to = req.query.to ? addDays(parseDay(req.query.to, 'to'), 1) : cycle.end;
    if (from >= to) throw httpError(400, '"from" must be before "to"');
    res.json({ from, to, ...(await getCategoryTotals(req.user, from, to)) });
  } catch (err) {
    next(err);
  }
});

// GET /api/stats/calendar?month=YYYY-MM -> spending per day for the calendar grid
router.get('/calendar', async (req, res, next) => {
  try {
    const now = new Date();
    const month = req.query.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw httpError(400, '"month" must be in YYYY-MM format');
    const [y, m] = month.split('-').map(Number);
    const from = new Date(y, m - 1, 1);
    const to = new Date(y, m, 1);

    const [expenses, savings] = await Promise.all([
      Transaction.find({ user: req.user._id, type: 'expense', occurredAt: { $gte: from, $lt: to } }).select('amount occurredAt'),
      SavingsEntry.find({ user: req.user._id, savedAt: { $gte: from, $lt: to } }).select('amount kind savedAt'),
    ]);
    const days = {};
    const slot = (key) => (days[key] ||= { date: key, spent: 0, saved: 0, count: 0 });
    expenses.forEach((t) => { const d = slot(dayKey(t.occurredAt)); d.spent += t.amount; d.count += 1; });
    savings.forEach((s) => { slot(dayKey(s.savedAt)).saved += s.kind === 'deposit' ? s.amount : -s.amount; });

    const list = Object.values(days).sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({ ...d, spent: round2(d.spent), saved: round2(d.saved) }));
    res.json({
      month,
      daysInMonth: new Date(y, m, 0).getDate(),
      firstWeekday: from.getDay(), // 0 = Sunday, used to offset the calendar grid
      totalSpent: round2(list.reduce((s, d) => s + d.spent, 0)),
      highestDay: list.reduce((best, d) => (!best || d.spent > best.spent ? d : best), null),
      days: list,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/stats/day?date=YYYY-MM-DD -> "Selected day" panel
router.get('/day', async (req, res, next) => {
  try {
    const day = parseDay(req.query.date, 'date');
    const next_ = addDays(day, 1);
    const [transactions, savings] = await Promise.all([
      Transaction.find({ user: req.user._id, occurredAt: { $gte: day, $lt: next_ } }).sort({ occurredAt: -1 }),
      SavingsEntry.find({ user: req.user._id, savedAt: { $gte: day, $lt: next_ } }),
    ]);
    res.json({
      date: dayKey(day),
      spent: round2(transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)),
      saved: round2(savings.reduce((s, e) => s + (e.kind === 'deposit' ? e.amount : -e.amount), 0)),
      transactions,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/stats/weekly -> weekly summary: last 7 days vs weekly target, status badge, budget streak
router.get('/weekly', async (req, res, next) => {
  try {
    const user = req.user;
    const cycle = getCycle(user);
    const today = startOfDay(new Date());
    const weekFrom = addDays(today, -6);
    const weekTo = addDays(today, 1);

    const expenses = await Transaction.find({ user: user._id, type: 'expense', occurredAt: { $gte: cycle.start, $lt: cycle.end } }).select('amount category occurredAt');
    const spentBetween = (from, to) => expenses.filter((t) => t.occurredAt >= from && t.occurredAt < to);
    const sum = (list) => list.reduce((s, t) => s + t.amount, 0);

    const weeklyTarget = round2((user.allowance / cycle.length) * 7); // planned pace: allowance spread evenly
    const thisWeek = spentBetween(weekFrom, weekTo);
    const totalSpent = round2(sum(thisWeek));
    const ratio = weeklyTarget > 0 ? totalSpent / weeklyTarget : 1;
    const status = ratio <= 0.9 ? 'On Track' : ratio <= 1 ? 'Watch Out' : 'Over Budget';

    // Budget streak: consecutive 7-day windows (going back from today) that stayed within the target.
    let streak = 0;
    for (let i = 0; i < 52; i += 1) {
      const to = addDays(weekTo, -7 * i);
      const from = addDays(to, -7);
      if (to <= cycle.start) break;
      if (sum(spentBetween(from, to)) <= weeklyTarget) streak += 1;
      else break;
    }

    const byCategory = {};
    thisWeek.forEach((t) => { byCategory[t.category] = (byCategory[t.category] || 0) + t.amount; });

    res.json({
      from: dayKey(weekFrom),
      to: dayKey(today),
      totalSpent,
      weeklyTarget,
      percentOfTarget: Math.round(ratio * 100),
      status,
      streakWeeks: streak,
      byCategory: Object.entries(byCategory).map(([category, total]) => ({ category, total: round2(total) })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/stats/profile -> metric cards on the profile screen (meals logged, saved this month, streak inputs)
router.get('/profile', async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [mealsLogged, saved] = await Promise.all([
      Transaction.countDocuments({ user: req.user._id, type: 'expense', meal: { $ne: null } }),
      SavingsEntry.find({ user: req.user._id, savedAt: { $gte: monthStart } }),
    ]);
    res.json({
      mealsLogged,
      savedThisMonth: round2(saved.reduce((s, e) => s + (e.kind === 'deposit' ? e.amount : -e.amount), 0)),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

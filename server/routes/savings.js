const router = require('express').Router();
const { SavingsEntry, SavingsGoal } = require('../models');
const { getFinancials, syncAlerts } = require('../services/finance');
const { pick, round2, validateObjectId } = require('../lib/helpers');
const httpError = require('../lib/httpError');

router.param('id', validateObjectId);

const signed = (e) => (e.kind === 'deposit' ? e.amount : -e.amount);

// GET /api/savings -> pocket total + history, plus progress for each goal (all derived)
router.get('/', async (req, res, next) => {
  try {
    const [entries, goals] = await Promise.all([
      SavingsEntry.find({ user: req.user._id }).sort({ savedAt: -1 }),
      SavingsGoal.find({ user: req.user._id }).sort({ createdAt: 1 }),
    ]);
    const pocket = round2(entries.reduce((s, e) => s + signed(e), 0));
    const goalsWithProgress = goals.map((g) => {
      const saved = round2(entries.filter((e) => String(e.goal) === String(g._id)).reduce((s, e) => s + signed(e), 0));
      return { ...g.toObject(), saved, percent: Math.min(100, Math.round((saved / g.targetAmount) * 100)), left: round2(Math.max(g.targetAmount - saved, 0)) };
    });
    res.json({ pocket, entries, goals: goalsWithProgress });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/savings/pocket { amount } -> edit the savings pocket total directly.
// The difference is recorded as a deposit (comes out of the remaining allowance) or a withdrawal
// (goes back into it), so "total remaining" always reflects the change.
router.patch('/pocket', async (req, res, next) => {
  try {
    const target = Number(req.body.amount);
    if (req.body.amount === undefined || !Number.isFinite(target) || target < 0) {
      throw httpError(400, 'Savings pocket must be a number that is 0 or more', { amount: 'Enter 0 or more' });
    }
    const f = await getFinancials(req.user);
    const delta = round2(target - f.savingsPocket);
    if (delta === 0) return res.json({ pocket: f.savingsPocket, financials: f });
    if (delta > f.remaining) {
      const message = `Not enough allowance. You can add at most ${f.remaining} more to your pocket.`;
      throw httpError(400, message, { amount: message });
    }
    await SavingsEntry.create({
      user: req.user._id, kind: delta > 0 ? 'deposit' : 'withdrawal', amount: Math.abs(delta), note: 'Pocket adjusted', savedAt: new Date(),
    });
    await syncAlerts(req.user);
    const financials = await getFinancials(req.user);
    res.json({ pocket: financials.savingsPocket, financials });
  } catch (err) {
    next(err);
  }
});

// POST /api/savings { amount, kind, goal?, note? } -> add to / take from the savings pocket.
// Rules: a deposit comes out of the remaining allowance; a withdrawal cannot exceed the pocket.
router.post('/', async (req, res, next) => {
  try {
    const body = pick(req.body, ['amount', 'kind', 'goal', 'note', 'savedAt']);
    const amount = Number(body.amount);
    const f = await getFinancials(req.user);
    if ((body.kind || 'deposit') === 'deposit' && amount > f.remaining) {
      throw httpError(400, `Not enough allowance. You only have ${f.remaining} remaining.`);
    }
    if (body.kind === 'withdrawal' && amount > f.savingsPocket) {
      throw httpError(400, `You only have ${f.savingsPocket} in your savings pocket.`);
    }
    if (body.goal && !(await SavingsGoal.exists({ _id: body.goal, user: req.user._id }))) throw httpError(404, 'Savings goal not found');
    const entry = await SavingsEntry.create({ ...body, user: req.user._id });
    await syncAlerts(req.user);
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/savings/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const entry = await SavingsEntry.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!entry) throw httpError(404, 'Savings entry not found');
    res.json({ message: 'Savings entry deleted', id: entry._id });
  } catch (err) {
    next(err);
  }
});

// ---- Savings goals (CRUD) ----
const GOAL_FIELDS = ['name', 'targetAmount', 'deadline', 'status'];

// POST /api/savings/goals
router.post('/goals', async (req, res, next) => {
  try {
    res.status(201).json(await SavingsGoal.create({ ...pick(req.body, GOAL_FIELDS), user: req.user._id }));
  } catch (err) {
    next(err);
  }
});

// PUT /api/savings/goals/:id
router.put('/goals/:id', async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) throw httpError(404, 'Savings goal not found');
    Object.assign(goal, pick(req.body, GOAL_FIELDS));
    await goal.save();
    res.json(goal);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/savings/goals/:id (its entries stay in the pocket, just unlinked)
router.delete('/goals/:id', async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!goal) throw httpError(404, 'Savings goal not found');
    await SavingsEntry.updateMany({ user: req.user._id, goal: goal._id }, { goal: null });
    res.json({ message: 'Savings goal deleted', id: goal._id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

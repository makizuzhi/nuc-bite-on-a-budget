const router = require('express').Router();
const { CategoryBudget, Transaction } = require('../models');
const { getCycle, syncAlerts } = require('../services/finance');
const { pick, round2, validateObjectId } = require('../lib/helpers');
const httpError = require('../lib/httpError');

router.param('id', validateObjectId);

// Adds derived usage (spent / percent / status) to a budget document.
function withUsage(budget, spent) {
  const percentUsed = Math.round((spent / budget.limit) * 100);
  const status = spent >= budget.limit ? 'over' : spent >= budget.limit * budget.alertThreshold ? 'warning' : 'ok';
  return { ...budget.toObject(), spent: round2(spent), remaining: round2(budget.limit - spent), percentUsed, status };
}

// GET /api/budgets -> category budgets with live usage and low-budget alert status
router.get('/', async (req, res, next) => {
  try {
    const cycle = getCycle(req.user);
    const [budgets, spentRows] = await Promise.all([
      CategoryBudget.find({ user: req.user._id }).sort({ category: 1 }),
      Transaction.aggregate([
        { $match: { user: req.user._id, type: 'expense', occurredAt: { $gte: cycle.start, $lt: cycle.end } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
      ]),
    ]);
    const spentBy = Object.fromEntries(spentRows.map((r) => [r._id, r.total]));
    const data = budgets.map((b) => withUsage(b, spentBy[b.category] || 0));
    res.json({ data, alerts: data.filter((b) => b.status !== 'ok') });
  } catch (err) {
    next(err);
  }
});

// POST /api/budgets
router.post('/', async (req, res, next) => {
  try {
    const budget = await CategoryBudget.create({ ...pick(req.body, ['category', 'limit', 'alertThreshold']), user: req.user._id });
    await syncAlerts(req.user);
    res.status(201).json(budget);
  } catch (err) {
    next(err);
  }
});

// PUT /api/budgets/:id
router.put('/:id', async (req, res, next) => {
  try {
    const budget = await CategoryBudget.findOne({ _id: req.params.id, user: req.user._id });
    if (!budget) throw httpError(404, 'Budget not found');
    Object.assign(budget, pick(req.body, ['limit', 'alertThreshold']));
    await budget.save();
    await syncAlerts(req.user);
    res.json(budget);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/budgets/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const budget = await CategoryBudget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!budget) throw httpError(404, 'Budget not found');
    res.json({ message: 'Budget deleted', id: budget._id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

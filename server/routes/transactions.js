const router = require('express').Router();
const { Transaction } = require('../models');
const { getFinancials, syncAlerts } = require('../services/finance');
const { DEFAULT_CATEGORIES } = require('../models/constants');
const { pick, escapeRegex, parseDay, addDays, round2 } = require('../lib/helpers');
const httpError = require('../lib/httpError');

router.param('id', require('../lib/helpers').validateObjectId);

const WRITABLE = ['type', 'category', 'amount', 'description', 'occurredAt'];
const SORTS = {
  newest: { occurredAt: -1 },
  oldest: { occurredAt: 1 },
  highest: { amount: -1 },
  lowest: { amount: 1 },
};

// GET /api/transactions?category=&type=&q=&from=&to=&minAmount=&maxAmount=&sort=&page=&limit=
// Multi-criteria search, filtering, sorting and pagination.
router.get('/', async (req, res, next) => {
  try {
    const { category, type, q, from, to, minAmount, maxAmount, sort = 'newest' } = req.query;
    const filter = { user: req.user._id };
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (q) filter.description = { $regex: escapeRegex(String(q)), $options: 'i' };
    if (from || to) {
      filter.occurredAt = {};
      if (from) filter.occurredAt.$gte = parseDay(from, 'from');
      if (to) filter.occurredAt.$lt = addDays(parseDay(to, 'to'), 1); // "to" is inclusive
    }
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
      if (Object.values(filter.amount).some(Number.isNaN)) throw httpError(400, 'minAmount and maxAmount must be numbers');
    }
    if (!SORTS[sort]) throw httpError(400, `sort must be one of: ${Object.keys(SORTS).join(', ')}`);

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const [data, amounts] = await Promise.all([
      Transaction.find(filter).sort(SORTS[sort]).skip((page - 1) * limit).limit(limit),
      Transaction.find(filter).select('amount').lean(), // all matches, to compute the summary
    ]);
    const total = amounts.length;
    const sum = amounts.reduce((s, t) => s + t.amount, 0);
    res.json({
      data,
      total,
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
      summary: { sum: round2(sum), average: total ? round2(sum / total) : 0, highest: total ? Math.max(...amounts.map((t) => t.amount)) : 0 },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/transactions/categories -> default categories + every custom category this student has used
router.get('/categories', async (req, res, next) => {
  try {
    const used = await Transaction.distinct('category', { user: req.user._id });
    const custom = used.filter((c) => !DEFAULT_CATEGORIES.includes(c)).sort((a, b) => a.localeCompare(b));
    res.json({ defaults: DEFAULT_CATEGORIES, custom, all: [...DEFAULT_CATEGORIES, ...custom] });
  } catch (err) {
    next(err);
  }
});

// GET /api/transactions/:id
router.get('/:id', async (req, res, next) => {
  try {
    const tx = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!tx) throw httpError(404, 'Transaction not found');
    res.json(tx);
  } catch (err) {
    next(err);
  }
});

// POST /api/transactions -> 201. Rule: an expense cannot be bigger than the remaining allowance.
router.post('/', async (req, res, next) => {
  try {
    const body = pick(req.body, WRITABLE);
    if ((body.type || 'expense') === 'expense') {
      const { remaining } = await getFinancials(req.user);
      if (Number(body.amount) > remaining) {
        throw httpError(400, `Not enough allowance. You only have ${remaining} remaining.`);
      }
    }
    const tx = await Transaction.create({ ...body, user: req.user._id });
    await syncAlerts(req.user);
    res.status(201).json(tx);
  } catch (err) {
    next(err);
  }
});

// PUT /api/transactions/:id
router.put('/:id', async (req, res, next) => {
  try {
    const tx = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!tx) throw httpError(404, 'Transaction not found');
    Object.assign(tx, pick(req.body, WRITABLE));
    await tx.save();
    await syncAlerts(req.user);
    res.json(tx);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const tx = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!tx) throw httpError(404, 'Transaction not found');
    await syncAlerts(req.user);
    res.json({ message: 'Transaction deleted', id: tx._id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

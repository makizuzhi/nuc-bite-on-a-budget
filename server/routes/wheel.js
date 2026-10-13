const router = require('express').Router();
const crypto = require('crypto');
const { FoodStall, WheelItem, Transaction, STALL_NAMES, ALL_STALLS } = require('../models');
const { getFinancials, syncAlerts } = require('../services/finance');
const { pick, escapeRegex, round2, validateObjectId } = require('../lib/helpers');
const httpError = require('../lib/httpError');

router.param('id', validateObjectId);

/**
 * A student's wheel starts as a copy of every stall menu. This runs once per student
 * (flag: user.wheelSeeded) so later edits, deletions and custom foods are never overwritten.
 */
async function ensureWheel(user) {
  if (user.wheelSeeded) return;
  const stalls = await FoodStall.find();
  const docs = stalls.flatMap((s) => s.menu.filter((m) => m.available).map((m) => ({ user: user._id, stall: s.name, name: m.name, price: m.price, isCustom: false })));
  if (docs.length) await WheelItem.insertMany(docs, { ordered: false }).catch((e) => { if (e.code !== 11000 && !e.writeErrors) throw e; });
  user.wheelSeeded = true;
  await user.save();
}

// Filter shared by the list and the spin (the matching engine).
function itemFilter(user, { maxBudget, stall, q }) {
  const filter = { user: user._id };
  if (maxBudget !== undefined && maxBudget !== '') {
    const cap = Number(maxBudget);
    if (!Number.isFinite(cap) || cap <= 0) throw httpError(400, 'maxBudget must be a number greater than 0');
    filter.price = { $lte: cap };
  }
  if (stall && stall !== ALL_STALLS) {
    if (!STALL_NAMES.includes(stall)) throw httpError(400, `stall must be "${ALL_STALLS}" or one of: ${STALL_NAMES.join(', ')}`);
    filter.stall = stall;
  }
  if (q) filter.name = { $regex: escapeRegex(String(q)), $options: 'i' };
  return filter;
}

// GET /api/wheel?maxBudget=&stall=&q= -> the food items on this student's wheel (cheapest first)
router.get('/', async (req, res, next) => {
  try {
    await ensureWheel(req.user);
    const data = await WheelItem.find(itemFilter(req.user, req.query)).sort({ price: 1, name: 1 });
    res.json({ total: data.length, data });
  } catch (err) {
    next(err);
  }
});

// POST /api/wheel/spin { maxBudget, stall } -> the matching engine behind "Spin the wheel".
// A dish qualifies when it (1) is from the chosen stall (or any stall), (2) costs <= max budget and
// (3) costs <= the remaining allowance. One qualifying dish is then picked uniformly at random.
router.post('/spin', async (req, res, next) => {
  try {
    await ensureWheel(req.user);
    const { maxBudget = req.user.preferences.defaultMaxBudget, stall = ALL_STALLS } = req.body;
    const { remaining } = await getFinancials(req.user);
    const cap = Math.min(Number(maxBudget), remaining);
    if (!Number.isFinite(cap) || cap <= 0) {
      throw httpError(400, remaining <= 0 ? 'You have no allowance left to spend on food.' : 'maxBudget must be a number greater than 0');
    }
    const candidates = await WheelItem.find(itemFilter(req.user, { maxBudget: cap, stall })).sort({ price: 1 });
    if (candidates.length === 0) {
      throw httpError(404, `Nothing${stall === ALL_STALLS ? '' : ` from ${stall}`} fits within ${round2(cap)}. Try a higher budget, another stall, or add items to your wheel.`);
    }
    const item = candidates[crypto.randomInt(candidates.length)];
    res.json({
      item,
      maxBudget: Number(maxBudget),
      effectiveBudget: round2(cap), // the smaller of max budget and remaining allowance
      underBudgetBy: round2(Number(maxBudget) - item.price),
      remainingAfter: round2(remaining - item.price),
      candidates: candidates.length,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/wheel/reset -> throw away customizations and copy all stall menus onto the wheel again
router.post('/reset', async (req, res, next) => {
  try {
    await WheelItem.deleteMany({ user: req.user._id });
    req.user.wheelSeeded = false;
    await ensureWheel(req.user);
    const total = await WheelItem.countDocuments({ user: req.user._id });
    res.status(201).json({ message: 'Wheel reset to the default stall menus', total });
  } catch (err) {
    next(err);
  }
});

// POST /api/wheel -> add a food to the wheel
router.post('/', async (req, res, next) => {
  try {
    await ensureWheel(req.user);
    const item = await WheelItem.create({ ...pick(req.body, ['name', 'price', 'stall']), user: req.user._id, isCustom: true });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// GET /api/wheel/:id
router.get('/:id', async (req, res, next) => {
  try {
    const item = await WheelItem.findOne({ _id: req.params.id, user: req.user._id });
    if (!item) throw httpError(404, 'Wheel item not found');
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// PUT /api/wheel/:id -> edit any item on your wheel (name, price, stall)
router.put('/:id', async (req, res, next) => {
  try {
    const item = await WheelItem.findOne({ _id: req.params.id, user: req.user._id });
    if (!item) throw httpError(404, 'Wheel item not found');
    Object.assign(item, pick(req.body, ['name', 'price', 'stall']));
    await item.save();
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/wheel/:id -> remove an item from your wheel
router.delete('/:id', async (req, res, next) => {
  try {
    const item = await WheelItem.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!item) throw httpError(404, 'Wheel item not found');
    res.json({ message: 'Removed from your wheel', id: item._id });
  } catch (err) {
    next(err);
  }
});

// POST /api/wheel/:id/log -> "Accept & log meal": records the dish as a Food expense
router.post('/:id/log', async (req, res, next) => {
  try {
    const item = await WheelItem.findOne({ _id: req.params.id, user: req.user._id });
    if (!item) throw httpError(404, 'Wheel item not found');
    const { remaining } = await getFinancials(req.user);
    if (item.price > remaining) throw httpError(400, `Not enough allowance. You only have ${remaining} remaining.`);
    const tx = await Transaction.create({
      user: req.user._id, type: 'expense', category: 'Food', amount: item.price,
      description: `${item.name} (${item.stall})`, occurredAt: new Date(), meal: item._id, stall: item.stall,
    });
    await syncAlerts(req.user);
    res.status(201).json(tx);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

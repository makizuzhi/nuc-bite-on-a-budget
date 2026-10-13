const router = require('express').Router();
const { FoodStall, WheelItem } = require('../models');
const { escapeRegex, round2, validateObjectId } = require('../lib/helpers');
const httpError = require('../lib/httpError');

router.param('id', validateObjectId);

// Adds handy derived numbers (item count, cheapest / priciest dish) to a stall.
function summarize(stall, maxBudget) {
  const menu = stall.menu.filter((m) => m.available && (maxBudget === undefined || m.price <= maxBudget));
  const prices = menu.map((m) => m.price);
  return {
    _id: stall._id,
    name: stall.name,
    description: stall.description,
    specialty: stall.specialty,
    itemCount: menu.length,
    cheapest: prices.length ? Math.min(...prices) : null,
    priciest: prices.length ? Math.max(...prices) : null,
    average: prices.length ? round2(prices.reduce((s, p) => s + p, 0) / prices.length) : null,
    menu: menu.slice().sort((a, b) => a.price - b.price),
  };
}

function parseBudget(raw) {
  if (raw === undefined || raw === '') return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) throw httpError(400, 'maxBudget must be a number greater than 0');
  return n;
}

// GET /api/stalls?q=&maxBudget= -> all campus stalls with their menus (q matches stall or dish names)
router.get('/', async (req, res, next) => {
  try {
    const maxBudget = parseBudget(req.query.maxBudget);
    const filter = {};
    if (req.query.q) {
      const rx = { $regex: escapeRegex(String(req.query.q)), $options: 'i' };
      filter.$or = [{ name: rx }, { specialty: rx }, { 'menu.name': rx }];
    }
    const stalls = await FoodStall.find(filter).sort({ name: 1 });
    const data = stalls.map((s) => summarize(s, maxBudget)).filter((s) => maxBudget === undefined || s.itemCount > 0);
    res.json({ total: data.length, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/stalls/:id -> one stall with its full menu
router.get('/:id', async (req, res, next) => {
  try {
    const stall = await FoodStall.findById(req.params.id);
    if (!stall) throw httpError(404, 'Stall not found');
    res.json(summarize(stall, parseBudget(req.query.maxBudget)));
  } catch (err) {
    next(err);
  }
});

// GET /api/stalls/:id/menu?maxBudget= -> just the menu items (cheapest first)
router.get('/:id/menu', async (req, res, next) => {
  try {
    const stall = await FoodStall.findById(req.params.id);
    if (!stall) throw httpError(404, 'Stall not found');
    const { menu } = summarize(stall, parseBudget(req.query.maxBudget));
    res.json({ stall: stall.name, total: menu.length, data: menu });
  } catch (err) {
    next(err);
  }
});

// POST /api/stalls/:id/menu/:itemId/wheel -> copy one menu item onto the student's Food Wheel
router.post('/:id/menu/:itemId/wheel', async (req, res, next) => {
  try {
    const stall = await FoodStall.findById(req.params.id);
    if (!stall) throw httpError(404, 'Stall not found');
    const item = stall.menu.id(req.params.itemId);
    if (!item) throw httpError(404, 'Menu item not found');
    const exists = await WheelItem.exists({ user: req.user._id, stall: stall.name, name: item.name });
    if (exists) throw httpError(409, `${item.name} is already on your wheel`);
    const wheelItem = await WheelItem.create({ user: req.user._id, stall: stall.name, name: item.name, price: item.price, isCustom: false });
    res.status(201).json(wheelItem);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

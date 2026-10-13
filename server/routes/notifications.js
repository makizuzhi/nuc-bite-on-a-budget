const router = require('express').Router();
const { Notification } = require('../models');
const { syncAlerts } = require('../services/finance');
const { validateObjectId } = require('../lib/helpers');
const httpError = require('../lib/httpError');

router.param('id', validateObjectId);

// GET /api/notifications?unread=true&type= -> newest first, with the unread count for the bell badge.
// Alerts that are due (low allowance, daily budget, category budgets) are created first, so the list is always current.
router.get('/', async (req, res, next) => {
  try {
    await syncAlerts(req.user);
    const filter = { user: req.user._id };
    if (req.query.unread === 'true') filter.isRead = false;
    if (req.query.type) filter.type = req.query.type;
    const [data, unread] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(50),
      Notification.countDocuments({ user: req.user._id, isRead: false }),
    ]);
    res.json({ data, unread });
  } catch (err) {
    next(err);
  }
});

// POST /api/notifications/refresh -> re-check the budget rules right now, returns how many alerts were created
router.post('/refresh', async (req, res, next) => {
  try {
    const created = await syncAlerts(req.user);
    res.status(created ? 201 : 200).json({ created });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/read-all  (declared before "/:id" routes)
router.patch('/read-all', async (req, res, next) => {
  try {
    const result = await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read', modified: result.modifiedCount });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/notifications -> clear every notification (read ones only with ?readOnly=true)
router.delete('/', async (req, res, next) => {
  try {
    const filter = { user: req.user._id, ...(req.query.readOnly === 'true' && { isRead: true }) };
    const result = await Notification.deleteMany(filter);
    res.json({ message: 'Notifications cleared', deleted: result.deletedCount });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const n = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true }, { new: true });
    if (!n) throw httpError(404, 'Notification not found');
    res.json(n);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const n = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!n) throw httpError(404, 'Notification not found');
    res.json({ message: 'Notification deleted', id: n._id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

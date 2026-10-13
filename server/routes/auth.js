const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { notifyOnce, syncAlerts } = require('../services/finance');
const httpError = require('../lib/httpError');
const { pick } = require('../lib/helpers');
const { signToken } = require('../lib/token');

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72; // bcrypt only uses the first 72 bytes

// POST /api/auth/register { fullName, email, password, allowance?, cycleLengthDays? } -> 201 { token, user }
router.post('/register', async (req, res, next) => {
  try {
    const { password } = req.body;
    if (typeof password !== 'string' || password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
      const message = `Password must be ${PASSWORD_MIN}-${PASSWORD_MAX} characters`;
      throw httpError(400, message, { password: message });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      ...pick(req.body, ['fullName', 'email', 'allowance', 'cycleLengthDays']),
      passwordHash,
      cycleStart: new Date(), // the allowance cycle starts the day the account is created
    });
    await notifyOnce(user, 'welcome', 'system', 'Welcome to NUC: Bite On A Budget', 'Add your first expense to see your daily budget.');
    await notifyOnce(user, 'system:stalls', 'system', 'Campus food stalls are ready', 'Browse the 11 campus stalls and spin the Food Wheel for an affordable meal.');
    await syncAlerts(user);
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login { email, password } -> 200 { token, user }
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      throw httpError(400, 'Email and password are required');
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
    // Same message for "no such email" and "wrong password" so attackers cannot tell which one failed.
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) throw httpError(401, 'Incorrect email or password');
    res.json({ token: signToken(user), user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

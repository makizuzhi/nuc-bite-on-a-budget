const { User } = require('../models');
const httpError = require('../lib/httpError');
const { verifyToken } = require('../lib/token');

// Protects every route mounted after it: reads "Authorization: Bearer <token>",
// loads that student and attaches them as req.user (all routes filter by req.user._id).
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) throw httpError(401, 'Please log in to continue');

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw httpError(401, 'Your session expired. Please log in again');
    }

    const user = await User.findById(payload.sub);
    if (!user) throw httpError(401, 'This account no longer exists. Please log in again');
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = requireAuth;

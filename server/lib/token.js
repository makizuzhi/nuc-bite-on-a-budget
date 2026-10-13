const jwt = require('jsonwebtoken');

// JWT_SECRET should be set in .env. A fallback keeps local development working,
// but it must never be used for a real deployment.
const SECRET = () => process.env.JWT_SECRET || 'dev-only-secret-change-me';
if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set in .env, using an insecure development default.');
}

const signToken = (user) => jwt.sign({ sub: String(user._id) }, SECRET(), { expiresIn: '7d' });
const verifyToken = (token) => jwt.verify(token, SECRET());

module.exports = { signToken, verifyToken };

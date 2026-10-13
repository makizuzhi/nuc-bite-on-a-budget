// JSON 404 catch-all: registered AFTER all routes.
function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Central error handler: registered LAST. Every error leaves as { message, ... }.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Malformed JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body is not valid JSON' });
  }
  // Errors thrown on purpose with a status (see lib/httpError.js)
  if (err.status) return res.status(err.status).json({ message: err.message, ...(err.errors && { errors: err.errors }) });

  // Mongoose validation (required, min, max, enum, ...) -> 400 with per-field messages
  if (err.name === 'ValidationError') {
    const errors = Object.fromEntries(Object.entries(err.errors).map(([k, e]) => [k, e.message]));
    return res.status(400).json({ message: Object.values(errors)[0] || 'Validation failed', errors });
  }
  // Bad ObjectId or bad value type
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid value for "${err.path}"` });
  }
  // Duplicate key from a unique index
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {}).filter((k) => k !== 'user')[0] || 'record';
    return res.status(409).json({ message: `That ${field} already exists` });
  }
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
}

module.exports = { notFound, errorHandler };

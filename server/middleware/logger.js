// Custom request logger: METHOD /path -> status (ms)
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${new Date().toISOString()}  ${req.method.padEnd(6)} ${req.originalUrl}  ->  ${res.statusCode}  (${ms}ms)`);
  });
  next();
}

module.exports = requestLogger;

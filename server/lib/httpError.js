// Small helper so routes can throw errors with an HTTP status: throw httpError(404, 'Not found')
// Optional `errors` ({ field: message }) is sent back so forms can show per-field messages.
function httpError(status, message, errors) {
  const err = new Error(message);
  err.status = status;
  if (errors) err.errors = errors;
  return err;
}

module.exports = httpError;

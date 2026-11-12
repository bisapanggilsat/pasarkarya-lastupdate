// Error dengan status HTTP. Di-throw dari route, ditangkap oleh error handler di app.js.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Express 4 tidak menangkap error dari handler async, jadi dibungkus supaya masuk ke next(err).
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Bikin potongan WHERE untuk filter rentang tanggal (from/to berformat YYYY-MM-DD).
function dateRange(column, from, to) {
  const clauses = [];
  const params = [];
  if (from) {
    clauses.push(`DATE(${column}) >= DATE(?)`);
    params.push(from);
  }
  if (to) {
    clauses.push(`DATE(${column}) <= DATE(?)`);
    params.push(to);
  }
  return { clauses, params };
}

module.exports = { HttpError, asyncHandler, dateRange };

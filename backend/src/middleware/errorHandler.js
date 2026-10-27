import { HttpError } from '../utils/httpError.js';

export function notFound(req, res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  if (status >= 500) console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);

  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
    ...(err.details ? { details: err.details } : {}),
  });
}

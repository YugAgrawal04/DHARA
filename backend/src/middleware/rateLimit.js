import { HttpError } from '../utils/httpError.js';

/**
 * Very small fixed-window rate limiter (per client IP, in memory).
 * Protects paid/limited APIs such as Gemini from being spammed.
 */
export function rateLimit({ limit, windowMs = 60_000 }) {
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip;
    const entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (entry.count >= limit) {
      res.set('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      return next(new HttpError(429, 'Too many requests, please wait a minute'));
    }
    entry.count += 1;
    next();
  };
}

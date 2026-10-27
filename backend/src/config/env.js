import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Always load backend/.env, no matter which folder the server is started from.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const num = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const config = {
  port: num(process.env.PORT, 4000),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  serveFrontend: process.env.SERVE_FRONTEND !== 'false',
  frontendDir: path.resolve(__dirname, '../../../frontend'),
  // Local copy of the map library (installed by npm) so the app does not depend on a CDN
  maplibreDir: path.resolve(__dirname, '../../node_modules/maplibre-gl/dist'),

  openWeatherKey: process.env.OPENWEATHER_API_KEY || '',
  apiTimeoutMs: num(process.env.API_TIMEOUT_MS, 8000),
  aqCacheTtlMs: num(process.env.AQ_CACHE_TTL_MS, 5 * 60 * 1000),

  geminiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
  reportRateLimitPerMin: num(process.env.REPORT_RATE_LIMIT_PER_MIN, 10),

  nominatimUserAgent:
    process.env.NOMINATIM_USER_AGENT || 'DHARA-DigitalTwin/1.0 (student project)',
};

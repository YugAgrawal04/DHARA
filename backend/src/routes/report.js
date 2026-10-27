import { Router } from 'express';
import { config } from '../config/env.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { generateReport } from '../services/geminiService.js';
import { asyncHandler, HttpError } from '../utils/httpError.js';
import { cleanText } from '../utils/validators.js';

const router = Router();

const toInt = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : 0);

/** Accept only the fields the prompt needs, with sane types and lengths. */
function parseScenario(body = {}) {
  const aqi = (a = {}) => ({ value: toInt(a.value), category: cleanText(a.category, 40) || 'Unknown' });

  const interventions = Array.isArray(body.interventions)
    ? body.interventions.slice(0, 20).map((i) => ({
        title: cleanText(i?.title, 60),
        value: toInt(i?.value),
        count: toInt(i?.count),
      })).filter((i) => i.title)
    : [];

  const scenario = {
    location: cleanText(body.location, 120),
    currentAQI: aqi(body.currentAQI),
    projectedAQI: aqi(body.projectedAQI),
    co2Change: cleanText(body.co2Change, 20) || '0%',
    interventions,
  };
  if (!scenario.location) throw new HttpError(400, '"location" is required');
  return scenario;
}

// POST /api/report  { location, currentAQI, projectedAQI, co2Change, interventions[] }
router.post(
  '/',
  rateLimit({ limit: config.reportRateLimitPerMin }),
  asyncHandler(async (req, res) => {
    res.json(await generateReport(parseScenario(req.body)));
  }),
);

export default router;

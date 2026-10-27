import { Router } from 'express';
import { getAirQuality } from '../services/airQualityService.js';
import { asyncHandler, HttpError } from '../utils/httpError.js';
import { parseCoordinates } from '../utils/validators.js';

const router = Router();

// GET /api/air-quality?lat=18.625&lon=73.855
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const coords = parseCoordinates(req.query.lat, req.query.lon);
    if (!coords) throw new HttpError(400, 'Query params "lat" and "lon" must be valid coordinates');

    res.json(await getAirQuality(coords.lat, coords.lon));
  }),
);

export default router;

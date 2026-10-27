import { Router } from 'express';
import { geocode } from '../services/geocodeService.js';
import { asyncHandler, HttpError } from '../utils/httpError.js';
import { cleanText } from '../utils/validators.js';

const router = Router();

// GET /api/geocode?q=Shivajinagar, Pune
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = cleanText(req.query.q, 120);
    if (!q) throw new HttpError(400, 'Query param "q" is required');

    res.json(await geocode(q));
  }),
);

export default router;

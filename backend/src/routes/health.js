import { Router } from 'express';
import { config } from '../config/env.js';
import { providerStatus } from '../services/airQualityService.js';

const router = Router();

// GET /api/health – quick check that the server and keys are set up
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    airQualityProviders: providerStatus(),
    aiReport: { configured: Boolean(config.geminiKey), model: config.geminiModel },
  });
});

export default router;

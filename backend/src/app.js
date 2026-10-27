import cors from 'cors';
import express from 'express';
import { config } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import airQualityRoutes from './routes/airQuality.js';
import geocodeRoutes from './routes/geocode.js';
import healthRoutes from './routes/health.js';
import reportRoutes from './routes/report.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(
    cors({
      origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',').map((o) => o.trim()),
    }),
  );
  app.use(express.json({ limit: '50kb' }));

  // --- API ---
  app.use('/api/health', healthRoutes);
  app.use('/api/air-quality', airQualityRoutes);
  app.use('/api/geocode', geocodeRoutes);
  app.use('/api/report', reportRoutes);
  app.use('/api', notFound);

  // --- Frontend (optional: lets one `npm start` run the whole app) ---
  if (config.serveFrontend) {
    app.use('/vendor/maplibre-gl', express.static(config.maplibreDir));
    app.use(express.static(config.frontendDir));
  }

  app.use(errorHandler);
  return app;
}

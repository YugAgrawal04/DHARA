import { createApp } from './app.js';
import { config } from './config/env.js';

const app = createApp();

app.listen(config.port, () => {
  console.log(`DHARA API running on http://localhost:${config.port}`);
  if (config.serveFrontend) console.log(`Frontend served at  http://localhost:${config.port}/`);
  if (!config.openWeatherKey) console.warn('  ! OPENWEATHER_API_KEY not set – fallback air-quality source disabled');
  if (!config.geminiKey) console.warn('  ! GEMINI_API_KEY not set – AI report disabled');
});

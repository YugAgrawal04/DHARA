import { config } from '../../config/env.js';
import { fetchJson } from '../../utils/fetchJson.js';

const BASE_URL = 'https://api.openweathermap.org/data/2.5/air_pollution';

/** Fallback air-quality source. Needs OPENWEATHER_API_KEY in backend/.env. */
export const openWeather = {
  id: 'open_weather',
  name: 'OpenWeatherMap',
  isConfigured: () => Boolean(config.openWeatherKey),

  async fetch(lat, lon) {
    if (!config.openWeatherKey) throw new Error('Missing OpenWeatherMap API key');

    const params = new URLSearchParams({ lat, lon, appid: config.openWeatherKey });
    const d = await fetchJson(`${BASE_URL}?${params}`, { timeoutMs: config.apiTimeoutMs });
    const entry = d?.list?.[0];
    if (!entry?.components) throw new Error('Missing AQI data');

    return {
      pm2_5: entry.components.pm2_5,
      pm10: entry.components.pm10,
      co: entry.components.co,
      no2: entry.components.no2,
      observedAt: entry.dt ? new Date(entry.dt * 1000).toISOString() : null,
    };
  },
};

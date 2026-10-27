import { config } from '../../config/env.js';
import { fetchJson } from '../../utils/fetchJson.js';

const BASE_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

/** Primary air-quality source. Free, no API key required. */
export const openMeteo = {
  id: 'open_meteo',
  name: 'Open-Meteo',
  isConfigured: () => true,

  async fetch(lat, lon) {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: 'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide',
    });
    const d = await fetchJson(`${BASE_URL}?${params}`, { timeoutMs: config.apiTimeoutMs });
    if (!d?.current) throw new Error('Invalid response structure');

    return {
      pm2_5: d.current.pm2_5,
      pm10: d.current.pm10,
      co: d.current.carbon_monoxide,
      no2: d.current.nitrogen_dioxide,
      observedAt: d.current.time ?? null,
    };
  },
};

import { config } from '../config/env.js';
import { TtlCache } from '../utils/cache.js';
import { HttpError } from '../utils/httpError.js';
import { isValidAirQuality } from '../utils/validators.js';
import { openMeteo } from './providers/openMeteo.js';
import { openWeather } from './providers/openWeather.js';

// Order = priority. The first provider that returns valid data wins.
const PROVIDERS = [
  { role: 'primary', provider: openMeteo },
  { role: 'secondary', provider: openWeather },
];

const cache = new TtlCache(config.aqCacheTtlMs);

/**
 * Fetches current pollutant levels with automatic failover:
 * Open-Meteo → OpenWeatherMap. Every attempt is reported back so the
 * frontend audit log can show what happened.
 */
export async function getAirQuality(lat, lon) {
  // ~110 m grid so nearby requests share a cache entry
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = cache.get(key);
  if (cached) return { ...cached, cached: true };

  const attempts = [];

  for (const { role, provider } of PROVIDERS) {
    try {
      const data = await provider.fetch(lat, lon);
      if (!isValidAirQuality(data)) throw new Error('Validation failed: values out of range');

      attempts.push({ source: provider.id, role, status: 'SUCCESS' });
      const result = {
        source: provider.id,
        sourceName: provider.name,
        role,
        location: { lat, lon },
        data,
        fetchedAt: new Date().toISOString(),
        attempts,
        cached: false,
      };
      cache.set(key, result);
      return result;
    } catch (err) {
      attempts.push({ source: provider.id, role, status: 'FAILED', error: err.message });
    }
  }

  throw new HttpError(502, 'All air-quality providers failed', { attempts });
}

export function providerStatus() {
  return PROVIDERS.map(({ role, provider }) => ({
    role,
    source: provider.id,
    name: provider.name,
    configured: provider.isConfigured(),
  }));
}

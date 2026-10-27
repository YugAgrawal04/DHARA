import { config } from '../config/env.js';
import { fetchJson } from '../utils/fetchJson.js';
import { HttpError } from '../utils/httpError.js';

const BASE_URL = 'https://nominatim.openstreetmap.org/search';

/** Turns a place name into coordinates using OpenStreetMap Nominatim. */
export async function geocode(query) {
  const params = new URLSearchParams({ format: 'json', limit: '1', q: query });
  const results = await fetchJson(`${BASE_URL}?${params}`, {
    timeoutMs: config.apiTimeoutMs,
    headers: {
      'User-Agent': config.nominatimUserAgent,
      'Accept-Language': 'en',
    },
  });

  if (!Array.isArray(results) || results.length === 0) {
    throw new HttpError(404, `No results found for "${query}"`);
  }

  const place = results[0];
  return {
    lat: parseFloat(place.lat),
    lon: parseFloat(place.lon),
    label: place.display_name.split(',').slice(0, 3).join(',').trim(),
    displayName: place.display_name,
  };
}

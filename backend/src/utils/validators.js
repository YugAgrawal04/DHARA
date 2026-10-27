export function parseCoordinates(latRaw, lonRaw) {
  const lat = Number(latRaw);
  const lon = Number(lonRaw);
  const valid =
    Number.isFinite(lat) && Number.isFinite(lon) &&
    lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  return valid ? { lat, lon } : null;
}

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/** Sanity-check pollutant readings (µg/m³) before they reach the simulation. */
export function isValidAirQuality(d) {
  if (!d || ![d.pm2_5, d.pm10, d.co, d.no2].every(isNum)) return false;
  return (
    d.pm2_5 >= 0 && d.pm2_5 <= 900 &&
    d.pm10 >= 0 && d.pm10 <= 1000 &&
    d.co >= 0 && d.no2 >= 0
  );
}

/** Trim a string and cap its length; returns '' for non-strings. */
export function cleanText(value, maxLen = 200) {
  return typeof value === 'string' ? value.trim().slice(0, maxLen) : '';
}

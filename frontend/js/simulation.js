// =====================================================================
// Intervention simulation model (pure functions – no DOM access)
// =====================================================================
import { STRATEGIES, NEGATIVE_IDS, IMPACT_RADIUS_M, METERS_PER_DEGREE } from './config.js';

const MAX_COMBINED_FACTOR = 1.5; // cap on (intensity × deployments) per strategy
const MAX_REDUCTION = 0.95;      // never reduce more than 95%

/** Pollutant weighting: how strongly a strategy affects the selected layer. */
function layerWeight(type, s) {
    let w = 0.5;
    if (type.includes('pm') && s.max_pol > 0.4) w = 1.0;
    if ((type === 'co' || type === 'no2') && s.id === 'ev') w = 1.2;
    if (type === 'aqi' && s.max_pol > 0.3) w = 0.8;
    return w;
}

/**
 * City-wide effect of all deployed interventions.
 * An intervention only counts if its slider > 0 AND it is placed on the map.
 *
 * @param {object} p
 * @param {object} p.liveData   current pollutant levels
 * @param {object} p.sliders    { strategyId: 0–100 }
 * @param {Array}  p.placements placed markers
 * @param {string} p.type       selected layer (pm2_5 | pm10 | co | no2 | co2 | aqi)
 */
export function computeProjection({ liveData, sliders, placements, type }) {
    const counts = {};
    placements.forEach(p => { counts[p.strategyId] = (counts[p.strategyId] || 0) + 1; });

    let totalPolRed = 0, totalCo2Red = 0, totalPolInc = 0, totalCo2Inc = 0;

    STRATEGIES.forEach(s => {
        const v = sliders[s.id] || 0;
        const markerCount = counts[s.id] || 0;
        if (v <= 0 || markerCount <= 0) return;

        const f = Math.min((v / 100) * markerCount, MAX_COMBINED_FACTOR);
        const w = layerWeight(type, s);

        if (NEGATIVE_IDS.has(s.id)) {
            totalPolInc += s.max_pol * f * w * 0.4;
            totalCo2Inc += s.max_co2 * f;
        } else {
            totalPolRed += s.max_pol * f * w * 0.4;
            totalCo2Red += s.max_co2 * f * 0.5;
        }
    });

    totalPolRed = Math.min(totalPolRed, MAX_REDUCTION);
    totalCo2Red = Math.min(totalCo2Red, MAX_REDUCTION);

    const netFactorPol = (1 - totalPolRed) * (1 + totalPolInc);
    const netFactorCo2 = (1 - totalCo2Red) * (1 + totalCo2Inc);

    const projected = {
        pm2_5: liveData.pm2_5 * netFactorPol,
        pm10:  liveData.pm10  * netFactorPol,
        co:    liveData.co    * netFactorPol,
        no2:   liveData.no2   * netFactorPol,
    };

    return { totalPolRed, totalPolInc, totalCo2Red, totalCo2Inc, netFactorPol, netFactorCo2, projected };
}

/**
 * Local effect at a map point: each placed marker influences points within
 * IMPACT_RADIUS_M, decreasing linearly with distance.
 */
export function localImpact(lng, lat, placements, sliders) {
    let reduction = 0;
    let increase = 0;

    placements.forEach(p => {
        const v = (sliders[p.strategyId] || 0) / 100;
        if (v <= 0) return;

        const dx = (lng - p.lngLat.lng) * METERS_PER_DEGREE;
        const dy = (lat - p.lngLat.lat) * METERS_PER_DEGREE;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist >= IMPACT_RADIUS_M) return;

        const effect = (1 - dist / IMPACT_RADIUS_M) * v * 0.5;
        if (NEGATIVE_IDS.has(p.strategyId)) increase += effect;
        else reduction += effect;
    });

    return { red: Math.min(reduction, 0.9), inc: increase };
}

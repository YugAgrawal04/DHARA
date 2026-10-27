// =====================================================================
// App configuration. No API keys live here – all keys stay in backend/.env
// =====================================================================

/**
 * Where the backend API lives. Empty string = same origin (backend serves the
 * frontend). To run the frontend separately, set window.DHARA_API_BASE before
 * main.js loads, e.g. <script>window.DHARA_API_BASE = 'http://localhost:4000'</script>
 */
export const API_BASE = (window.DHARA_API_BASE ?? '').replace(/\/$/, '');

export const DEFAULT_LOCATION = { lat: 18.625, lon: 73.855, label: 'Bhosari, Pune' };

export const MAP_CONFIG = {
    style: 'https://tiles.openfreemap.org/styles/liberty',
    zoom: 15,
    searchZoom: 14,
    pitch: 60,
    bearing: -20,
};

export const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // refetch live data every 15 min
export const RETRY_INTERVAL_MS = 2 * 60 * 1000;    // retry after total failure
export const REQUEST_TIMEOUT_MS = 20000;           // backend may try two providers
export const REPORT_TIMEOUT_MS = 40000;

/** Used until live data arrives, or if every API fails. Units: µg/m³ */
export const FALLBACK_DATA = { pm2_5: 55, pm10: 90, co: 600, no2: 40 };

/** Reference CO₂e index for the simulation (relative units). */
export const CO2_BASELINE = 1000;

/**
 * Intervention catalogue.
 *  max_co2 – max fractional CO₂ change at 100% intensity
 *  max_pol – max fractional pollutant change at 100% intensity
 */
export const STRATEGIES = [
    { id: 'timber',    category: 'positive', title: 'Timber Construction', desc: 'Replace concrete with timber.',  label: '% Adoption', max_co2: 0.35, max_pol: 0.10, icon: '🏗️', color: '#8b5cf6' },
    { id: 'cement',    category: 'positive', title: 'Green Cement',        desc: 'Use low-clinker alternatives.', label: '% Mix',      max_co2: 0.30, max_pol: 0.05, icon: '🏭', color: '#06b6d4' },
    { id: 'retrofit',  category: 'positive', title: 'Retrofit Policy',     desc: 'Renovate instead of demolish.', label: '% Projects', max_co2: 0.90, max_pol: 0.60, icon: '🔧', color: '#10b981' },
    { id: 'transport', category: 'positive', title: 'Public Transit',      desc: 'Shift to light-rail/metro.',    label: '% Shift',    max_co2: 0.50, max_pol: 0.40, icon: '🚇', color: '#f59e0b' },
    { id: 'ev',        category: 'positive', title: 'EV Adoption',         desc: 'Electrify vehicle fleet.',      label: '% Fleet',    max_co2: 0.65, max_pol: 0.50, icon: '⚡', color: '#eab308' },
    { id: 'trees',     category: 'positive', title: 'Urban Greening',      desc: 'Expand tree canopy.',           label: '% Target',   max_co2: 0.15, max_pol: 0.20, icon: '🌳', color: '#22c55e' },
    { id: 'ccs',       category: 'positive', title: 'Industrial CCS',      desc: 'Carbon capture on stacks.',     label: '% Stacks',   max_co2: 0.75, max_pol: 0.30, icon: '🏭', color: '#ef4444' },
    // Negative intervention / stressor
    { id: 'parali',    category: 'negative', title: 'Parali Burning',      desc: 'Source: 1 tonne = 1460kg CO₂',  label: '100s Tons',  max_co2: 1.46, max_pol: 0.80, icon: '🔥', color: '#dc2626' },
];

export const NEGATIVE_IDS = new Set(STRATEGIES.filter(s => s.category === 'negative').map(s => s.id));

/** Synthetic pollution hotspots around the selected location (offsets in degrees). */
export const HOTSPOTS = [
    { dLng: -0.003, dLat:  0.002, type: 'industrial',   baseMultiplier: 1.8, radius: 0.008 },
    { dLng:  0.002, dLat:  0.000, type: 'traffic',      baseMultiplier: 1.6, radius: 0.007 },
    { dLng: -0.001, dLat: -0.002, type: 'construction', baseMultiplier: 1.7, radius: 0.006 },
    { dLng:  0.004, dLat:  0.003, type: 'residential',  baseMultiplier: 1.0, radius: 0.009 },
    { dLng: -0.004, dLat: -0.001, type: 'traffic',      baseMultiplier: 1.4, radius: 0.006 },
];
export const POINTS_PER_HOTSPOT = 60;
export const IMPACT_RADIUS_M = 500;
export const METERS_PER_DEGREE = 111000;

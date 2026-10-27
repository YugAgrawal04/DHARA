import { DEFAULT_LOCATION, FALLBACK_DATA, CO2_BASELINE, STRATEGIES } from './config.js';

/** Single shared, mutable application state. */
export const state = {
    map: null,
    currentLocation: { ...DEFAULT_LOCATION },
    liveData: { ...FALLBACK_DATA, co2_baseline: CO2_BASELINE },

    currentAQI: { value: 0, category: 'Unknown', color: '#64748b' },
    projectedAQI: { value: 0, category: 'Unknown', color: '#64748b' },

    dataStatus: {
        lastFetch: null,
        isLive: false,
        source: 'initializing',
        sourceName: '',
        apiHealth: 'unknown',
        validationPassed: false,
    },

    /** Slider value (0–100) per strategy id */
    sliders: Object.fromEntries(STRATEGIES.map(s => [s.id, 0])),

    /** markerId -> { markerId, strategyId, lngLat, screenX, screenY } */
    placements: {},
    markerCounter: 0,
};

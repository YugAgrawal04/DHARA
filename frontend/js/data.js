// =====================================================================
// Live data fetching, location search and auto-refresh
// =====================================================================
import { fetchAirQuality, geocode } from './api.js';
import { logAudit } from './audit.js';
import { CO2_BASELINE, REFRESH_INTERVAL_MS, RETRY_INTERVAL_MS } from './config.js';
import { updateSim } from './controller.js';
import { flyTo } from './map.js';
import { state } from './state.js';
import { $, updateStatus } from './ui.js';

let refreshTimer = null;
let requestSeq = 0; // ignores stale responses if the location changes mid-request

function schedule(ms) {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(initiateDataFetch, ms);
}

function logFailedAttempts(attempts = []) {
    attempts
        .filter(a => a.status === 'FAILED')
        .forEach(a => logAudit(`${a.role.toUpperCase()}_FAILED`, `${a.source}: ${a.error}`, 'FAILED'));
}

export async function initiateDataFetch() {
    clearTimeout(refreshTimer);
    const seq = ++requestSeq;
    const { lat, lon, label } = state.currentLocation;

    updateStatus('fetching', 'Connecting to data server...');
    logAudit('FETCH_INITIATED', `Requesting live data for ${label}`, 'INITIATED');

    try {
        const res = await fetchAirQuality(lat, lon);
        if (seq !== requestSeq) return;

        logFailedAttempts(res.attempts);
        if (res.role === 'secondary') {
            logAudit('FAILOVER_TRIGGERED', 'Primary unavailable – served by secondary API', 'WARNING');
        }

        state.liveData = { ...res.data, co2_baseline: CO2_BASELINE };
        state.dataStatus = {
            lastFetch: new Date(),
            isLive: true,
            source: res.role,
            sourceName: res.sourceName,
            apiHealth: 'healthy',
            validationPassed: true,
        };

        updateStatus(res.role === 'primary' ? 'success' : 'warning',
            `Live: ${res.sourceName}${res.cached ? ' (cached)' : ''}`);
        logAudit('DATA_UPDATE', `Updated via ${res.sourceName}${res.cached ? ' (server cache)' : ''}`, 'SUCCESS');

        updateSim();
        schedule(REFRESH_INTERVAL_MS);
    } catch (err) {
        if (seq !== requestSeq) return;
        logFailedAttempts(err.details?.attempts);
        logAudit('TOTAL_FAILURE', err.message, 'FAILED');
        handleTotalFailure();
    }
}

function handleTotalFailure() {
    state.dataStatus = { ...state.dataStatus, apiHealth: 'failed', source: 'fallback', sourceName: 'Fallback' };
    updateStatus('fallback', 'System Offline (Using Fallback)');
    logAudit('FALLBACK_ACTIVATED', 'Using last known / default simulation data', 'FALLBACK');
    updateSim();
    schedule(RETRY_INTERVAL_MS);
}

export function setLocation(lat, lon, label) {
    state.currentLocation = { lat, lon, label: label || `${lat.toFixed(3)}, ${lon.toFixed(3)}` };
    $('location-status').textContent = state.currentLocation.label;
    flyTo(lat, lon);
    initiateDataFetch();
}

export async function searchLocation() {
    const q = $('location-input').value.trim();
    const status = $('location-status');
    if (!q) return;

    status.textContent = 'Searching...';
    try {
        const place = await geocode(q);
        setLocation(place.lat, place.lon, place.label);
    } catch (err) {
        console.error(err);
        status.textContent = err.status === 404 ? `No results found for "${q}"` : 'Search failed. Try a different name.';
    }
}

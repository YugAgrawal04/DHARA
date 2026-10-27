// =====================================================================
// Backend API client. The browser never talks to third-party APIs that
// need keys – everything goes through our own server.
// =====================================================================
import { API_BASE, REQUEST_TIMEOUT_MS, REPORT_TIMEOUT_MS } from './config.js';

async function request(path, { timeoutMs = REQUEST_TIMEOUT_MS, ...options } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(`${API_BASE}${path}`, { ...options, signal: controller.signal });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            const err = new Error(body.error || `HTTP ${res.status}`);
            err.status = res.status;
            err.details = body.details;
            throw err;
        }
        return body;
    } catch (err) {
        if (err.name === 'AbortError') throw new Error(`Request timed out after ${timeoutMs / 1000}s`);
        if (err instanceof TypeError) throw new Error('Cannot reach DHARA server – is the backend running?');
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

/** Live pollutant levels with server-side failover (Open-Meteo → OpenWeatherMap). */
export function fetchAirQuality(lat, lon) {
    return request(`/api/air-quality?lat=${lat}&lon=${lon}`);
}

/** Place name → { lat, lon, label } */
export function geocode(query) {
    return request(`/api/geocode?q=${encodeURIComponent(query)}`);
}

/** Scenario → AI-written report text */
export function generateReport(scenario) {
    return request('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenario),
        timeoutMs: REPORT_TIMEOUT_MS,
    });
}

// =====================================================================
// MapLibre map: 3D buildings + pollution heatmap
// =====================================================================
/* global maplibregl */
import { MAP_CONFIG, HOTSPOTS, POINTS_PER_HOTSPOT } from './config.js';
import { localImpact } from './simulation.js';
import { state } from './state.js';

const HEATMAP_PAINT = {
    'heatmap-weight': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0, 1, 1],
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 2, 18, 3],
    'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(0,0,0,0)',
        0.1, 'rgba(56, 189, 248, 0.6)',
        0.3, 'rgba(16, 185, 129, 0.7)',
        0.5, 'rgba(250, 204, 21, 0.8)',
        0.7, 'rgba(251, 146, 60, 0.85)',
        1, 'rgba(239, 68, 68, 0.9)',
    ],
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 30, 18, 50],
    'heatmap-opacity': 0.8,
};

function showMapError(message) {
    const el = document.getElementById('map-error');
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
}

/** Creates the map and calls onReady() once layers are added. */
export function initMap(onReady) {
    const { lat, lon } = state.currentLocation;

    if (typeof maplibregl === 'undefined') {
        showMapError('Map library could not load (unpkg.com may be blocked on this network). Data and simulation still work.');
        return null;
    }

    const map = new maplibregl.Map({
        container: 'map',
        style: MAP_CONFIG.style,
        center: [lon, lat],
        zoom: MAP_CONFIG.zoom,
        pitch: MAP_CONFIG.pitch,
        bearing: MAP_CONFIG.bearing,
        antialias: true,
    });
    state.map = map;

    let loaded = false;
    map.on('error', (e) => {
        console.error('[MAP]', e.error || e);
        if (!loaded) showMapError('Map tiles could not load (tiles.openfreemap.org may be blocked on this network). Data and simulation still work.');
    });

    map.on('load', () => {
        loaded = true;
        document.getElementById('map-error')?.setAttribute('hidden', '');

        map.addLayer({
            id: 'dhara-3d-buildings',
            source: 'openmaptiles', // vector source name in the OpenFreeMap "liberty" style
            'source-layer': 'building',
            type: 'fill-extrusion',
            minzoom: 13,
            paint: {
                'fill-extrusion-color': '#222',
                'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 13, 0, 13.05, ['get', 'render_height']],
                'fill-extrusion-base': ['get', 'render_min_height'],
                'fill-extrusion-opacity': 0.9,
            },
        });

        map.addSource('pollution', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: 'pollution-heat', type: 'heatmap', source: 'pollution', maxzoom: 20, paint: HEATMAP_PAINT });

        onReady(map);
    });

    return map;
}

export function flyTo(lat, lon) {
    state.map?.flyTo({ center: [lon, lat], zoom: MAP_CONFIG.searchZoom, essential: true });
}

/**
 * Scatters weighted points around synthetic hotspots and applies both the
 * city-wide and the local (distance-based) intervention effects.
 */
export function drawHeatCloud({ intensity, mode, totalReduction, totalIncrease }) {
    const source = state.map?.getSource('pollution');
    if (!source) return;

    const { lat: cLat, lon: cLon } = state.currentLocation;
    const placements = Object.values(state.placements);
    const features = [];

    HOTSPOTS.forEach(h => {
        const hLng = cLon + h.dLng;
        const hLat = cLat + h.dLat;

        for (let i = 0; i < POINTS_PER_HOTSPOT; i++) {
            const r = h.radius * Math.sqrt(Math.random());
            const theta = Math.random() * 2 * Math.PI;
            const lng = hLng + r * Math.cos(theta);
            const lat = hLat + r * Math.sin(theta);

            const local = localImpact(lng, lat, placements, state.sliders);

            let val = mode === 'aqi'
                ? (intensity / 300) * h.baseMultiplier * (1 - local.red) * (1 + local.inc)
                : (intensity / 100) * h.baseMultiplier
                    * (1 - totalReduction * 0.5) * (1 + totalIncrease)
                    * (1 - local.red) * (1 + local.inc);

            val *= 0.8 + Math.random() * 0.4;
            val = Math.min(val, 1);

            if (val > 0.05) {
                features.push({
                    type: 'Feature',
                    properties: { intensity: val },
                    geometry: { type: 'Point', coordinates: [lng, lat] },
                });
            }
        }
    });

    source.setData({ type: 'FeatureCollection', features });
}

// =====================================================================
// Interventions panel + draggable map markers
// =====================================================================
import { STRATEGIES, NEGATIVE_IDS } from './config.js';
import { requestSim, updateSim } from './controller.js';
import { state } from './state.js';
import { $ } from './ui.js';

const MARKER_HALF = 30;  // marker is 60×60 px
const ZONE_HALF = 100;   // impact zone is 200×200 px

let dragged = null; // { element, markerId }

/** Renders one card per strategy into the positive / negative sections. */
export function buildPanel() {
    const sections = { positive: $('int-positive-section'), negative: $('int-negative-section') };

    STRATEGIES.forEach(s => {
        sections[s.category].insertAdjacentHTML('beforeend', `
            <div class="int-group" data-intervention="${s.id}" data-category="${s.category}">
                <div class="int-header">
                    <span class="int-title" draggable="true" data-id="${s.id}">
                        <span class="drag-handle">⋮⋮</span>${s.icon} ${s.title}
                    </span>
                    <span class="int-perc" id="disp-${s.id}">0</span>
                </div>
                <div class="int-desc">${s.desc}</div>
                <input type="range" id="${s.id}" data-strategy="${s.id}" min="0" max="100" value="0" aria-label="${s.title} ${s.label}">
            </div>`);
    });

    $('int-container').addEventListener('input', (e) => {
        if (e.target.matches('input[type=range][data-strategy]')) {
            onSliderChange(e.target.dataset.strategy, parseInt(e.target.value, 10));
        }
    });
}

function onSliderChange(id, value) {
    state.sliders[id] = value;
    $(`disp-${id}`).textContent = value + (NEGATIVE_IDS.has(id) ? '0 T' : '%');

    document
        .querySelectorAll(`.intervention-marker[data-strategy-id="${id}"], .impact-zone[data-strategy-id="${id}"]`)
        .forEach(el => el.classList.toggle('active', value > 0));

    updateSim();
}

/** Panel → map drag-and-drop, and moving / deleting placed markers. */
export function setupDragAndDrop() {
    const mapEl = $('map');

    document.querySelectorAll('.int-title').forEach(title => {
        title.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('intervention-id', title.dataset.id);
            title.classList.add('dragging');
        });
        title.addEventListener('dragend', () => title.classList.remove('dragging'));
    });

    mapEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });
    mapEl.addEventListener('drop', (e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('intervention-id');
        if (id) placeIntervention(id, e.clientX, e.clientY);
    });

    const markersLayer = $('intervention-markers');
    markersLayer.addEventListener('click', (e) => {
        const btn = e.target.closest('.marker-delete');
        if (btn) {
            e.stopPropagation();
            deleteMarker(btn.dataset.markerId);
        }
    });

    document.addEventListener('mousedown', (e) => {
        if (e.target.closest('.marker-delete')) return;
        const marker = e.target.closest('.intervention-marker');
        if (!marker) return;
        dragged = { element: marker, markerId: marker.dataset.markerId };
        marker.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!dragged) return;
        moveMarker(dragged.markerId, e.clientX, e.clientY);
        requestSim();
    });

    document.addEventListener('mouseup', () => {
        if (!dragged) return;
        dragged.element.style.cursor = 'move';
        dragged = null;
    });
}

/** Each drop creates a NEW marker, so one strategy can be deployed many times. */
export function placeIntervention(strategyId, x, y) {
    const strategy = STRATEGIES.find(s => s.id === strategyId);
    if (!strategy || !state.map) return;

    const markerId = `${strategyId}-${Date.now()}-${state.markerCounter++}`;
    const active = (state.sliders[strategyId] || 0) > 0;

    const zone = document.createElement('div');
    zone.className = 'impact-zone' + (active ? ' active' : '');
    zone.dataset.markerId = markerId;
    zone.dataset.strategyId = strategyId;
    zone.style.borderColor = strategy.color;

    const marker = document.createElement('div');
    marker.className = 'intervention-marker' + (active ? ' active' : '');
    marker.dataset.markerId = markerId;
    marker.dataset.strategyId = strategyId;
    marker.style.background = strategy.color;
    marker.style.borderColor = strategy.color;
    marker.innerHTML = `
        <span class="marker-icon">${strategy.icon}</span>
        <div class="marker-label" style="color:${strategy.color}">${strategy.title}</div>
        <button class="marker-delete" type="button" title="Remove" data-marker-id="${markerId}">×</button>`;

    $('intervention-markers').append(zone, marker);

    state.placements[markerId] = { markerId, strategyId, lngLat: state.map.unproject([x, y]), screenX: x, screenY: y };
    positionElements(markerId, x, y);
    updateSim();
}

function deleteMarker(markerId) {
    document.querySelectorAll(`[data-marker-id="${markerId}"]`).forEach(el => {
        if (!el.classList.contains('marker-delete')) el.remove();
    });
    delete state.placements[markerId];
    updateSim();
}

function moveMarker(markerId, x, y) {
    const p = state.placements[markerId];
    if (!p) return;
    p.lngLat = state.map.unproject([x, y]);
    p.screenX = x;
    p.screenY = y;
    positionElements(markerId, x, y);
}

function positionElements(markerId, x, y) {
    const marker = document.querySelector(`.intervention-marker[data-marker-id="${markerId}"]`);
    const zone = document.querySelector(`.impact-zone[data-marker-id="${markerId}"]`);
    if (marker) {
        marker.style.left = `${x - MARKER_HALF}px`;
        marker.style.top = `${y - MARKER_HALF}px`;
    }
    if (zone) {
        zone.style.left = `${x - ZONE_HALF}px`;
        zone.style.top = `${y - ZONE_HALF}px`;
    }
}

/** Keeps markers pinned to their geographic position when the map pans/zooms. */
export function updateMarkerPositions() {
    Object.values(state.placements).forEach(p => {
        if (dragged?.markerId === p.markerId) return;
        const pt = state.map.project(p.lngLat);
        positionElements(p.markerId, pt.x, pt.y);
    });
}

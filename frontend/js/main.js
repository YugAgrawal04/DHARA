// =====================================================================
// DHARA – entry point: wires modules and DOM events together
// =====================================================================
import { updateSim } from './controller.js';
import { initiateDataFetch, searchLocation } from './data.js';
import { buildPanel, setupDragAndDrop, updateMarkerPositions } from './interventions.js';
import { initMap } from './map.js';
import { closeReportModal, runReport } from './report.js';
import { $, renderAQIScale, showAuditLog } from './ui.js';

function bindEvents() {
    $('location-go').addEventListener('click', searchLocation);
    $('location-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') searchLocation(); });
    $('pollutant').addEventListener('change', updateSim);

    $('btn-report').addEventListener('click', runReport);
    $('btn-audit').addEventListener('click', showAuditLog);

    $('gemini-close').addEventListener('click', closeReportModal);
    $('gemini-modal').addEventListener('click', (e) => { if (e.target.id === 'gemini-modal') closeReportModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeReportModal(); });
}

function start() {
    renderAQIScale();
    buildPanel();
    bindEvents();
    setupDragAndDrop();

    // Data does not depend on the map – start fetching immediately
    initiateDataFetch();

    initMap((map) => {
        map.on('move', updateMarkerPositions);
        map.on('zoom', updateMarkerPositions);
        updateSim(); // draw the heatmap now that the map is ready
    });
}

start();

// =====================================================================
// Simulation controller – connects state → model → UI + map
// =====================================================================
import { getOverallAQI } from './aqi.js';
import { drawHeatCloud } from './map.js';
import { computeProjection } from './simulation.js';
import { state } from './state.js';
import { $, renderCo2Card, renderMetrics, updateAQIDisplay } from './ui.js';

/** Re-runs the simulation and refreshes every output. */
export function updateSim() {
    const type = $('pollutant').value;
    const { liveData } = state;

    const result = computeProjection({
        liveData,
        sliders: state.sliders,
        placements: Object.values(state.placements),
        type,
    });

    state.currentAQI = getOverallAQI(liveData);
    state.projectedAQI = getOverallAQI(result.projected);

    let base, final;
    if (type === 'aqi') {
        base = state.currentAQI.value;
        final = state.projectedAQI.value;
    } else if (type === 'co2') {
        base = liveData.co2_baseline;
        final = base * result.netFactorCo2;
    } else {
        base = liveData[type];
        final = base * result.netFactorPol;
    }

    renderMetrics(type, base, final);
    renderCo2Card(result.netFactorCo2);
    updateAQIDisplay(state.currentAQI, state.projectedAQI);
    drawHeatCloud({
        intensity: final,
        mode: type,
        totalReduction: result.totalPolRed,
        totalIncrease: result.totalPolInc,
    });
}

let frameRequested = false;

/** Batches rapid updates (e.g. marker dragging) into one per animation frame. */
export function requestSim() {
    if (frameRequested) return;
    frameRequested = true;
    requestAnimationFrame(() => {
        frameRequested = false;
        updateSim();
    });
}

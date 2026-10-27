// =====================================================================
// AI report (Gemini, called through the backend)
// =====================================================================
import { generateReport } from './api.js';
import { STRATEGIES } from './config.js';
import { state } from './state.js';
import { $, escapeHtml } from './ui.js';

function buildScenario() {
    const placements = Object.values(state.placements);

    const interventions = STRATEGIES
        .filter(s => state.sliders[s.id] > 0)
        .map(s => ({
            title: s.title,
            value: state.sliders[s.id],
            count: placements.filter(p => p.strategyId === s.id).length,
        }));

    return {
        location: state.currentLocation.label,
        currentAQI: { value: Math.round(state.currentAQI.value), category: state.currentAQI.category },
        projectedAQI: { value: Math.round(state.projectedAQI.value), category: state.projectedAQI.category },
        co2Change: $('val-co2').textContent,
        interventions,
    };
}

export function closeReportModal() {
    $('gemini-modal').hidden = true;
}

export async function runReport() {
    const modal = $('gemini-modal');
    const content = $('gemini-content');
    const button = $('btn-report');

    modal.hidden = false;
    button.disabled = true;
    content.innerHTML = '<div class="report-loading">🔄 Generating report using Google Gemini…<br><small>Please wait...</small></div>';

    try {
        const { report, model, generatedAt } = await generateReport(buildScenario());
        content.innerHTML = `
            <div class="report-success">✓ Report Generated Successfully</div>
            <div class="report-text"></div>
            <div class="report-meta">${escapeHtml(model)} · ${new Date(generatedAt).toLocaleString()}</div>`;
        content.querySelector('.report-text').textContent = report; // plain text, never HTML
    } catch (err) {
        content.innerHTML = `
            <div class="report-error">
                <strong>⚠ Error:</strong> ${escapeHtml(err.message)}<br>
                <small>If you see "Limit: 0", click "Set up billing" in AI Studio (it stays free).</small>
            </div>`;
    } finally {
        button.disabled = false;
    }
}

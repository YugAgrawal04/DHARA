// =====================================================================
// DOM rendering helpers for metrics, status and modals
// =====================================================================
import { AQI_CATEGORIES } from './aqi.js';
import { getAuditLog } from './audit.js';
import { state } from './state.js';

export const $ = (id) => document.getElementById(id);

export function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Builds the AQI colour scale legend from the category table. */
export function renderAQIScale() {
    $('aqi-scale-rows').innerHTML = AQI_CATEGORIES.map(c => `
        <div class="scale-row">
            <div class="scale-swatch" style="background:${c.color}"></div>
            <span>${c.min}${c.max === 500 ? '+' : '-' + c.max} ${c.short}</span>
        </div>`).join('');
}

export function updateAQIDisplay(current, projected) {
    $('val-aqi').textContent = current.value;
    const badge = $('aqi-badge');
    badge.textContent = current.category;
    badge.style.background = current.color;
    $('aqi-card').style.borderLeftColor = current.color;

    const diff = current.value - projected.value;
    $('aqi-change').innerHTML =
        diff > 0 ? `<span class="better">▼ ${diff} pts better</span>` :
        diff < 0 ? `<span class="worse">▲ ${Math.abs(diff)} pts worse</span>` : 'No change';

    ['pm2_5', 'pm10', 'co', 'no2'].forEach(p => {
        $(`aqi-${p.replace('_', '')}`).textContent = current.individual[p];
    });

    const desc = $('aqi-description');
    desc.textContent = current.description;
    desc.style.background = current.color + '20';
    desc.style.borderLeft = `3px solid ${current.color}`;
}

/** Current vs projected value cards for the selected layer. */
export function renderMetrics(type, base, final) {
    const labels = {
        aqi: ['Current AQI', 'Projected AQI'],
        co2: ['Current CO₂e', 'Projected CO₂e'],
    }[type] || ['Current Level', 'Projected Level'];
    const unit = (type === 'aqi' || type === 'co2') ? '' : ' <span class="unit">(µg/m³)</span>';

    const fmt = (type === 'aqi' || type === 'co2') ? (v => Math.round(v)) : (v => v.toFixed(1));

    $('lbl-cur').innerHTML = labels[0] + unit;
    $('lbl-sim').innerHTML = labels[1] + unit;
    $('val-cur').textContent = fmt(base);
    $('val-sim').textContent = fmt(final);
}

export function renderCo2Card(netFactorCo2) {
    const card = $('co2-card');
    const label = $('lbl-co2');
    const val = $('val-co2');
    const netChange = (netFactorCo2 - 1) * 100;

    if (netChange > 0.1) {
        card.style.borderLeftColor = '#dc2626';
        card.style.background = 'rgba(239, 68, 68, 0.05)';
        label.textContent = 'Total CO₂e INCREASE';
        val.textContent = `+${netChange.toFixed(0)}%`;
        val.style.color = '#dc2626';
    } else {
        card.style.borderLeftColor = '#10b981';
        card.style.background = 'rgba(16, 185, 129, 0.05)';
        label.textContent = 'Total CO₂e Reduction';
        val.textContent = `${netChange.toFixed(0)}%`;
        val.style.color = '#34d399';
    }
}

const STATUS_COLORS = { success: '#10b981', warning: '#f59e0b', error: '#ef4444', fallback: '#8b5cf6', fetching: '#3b82f6' };

export function updateStatus(type, msg) {
    $('status-indicator').style.background = STATUS_COLORS[type] || '#64748b';
    $('status-text').textContent = msg;
    const { lastFetch } = state.dataStatus;
    $('status-time').textContent = lastFetch ? `Updated: ${lastFetch.toLocaleTimeString()}` : 'Waiting...';
}

const AUDIT_COLORS = { SUCCESS: '#10b981', FAILED: '#ef4444', WARNING: '#f59e0b', INITIATED: '#3b82f6', FALLBACK: '#a855f7' };

export function showAuditLog() {
    const { source, sourceName, apiHealth } = state.dataStatus;
    const srcColor = source === 'primary' ? '#10b981' : source === 'secondary' ? '#f59e0b' : '#8b5cf6';

    const events = getAuditLog().map(e => `
        <div class="audit-event">
            <div class="audit-event-head">
                <span class="action">${escapeHtml(e.action)}</span>
                <span class="status" style="color:${AUDIT_COLORS[e.status] || '#64748b'}">${escapeHtml(e.status)}</span>
            </div>
            <div class="time">${escapeHtml(e.timestamp)}</div>
            <div class="details">${escapeHtml(e.details)}</div>
        </div>`).join('');

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
        <div class="modal-card">
            <div class="audit-head">
                <h3>Security &amp; Failover Log</h3>
                <button class="btn-danger" type="button" data-close>Close</button>
            </div>
            <div class="audit-summary">
                <div class="audit-label">ACTIVE SOURCE</div>
                <div class="audit-grid">
                    <div><span class="key">Current API:</span> <span class="val" style="color:${srcColor}">${escapeHtml(sourceName || source)}</span></div>
                    <div><span class="key">Status:</span> <span class="val" style="color:${apiHealth === 'healthy' ? '#10b981' : '#ef4444'}">${escapeHtml(apiHealth)}</span></div>
                </div>
            </div>
            <div class="audit-label">SYSTEM EVENTS</div>
            <div class="audit-events">${events || '<div class="details">No events yet.</div>'}</div>
        </div>`;

    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop || e.target.hasAttribute('data-close')) backdrop.remove();
    });
    document.body.appendChild(backdrop);
}

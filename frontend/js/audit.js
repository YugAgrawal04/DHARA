// =====================================================================
// Audit log – records every data fetch, failover and fallback event
// =====================================================================
import { state } from './state.js';

const MAX_ENTRIES = 50;
const auditLog = [];

function hashData(d) {
    return JSON.stringify(d).split('')
        .reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)
        .toString(16);
}

export function logAudit(action, details, status) {
    auditLog.unshift({
        timestamp: new Date().toISOString(),
        action,
        details,
        status,
        dataHash: hashData(state.liveData),
    });
    if (auditLog.length > MAX_ENTRIES) auditLog.pop();
    console.log('[AUDIT]', action, status);
}

export function getAuditLog() {
    return auditLog;
}

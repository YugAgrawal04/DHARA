/**
 * fetch() with a timeout that parses JSON and throws a readable error
 * for non-2xx responses. Uses the global fetch built into Node 18+.
 */
export async function fetchJson(url, { timeoutMs = 8000, ...options } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const body = await res.json().catch(() => null);

    if (!res.ok) {
      const message = body?.error?.message || body?.message || body?.reason || `HTTP ${res.status}`;
      const err = new Error(message);
      err.status = res.status;
      throw err;
    }
    return body;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs} ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Talks to the CodeMate AI backend. Handles the anonymous session and token refresh.
class ApiError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.code = code;
    Object.assign(this, extra);
  }
}

const Api = (() => {
  async function request(path, { method = 'POST', body, token } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);
    let res;
    try {
      res = await fetch(CONFIG.BACKEND_URL + path, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (err) {
      if (err?.name === 'AbortError') throw new ApiError('TIMEOUT', 'The request took too long. Check your connection and try again.');
      throw new ApiError('NETWORK', 'Cannot reach the CodeMate AI server. Check your internet connection, or try again in a minute.');
    } finally {
      clearTimeout(timer);
    }
    let json = null;
    try { json = await res.json(); } catch { /* non-JSON error page */ }
    if (!res.ok || !json?.ok) {
      const e = json?.error || {};
      throw new ApiError(e.code || 'SERVER', e.message || `Server error (${res.status}).`, {
        status: res.status,
        quota: json?.quota,
        requestId: json?.requestId || res.headers.get('x-request-id') || undefined,
      });
    }
    return json;
  }

  async function getSession(force = false) {
    const saved = await chrome.storage.local.get(['installId', 'token', 'tokenExp']);
    if (!force && saved.token && saved.tokenExp > Date.now() + 60000) return saved;
    const r = await request('/api/session', { body: { installId: saved.installId } });
    const session = { installId: r.installId, token: r.token, tokenExp: Date.now() + r.expiresInSeconds * 1000, quota: r.quota };
    await chrome.storage.local.set({ installId: session.installId, token: session.token, tokenExp: session.tokenExp });
    return session;
  }

  async function solve(payload) {
    let session = await getSession(false);
    try {
      return await request('/api/solve', { body: payload, token: session.token });
    } catch (err) {
      if (err.status === 401) {
        session = await getSession(true); // token expired or rejected: refresh once
        return request('/api/solve', { body: payload, token: session.token });
      }
      throw err;
    }
  }

  return { solve };
})();

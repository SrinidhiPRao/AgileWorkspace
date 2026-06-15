const API_BASE = '/api/v1';  // all resource endpoints
const ROOT_BASE = '/api/v1';         // auth endpoints (/login/*, /signup)

export class ApiError extends Error {
  constructor(status, code, message, details = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Normalise FastAPI error shapes into a consistent object.
 *
 * FastAPI can return:
 *   { detail: "string message" }
 *   { detail: [{ loc, msg, type }, ...] }   ← Pydantic validation errors
 *   { error: { code, message, details } }   ← our own contract shape
 */
function parseError(json, httpStatus) {
  if (json?.error?.message) {
    return { code: json.error.code ?? 'API_ERROR', message: json.error.message, details: json.error.details ?? [] };
  }
  if (typeof json?.detail === 'string') {
    return { code: 'API_ERROR', message: json.detail, details: [] };
  }
  if (Array.isArray(json?.detail)) {
    const msgs = json.detail.map(e => `${e.loc?.slice(1).join('.')} — ${e.msg}`).join('; ');
    return { code: 'VALIDATION_ERROR', message: msgs || 'Validation error.', details: json.detail };
  }
  return { code: 'UNKNOWN_ERROR', message: `HTTP ${httpStatus}`, details: [] };
}

/**
 * Core fetch wrapper.
 *
 * @param {string}  path         - e.g. "/backlogs" or "/login/access-token"
 * @param {object}  [options]    - fetch init (method, body, headers, …)
 * @param {object}  [query]      - key/value pairs serialised as query string
 * @param {boolean} [rootBase]   - if true, uses ROOT_BASE instead of API_BASE
 */
export async function request(path, options = {}, query = {}, rootBase = false) {
  const token = sessionStorage.getItem('aw_token');

  const callerHeaders = options.headers ?? {};
  const headers = {
    ...(!callerHeaders['Content-Type'] ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...callerHeaders,
  };

  const qs = Object.entries(query)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const base = rootBase ? ROOT_BASE : API_BASE;
  const url = `${base}${path}${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, { ...options, headers });

  if (res.status === 204) return undefined;

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) sessionStorage.removeItem('aw_token');
    const { code, message, details } = parseError(json, res.status);
    throw new ApiError(res.status, code, message, details);
  }

  return json;
}

// Convenience helpers for API_BASE endpoints (all non-auth calls)
export const get = (path, query, opts = {}) => request(path, { method: 'GET', ...opts }, query);
export const post = (path, body, opts = {}) => request(path, { method: 'POST', body: JSON.stringify(body), ...opts });
export const patch = (path, body, opts = {}) => request(path, { method: 'PATCH', body: JSON.stringify(body), ...opts });
export const del = (path, opts = {}) => request(path, { method: 'DELETE', ...opts });
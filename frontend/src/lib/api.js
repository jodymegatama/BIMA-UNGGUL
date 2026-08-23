// Dev: kosong → same-origin via proxy Vite (vite.config.js server.proxy '/api').
// Prod: isi VITE_API_URL (.env.production / build args), mis. https://api.bimaunggul.id
const BASE = import.meta.env.VITE_API_URL ?? '';

function getToken() {
  try {
    return localStorage.getItem('accessToken') || localStorage.getItem('token') || null;
  } catch { return null; }
}

/**
 * Sesi & refresh — PRD §13/§14:
 * Access token berumur pendek (15m); refresh token disimpan di cookie httpOnly.
 * Saat 401, apiFetch memanggil POST /api/auth/refresh lalu retry request sekali.
 */
let refreshPromise = null;

function storeToken(token) {
  try {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('token', token); // legacy key dipakai beberapa komponen lama
  } catch {}
}

export function clearSession() {
  try {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('authUser');
  } catch {}
}

// POST /api/auth/refresh (cookie httpOnly) → { accessToken } | 401/403 definitive
// Semantik: hanya 401/403 yang mengakhiri sesi (clear + event); error transient
// (network/5xx) dilempar tanpa logout agar UI bisa retry saat backend pulih.
export async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      let res;
      try {
        res = await fetch(`${BASE}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch {
        throw Object.assign(
          new Error('Tidak dapat menghubungi server untuk refresh sesi.'),
          { code: 'REFRESH_NETWORK', status: 0 }
        );
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.accessToken) {
        if (res.status === 401 || res.status === 403) {
          clearSession();
          window.dispatchEvent(new CustomEvent('bima:session-expired'));
          throw Object.assign(
            new Error(data.error || 'Sesi berakhir — silakan login ulang.'),
            { code: data.code || 'SESSION_EXPIRED', status: res.status }
          );
        }
        throw Object.assign(
          new Error(data.error || 'Gagal refresh sesi (server).'),
          { code: 'REFRESH_FAILED', status: res.status }
        );
      }
      storeToken(data.accessToken);
      return data.accessToken;
    })().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

/**
 * apiGet — central fetcher untuk Zona Publik (tanpa Authorization header)
 * PRD: GET /api/leaderboard dan GET /api/madrasah/:slug adalah open access
 */
export async function apiGet(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || data.message || `Request failed ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/**
 * apiFetch — generic helper dengan auto Authorization Bearer + auto-refresh 401
 * @param {string} path
 * @param {object} opts { method, body (object|string), headers, auth=true, ...fetchOpts }
 */
export async function apiFetch(path, { method = 'GET', body, headers = {}, auth = true, ...rest } = {}) {
  const doFetch = (token) => {
    const finalHeaders = { 'Content-Type': 'application/json', ...headers };
    if (auth && token) finalHeaders.Authorization = `Bearer ${token}`;
    return fetch(`${BASE}${path}`, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      credentials: 'include',
      ...rest,
    });
  };

  let res = await doFetch(auth ? getToken() : null);

  // Access token kedaluwarsa → refresh sekali (single-flight), lalu retry.
  // Endpoint auth sendiri tidak di-refresh untuk menghindari loop.
  if (res.status === 401 && auth && !path.startsWith('/api/auth/')) {
    const newToken = await refreshSession();
    res = await doFetch(newToken);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || data.message || `Request failed ${res.status}`);
    err.status = res.status;
    err.data = data;
    // expose code for precise UI (ACCOUNT_NOT_APPROVED etc)
    err.code = data.code || data.error_code || null;
    throw err;
  }
  return data;
}

export const API_BASE = BASE;

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../lib/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'accessToken';
const USER_KEY = 'authUser';

function loadStored() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(USER_KEY);
    const user = raw ? JSON.parse(raw) : null;
    return { token: token || null, user };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => loadStored().token);
  const [user, setUser] = useState(() => loadStored().user);
  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!token && !!user;
  const role = user?.role || null;

  const persist = useCallback((nextToken, nextUser) => {
    if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken);
    else localStorage.removeItem(TOKEN_KEY);
    if (nextUser) localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    else localStorage.removeItem(USER_KEY);
    // keep legacy key for ProfilMadrasah fallback
    if (nextToken) localStorage.setItem('token', nextToken);
    else localStorage.removeItem('token');
  }, []);

  const login = useCallback(async (nip, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nip: nip.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = data.code || '';
        const msg = data.error || data.message || 'Login gagal';
        // precise mapping for not-approved
        if (res.status === 403 || code === 'ACCOUNT_NOT_APPROVED' || /menunggu/i.test(msg)) {
          throw Object.assign(new Error('Akun Anda masih “Menunggu Persetujuan” Admin. Hubungi Seksi Pendma.'), { code: 'ACCOUNT_NOT_APPROVED', status: 403 });
        }
        if (res.status === 401) throw Object.assign(new Error(msg || 'NIP atau password salah.'), { code: data.code || 'INVALID_CREDENTIALS', status: 401 });
        throw Object.assign(new Error(msg), { code, status: res.status });
      }
      const nextToken = data.accessToken;
      const nextUser = data.user;
      setToken(nextToken);
      setUser(nextUser);
      persist(nextToken, nextUser);
      return { token: nextToken, user: nextUser };
    } finally {
      setLoading(false);
    }
  }, [persist]);

  const register = useCallback(async ({ nip, name, email, password, madrasahData }) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nip, name, email, password, madrasahData }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw Object.assign(new Error(data.error || data.message || 'Registrasi gagal'), { code: data.code, status: res.status, details: data });
    }
    return data; // { status: "menunggu_persetujuan" }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }).catch(() => {});
      }
    } finally {
      setToken(null);
      setUser(null);
      persist(null, null);
      localStorage.removeItem('bima_operator_madrasah'); // keep? but clear session
    }
  }, [token, persist]);

  // optional: validate token on mount by calling a protected endpoint light
  useEffect(() => {
    // if token exists but user missing, try to clear
    if (token && !user) {
      // could call /api/auth/refresh or /api/operator/madrasah to verify
      // for now keep token, user will be re-fetched on demand
    }
  }, [token, user]);

  // Sesi berakhir (refresh gagal dari lib/api) → bersihkan state agar ProtectedRoute mengarahkan ke /login
  useEffect(() => {
    const onExpired = () => { setToken(null); setUser(null); };
    window.addEventListener('bima:session-expired', onExpired);
    return () => window.removeEventListener('bima:session-expired', onExpired);
  }, []);

  const value = useMemo(() => ({
    token, user, role, isAuthenticated, loading, login, register, logout, setToken, setUser,
  }), [token, user, role, isAuthenticated, loading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;

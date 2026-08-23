import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { fetchOwnMadrasah } from '../lib/operatorData';

/**
 * OperatorContext — SATU SUMBER DATA madrasah untuk seluruh zona Operator.
 * Pattern: React Context + state (Context7: createContext(null) + useContext, value = {madrasah,setMadrasah})
 * - Provider fetch GET /api/operator/madrasah sekali di level OperatorLayout (single-flight)
 * - Consumer (Sidebar, Dashboard, InputCapaian, ProfilMadrasah, dll) baca reaktif via useOperator()
 * - Setelah PATCH /api/operator/madrasah, panggil refresh() / updateMadrasah() agar Sidebar ikut update tanpa refresh manual
 */

const OperatorContext = createContext(null);

const EMPTY = {
  id: null,
  nama: '-',
  bmuId: '-',
  jenjang: '-',
  status: '-',
  kelompok: '-',
  jumlahSiswa: null,
  alamat: '-',
  slug: '',
};

export function OperatorProvider({ children }) {
  const { token, user } = useAuth();
  const [madrasah, setMadrasah] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setMadrasah(EMPTY);
      setLoading(false);
      return EMPTY;
    }
    setLoading(true);
    setError(null);
    try {
      const m = await fetchOwnMadrasah();
      setMadrasah(m);
      setError(null);
      return m;
    } catch (e) {
      // tetap tampilkan placeholder, tapi expose error agar halaman bisa toast
      setError(e?.message || 'Gagal memuat profil madrasah');
      // jangan reset ke EMPTY jika sudah ada data sebelumnya (stale-while-revalidate)
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial load + re-load saat token/madrasahId berubah (mis. setelah login)
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!token) {
        if (!ignore) {
          setMadrasah(EMPTY);
          setLoading(false);
        }
        return;
      }
      if (!ignore) setLoading(true);
      try {
        const m = await fetchOwnMadrasah();
        if (!ignore) {
          setMadrasah(m);
          setError(null);
        }
      } catch (e) {
        if (!ignore) setError(e?.message || 'Gagal memuat profil madrasah');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [token, user?.madrasahId]);

  // Update optimistik setelah PATCH (ProfilMadrasah edit 3 field)
  const updateMadrasah = useCallback((patch) => {
    setMadrasah((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo(() => ({
    madrasah,
    loading,
    error,
    refresh,
    updateMadrasah,
    setMadrasah,
  }), [madrasah, loading, error, refresh, updateMadrasah]);

  return <OperatorContext.Provider value={value}>{children}</OperatorContext.Provider>;
}

export function useOperator() {
  const ctx = useContext(OperatorContext);
  if (!ctx) throw new Error('useOperator must be used within OperatorProvider');
  return ctx;
}

export default OperatorContext;

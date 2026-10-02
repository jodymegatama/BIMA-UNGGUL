import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { fetchOwnMadrasah } from '../lib/operatorData';
import { apiFetch } from '../lib/api';
import { sharedFlight, getKey } from '../lib/singleFlight';

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

// Periode aktif default — null artinya belum diketahui / tidak ada periode aktif.
const EMPTY_PERIODE = null;

export function OperatorProvider({ children }) {
  const { token, user } = useAuth();
  const [madrasah, setMadrasah] = useState(EMPTY);
  const [periode, setPeriode] = useState(EMPTY_PERIODE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // SATU FETCH (single-flight) untuk seluruh zona Operator — pola sama dgn fetchOwnMadrasah.
  // Respons GET /api/operator/indikator memuat periode: { id, namaPeriode, status, tanggalCutoff }
  // (backend/src/controllers/operatorController.js getIndikatorStatus) + agregat stats.
  // sharedFlight: endpoint ini juga dimuat Dashboard & InputCapaian secara paralel
  // + StrictMode menjalankan effect dua kali → satu request untuk semuanya.
  // (Endpoint ini read-only dan tidak pernah dimutasi, jadi berbagi aman; berbeda
  // dengan fetchOwnMadrasah yang sengaja TIDAK di-dedup agar refresh() setelah
  // PATCH profil selalu membaca data pasca-simpan.)
  const refreshIndikator = useCallback(async () => {
    if (!token) {
      setPeriode(EMPTY_PERIODE);
      return null;
    }
    try {
      const data = await sharedFlight.run(getKey('/api/operator/indikator'), () => apiFetch('/api/operator/indikator', { auth: true }));
      setPeriode(data?.periode || EMPTY_PERIODE);
      return data || null;
    } catch {
      // gagal — biarkan periode sebelumnya / null; halaman tetap berfungsi
      return null;
    }
  }, [token]);

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
          setPeriode(EMPTY_PERIODE);
          setLoading(false);
        }
        return;
      }
      if (!ignore) setLoading(true);
      // Periode aktif dimuat PARALEL dengan profil madrasah (dulu baru dipanggil
      // setelah profil settle). Karena kini benar-benar konkuren dengan request
      // Dashboard, sharedFlight menggabungkannya menjadi satu request.
      refreshIndikator();
      try {
        // Dedup khusus request awal: StrictMode menjalankan effect dua kali.
        // refresh() di bawah sengaja TIDAK lewat sini — setelah PATCH profil ia
        // harus membaca data pasca-simpan, bukan hasil request yang tertunda.
        const m = await sharedFlight.run(getKey('/api/operator/madrasah'), () => fetchOwnMadrasah());
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
  }, [token, user?.madrasahId, refreshIndikator]);

  // Re-fetch periode saat tab kembali fokus (periode bisa saja cut-off saat operator meninggalkan tab)
  useEffect(() => {
    if (!token) return undefined;
    const onFocus = () => refreshIndikator();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [token, refreshIndikator]);

  // Update optimistik setelah PATCH (ProfilMadrasah edit 3 field)
  const updateMadrasah = useCallback((patch) => {
    setMadrasah((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo(() => ({
    madrasah,
    periode,
    loading,
    error,
    refresh,
    refreshIndikator,
    updateMadrasah,
    setMadrasah,
  }), [madrasah, periode, loading, error, refresh, refreshIndikator, updateMadrasah]);

  return <OperatorContext.Provider value={value}>{children}</OperatorContext.Provider>;
}

export function useOperator() {
  const ctx = useContext(OperatorContext);
  if (!ctx) throw new Error('useOperator must be used within OperatorProvider');
  return ctx;
}

export default OperatorContext;

import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';

export default function AdminLayout() {
  const [drawer, setDrawer] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [pendingValidasi, setPendingValidasi] = useState(0);
  const [namaPeriode, setNamaPeriode] = useState('—');

  const admin = { nama: user?.name || user?.namaLengkap || '-', nip: user?.nip || '-' };

  // Badge antrean "menunggu" — real-time dari backend (payload minimal: limit=1, pakai total)
  const fetchPending = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/validasi?status=menunggu&page=1&limit=1', { auth: true });
      setPendingValidasi(res?.total ?? 0);
    } catch {
      // gagal load → 0 (badge tersembunyi), layout tidak rusak
      setPendingValidasi(0);
    }
  }, []);

  // Periode aktif untuk label Sidebar/TopBar
  useEffect(() => {
    let ignore = false;
    apiFetch('/api/admin/periode', { auth: true })
      .then((res) => {
        if (ignore) return;
        const list = Array.isArray(res?.data) ? res.data : [];
        const aktif = list.find((p) => p.status === 'aktif');
        setNamaPeriode(aktif?.namaPeriode || '—');
      })
      .catch(() => {});
    return () => { ignore = true; };
  }, []);

  // Re-fetch badge: mount, ganti route, window focus, polling ringan
  useEffect(() => {
    fetchPending();
    const onFocus = () => fetchPending();
    window.addEventListener('focus', onFocus);
    const iv = setInterval(fetchPending, 60000);
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(iv);
    };
  }, [fetchPending, pathname]);

  return (
    <div className="min-h-[100dvh] bg-transparent flex">
      <aside className="hidden lg:flex w-[280px] shrink-0 sticky top-0 h-[100dvh] overflow-hidden">
        <div className="w-full">
          <Sidebar admin={admin} periode={namaPeriode} pendingValidasi={pendingValidasi} />
        </div>
      </aside>
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDrawer(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[300px] bg-white shadow-float">
            <Sidebar admin={admin} periode={namaPeriode} pendingValidasi={pendingValidasi} onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0 min-h-[100dvh]">
        <TopBar onMenu={() => setDrawer(true)} periode={namaPeriode} />
        <main className="flex-1 p-4 lg:p-6 bg-transparent">
          <div className="max-w-[1100px] mx-auto">
            <Outlet context={{ refreshPending: fetchPending }} />
          </div>
        </main>
        <footer className="h-9 flex items-center justify-between px-4 lg:px-6 border-t-2 border-zinc-100 bg-white text-[11px] font-bold text-faded">
          <span>BIMA UNGGUL • Admin</span>
          <span className="hidden sm:inline">Sek. Pendma • Kankemenag Kab. Pasuruan</span>
        </footer>
      </div>
    </div>
  );
}

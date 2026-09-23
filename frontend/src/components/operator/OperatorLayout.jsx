import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuth } from '../../context/AuthContext';
import { OperatorProvider, useOperator } from '../../context/OperatorContext';

/**
 * OperatorLayout — putih bersih, tanpa dot-pattern/blob
 * Sidebar kiri + TopBar + Outlet — SATU SUMBER DATA via OperatorContext (Context7 pattern)
 * Provider di level Layout agar Sidebar, TopBar, dan semua halaman /operator/* reaktif.
 */
function OperatorLayoutInner() {
  const [drawer, setDrawer] = useState(false);
  const { user, logout } = useAuth();
  const { madrasah: ctxMadrasah } = useOperator();
  const navigate = useNavigate();

  // SATU SUMBER DATA: dari OperatorContext (GET /api/operator/madrasah), bukan user.madrasah dummy
  const madrasah = {
    nama: ctxMadrasah?.nama || '—',
    kelompok: ctxMadrasah?.kelompok || '—',
    bmuId: ctxMadrasah?.bmuId || '—',
    jenjang: ctxMadrasah?.jenjang || '—',
    status: ctxMadrasah?.status || '—',
  };
  const operator = {
    nama: user?.name || user?.namaLengkap || '—',
    email: user?.email || '—',
  };
  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="min-h-[100dvh] bg-transparent flex">
      {/* desktop sidebar */}
      <aside className="hidden lg:flex w-[280px] shrink-0 sticky top-0 h-[100dvh] overflow-hidden">
        <div className="w-full">
          <Sidebar madrasah={madrasah} operator={operator} onLogout={handleLogout} />
        </div>
      </aside>

      {/* mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDrawer(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[300px] bg-white shadow-float">
            <Sidebar madrasah={madrasah} operator={operator} onNavigate={() => setDrawer(false)} onLogout={handleLogout} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 min-h-[100dvh]">
        <TopBar onMenu={() => setDrawer(true)} periode="2026/2027" />
        <main className="flex-1 p-4 lg:p-6 bg-transparent">
          <div className="max-w-[1100px] mx-auto">
            <Outlet context={{ madrasah, operator }} />
          </div>
        </main>
        <footer className="h-9 flex items-center justify-between px-4 lg:px-6 border-t-2 border-zinc-100 bg-white text-[11px] font-bold text-faded">
          <span>BIMA UNGGUL • Operator</span>
          <span className="hidden sm:inline">Butuh bantuan? Hubungi Seksi Pendma</span>
        </footer>
      </div>
    </div>
  );
}

export default function OperatorLayout() {
  return (
    <OperatorProvider>
      <OperatorLayoutInner />
    </OperatorProvider>
  );
}

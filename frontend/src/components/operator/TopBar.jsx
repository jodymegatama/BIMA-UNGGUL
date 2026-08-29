import { useState, useEffect, useCallback } from 'react';
import { List, Bell, CaretRight } from 'phosphor-react';
import { Link, useLocation } from 'react-router-dom';
import NotificationDropdown from '../shared/NotificationDropdown';
import { apiFetch } from '../../lib/api';

const titleMap = {
  '/operator': 'Dashboard',
  '/operator/input': 'Input Capaian',
  '/operator/riwayat': 'Riwayat Submission',
  '/operator/profil': 'Profil Madrasah',
};

// Judul ramah untuk tipe notifikasi (PRD §12)
const NOTIF_TITLE = {
  account_approved: 'Akun disetujui',
  submission_approved: 'Capaian Disetujui',
  submission_rejected: 'Capaian Ditolak',
  submission_revoked: 'Capaian Dicabut',
  delete_request_approved: 'Permintaan Hapus Disetujui',
  delete_request_rejected: 'Permintaan Hapus Ditolak',
};

export default function TopBar({ periode = '2026/2027', onMenu }) {
  const { pathname } = useLocation();
  const title = titleMap[pathname] || 'Operator';
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const notifCount = items.filter((i) => !i.read).length;

  const loadNotifications = useCallback(async () => {
    try {
      const data = await apiFetch('/api/notifications', { auth: true });
      const arr = Array.isArray(data) ? data : (data.data || []);
      setItems(arr.map((n) => ({
        id: n.id,
        judul: NOTIF_TITLE[n.tipe] || (n.tipe || 'Notifikasi'),
        desc: n.pesan || '',
        time: n.createdAt ? new Date(n.createdAt).toLocaleString('id-ID') : '',
        status: /tolak|revoked/i.test(n.tipe || '') ? 'Ditolak' : (/setujui|approved/i.test(n.tipe || '') ? 'Disetujui' : 'Menunggu'),
        read: n.statusBaca === 'sudah_dibaca',
      })));
    } catch  { /* polling gagal — biarkan senyap */ }
  }, []);

  // Fetch awal + polling 30 detik + refetch saat tab kembali fokus (PRD §14)
  useEffect(() => {
    loadNotifications(); // eslint-disable-line react-hooks/set-state-in-effect -- async fn; setState di promise callback (docs: eslint-react)
    const iv = setInterval(loadNotifications, 30000);
    const onFocus = () => loadNotifications();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(iv);
      window.removeEventListener('focus', onFocus);
    };
  }, [loadNotifications]);

  const handleRead = async (id) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));
    try { await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH', auth: true }); } catch  { /* polling gagal — biarkan senyap */ }
  };
  const handleReadAll = async () => {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    try { await apiFetch('/api/notifications/read-all', { method: 'PATCH', auth: true }); } catch  { /* polling gagal — biarkan senyap */ }
  };

  // breadcrumb sederhana: Beranda (publik) → Operator → halaman
  return (
    <div className="h-[64px] flex items-center justify-between gap-4 px-4 lg:px-6 border-b-2 border-zinc-100 bg-white shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenu}
          className="lg:hidden w-9 h-9 rounded-[12px] border-2 border-zinc-200 bg-white flex items-center justify-center hover:bg-zinc-50"
          aria-label="Buka menu"
        >
          <List size={18} weight="regular" />
        </button>
        <div className="min-w-0">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-faded">
            <Link to="/" className="hover:text-charcoal">Beranda</Link>
            <CaretRight size={10} weight="bold" />
            <span className="text-charcoal">Operator</span>
            {pathname !== '/operator' && (
              <>
                <CaretRight size={10} weight="bold" />
                <span className="text-charcoal truncate">{title}</span>
              </>
            )}
          </div>
          <h1 className="font-display font-black text-[18px] lg:text-[20px] leading-none text-charcoal truncate">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-story border-2 border-[#b8eb8a] text-[11px] font-black text-eager-dark">
          <span className="w-2 h-2 rounded-full bg-eager animate-pulse" style={{ animation: 'pulse-live 1.6s ease infinite' }} />
          Periode {periode}
        </span>
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="relative w-9 h-9 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center hover:bg-zinc-50"
            aria-label="Notifikasi"
            aria-haspopup="true"
            aria-expanded={open}
          >
            <Bell size={18} weight={open ? 'fill' : 'regular'} color="#4b4b4b" />
            {notifCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-eager text-white border-2 border-white flex items-center justify-center text-[10px] font-black leading-none">
                {notifCount}
              </span>
            )}
          </button>
          {open && <NotificationDropdown items={items} onRead={handleRead} onReadAll={handleReadAll} onClose={() => setOpen(false)} />}
        </div>
      </div>
    </div>
  );
}

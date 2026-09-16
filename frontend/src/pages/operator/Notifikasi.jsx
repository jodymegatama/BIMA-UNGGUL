import { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCircle, Clock, XCircle, FileText, ArrowLeft } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api';

const iconMap = {
  Disetujui: { Icon: CheckCircle, color: '#58cc02' },
  Menunggu: { Icon: Clock, color: '#1cb0f6' },
  Ditolak: { Icon: XCircle, color: '#000437' },
  Draft: { Icon: FileText, color: '#afafaf' },
};

const NOTIF_TITLE = {
  account_approved: 'Akun disetujui',
  submission_approved: 'Capaian Disetujui',
  submission_rejected: 'Capaian Ditolak',
  submission_revoked: 'Capaian Dicabut',
  delete_request_approved: 'Permintaan Hapus Disetujui',
  delete_request_rejected: 'Permintaan Hapus Ditolak',
};

export default function Notifikasi() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/notifications', { auth: true });
      const arr = Array.isArray(data) ? data : (data.data || []);
      setItems(arr.map((n) => ({
        id: n.id,
        judul: NOTIF_TITLE[n.tipe] || (n.tipe || 'Notifikasi'),
        desc: n.pesan || '',
        time: n.createdAt ? new Date(n.createdAt).toLocaleString('id-ID') : '',
        status: /tolak|revoked/i.test(n.tipe || '') ? 'ditolak' : (/setujui|approved/i.test(n.tipe || '') ? 'disetujui' : 'validasi'),
        read: n.statusBaca === 'sudah_dibaca',
      })));
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
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
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH', auth: true });
    } catch (e) {
      console.error('Failed to mark as read:', e);
    }
  };

  const handleReadAll = async () => {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    try {
      await apiFetch('/api/notifications/read-all', { method: 'PATCH', auth: true });
    } catch (e) {
      console.error('Failed to mark all as read:', e);
    }
  };

  const filtered = filter === 'unread' ? items.filter((i) => !i.read) : items;
  const unread = items.filter((i) => !i.read).length;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-4 py-4 border-b-2 border-zinc-100">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/operator')}
            className="w-9 h-9 rounded-[12px] border-2 border-zinc-200 flex items-center justify-center hover:bg-zinc-50 active:translate-y-[1px]"
            aria-label="Kembali"
          >
            <ArrowLeft size={18} weight="bold" />
          </button>
          <div>
            <h1 className="text-[15px] font-black text-charcoal">Notifikasi</h1>
            <p className="text-[11px] font-medium text-faded">{items.length} notifikasi total</p>
          </div>
        </div>
        {unread > 0 && (
          <button
            onClick={handleReadAll}
            className="px-3 py-2 rounded-[12px] bg-eager text-white text-[11px] font-black hover:opacity-90 active:translate-y-[1px]"
          >
            Tandai semua dibaca
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 px-4 py-3 border-b-2 border-zinc-100">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-2 rounded-[12px] text-[12px] font-black transition ${
            filter === 'all'
              ? 'bg-charcoal text-white'
              : 'bg-zinc-100 text-charcoal hover:bg-zinc-150'
          }`}
        >
          Semua ({items.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-2 rounded-[12px] text-[12px] font-black transition ${
            filter === 'unread'
              ? 'bg-charcoal text-white'
              : 'bg-zinc-100 text-charcoal hover:bg-zinc-150'
          }`}
        >
          Belum dibaca ({unread})
        </button>
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="text-[13px] font-bold text-faded animate-pulse">Memuat notifikasi...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-50 border-2 border-zinc-200 mx-auto flex items-center justify-center mb-3">
              <Bell size={20} weight="regular" color="#afafaf" />
            </div>
            <div className="text-[13px] font-black text-charcoal">
              {filter === 'unread' ? 'Tidak ada notifikasi baru' : 'Tidak ada notifikasi'}
            </div>
            <div className="text-[11px] font-medium text-faded mt-1">
              {filter === 'unread' ? 'Semua notifikasi sudah dibaca' : 'Cek kembali nanti'}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filtered.map((item) => {
              const cfg = iconMap[item.status] || iconMap.Draft;
              const Icon = cfg.Icon;
              const isUnread = !item.read;
              return (
                <div
                  key={item.id}
                  onClick={() => handleRead(item.id)}
                  className={`p-4 hover:bg-zinc-50 transition cursor-pointer ${
                    isUnread ? 'bg-white' : 'bg-zinc-50/50'
                  }`}
                >
                  <div className="flex gap-3">
                    <span
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isUnread
                          ? 'bg-white border-zinc-200'
                          : 'bg-zinc-100 border-zinc-200'
                      }`}
                    >
                      <Icon size={16} weight={isUnread ? 'fill' : 'regular'} color={cfg.color} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[13px] font-black text-charcoal leading-tight">
                            {item.judul}
                          </div>
                          <div className="text-[12px] font-medium text-pencil leading-tight mt-1">
                            {item.desc}
                          </div>
                          <div className="text-[11px] font-bold text-faded mt-2">
                            {item.time}
                          </div>
                        </div>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-eager shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

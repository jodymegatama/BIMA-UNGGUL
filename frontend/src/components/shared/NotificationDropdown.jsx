import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, Clock, XCircle, FileText, ArrowRight } from 'phosphor-react';

const iconMap = {
  Disetujui: { Icon: CheckCircle, color: '#58cc02' },
  Menunggu: { Icon: Clock, color: '#1cb0f6' },
  Ditolak: { Icon: XCircle, color: '#000437' },
  Draft: { Icon: FileText, color: '#afafaf' },
  // admin specific
  validasi: { Icon: Clock, color: '#1cb0f6' },
  disetujui: { Icon: CheckCircle, color: '#58cc02' },
  ditolak: { Icon: XCircle, color: '#000437' },
};

export default function NotificationDropdown({ items = [], onRead, onReadAll, onClose }) {
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const unread = items.filter((i) => !i.read).length;

  const handleItemClick = (item) => {
    onRead?.(item.id);
    onClose?.();
  };

  const handleViewAll = () => {
    const path = window.location.pathname.startsWith('/admin') ? '/admin/notifikasi' : '/operator/notifikasi';
    navigate(path);
    onClose?.();
  };

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 w-[340px] max-h-[420px] rounded-[16px] border-2 border-zinc-200 bg-white shadow-float overflow-hidden z-50 flex flex-col">
      <div className="h-11 px-4 flex items-center justify-between border-b-2 border-zinc-100 bg-zinc-50/60 shrink-0">
        <span className="text-[13px] font-black text-charcoal flex items-center gap-2">
          <Bell size={14} weight="fill" color="#4b4b4b" /> Notifikasi
          {unread > 0 && <span className="min-w-[20px] h-5 px-1 rounded-full bg-eager text-white border border-white flex items-center justify-center text-[10px] font-black">{unread}</span>}
        </span>
        {unread > 0 && (
          <button onClick={onReadAll} className="text-[11px] font-black text-spark hover:underline">
            Tandai semua dibaca
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto divide-y divide-zinc-100">
        {items.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-zinc-50 border-2 border-zinc-200 mx-auto flex items-center justify-center">
              <Bell size={16} weight="regular" color="#afafaf" />
            </div>
            <div className="text-[13px] font-black text-charcoal mt-2">Tidak ada notifikasi</div>
            <div className="text-[11px] font-medium text-faded">Semua sudah dibaca</div>
          </div>
        ) : (
          items.map((item) => {
            const key = item.status || item.tipe || 'Draft';
            const cfg = iconMap[key] || iconMap.Draft;
            const Icon = cfg.Icon;
            const isUnread = !item.read;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`w-full text-left flex gap-3 p-3 hover:bg-zinc-50 transition ${isUnread ? 'bg-white' : 'bg-zinc-50/50 opacity-80'}`}
              >
                <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${isUnread ? 'bg-white border-zinc-200' : 'bg-zinc-100 border-zinc-200'}`}>
                  <Icon size={14} weight={isUnread ? 'fill' : 'regular'} color={cfg.color} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-black text-charcoal leading-tight truncate">{item.judul || item.title}</div>
                  <div className="text-[11px] font-medium text-pencil leading-tight truncate">{item.desc || item.pesan}</div>
                  <div className="text-[11px] font-bold text-faded mt-0.5">{item.time || new Date(item.createdAt).toLocaleDateString('id-ID')}</div>
                </div>
                {isUnread && <span className="w-2 h-2 rounded-full bg-eager shrink-0 mt-2" />}
              </button>
            );
          })
        )}
      </div>

      <div className="h-10 px-4 flex items-center justify-between border-t-2 border-zinc-100 bg-zinc-50/60 shrink-0">
        <span className="text-[11px] font-bold text-faded">{items.length} notifikasi</span>
        <button onClick={handleViewAll} className="inline-flex items-center gap-1 text-[11px] font-black text-charcoal hover:text-spark">
          Lihat semua <ArrowRight size={12} weight="bold" />
        </button>
      </div>
    </div>
  );
}

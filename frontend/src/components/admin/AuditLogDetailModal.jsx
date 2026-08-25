import { X, Clock, User, ShieldCheck, Hash, Globe } from 'phosphor-react';

function kv(list) {
  if (!list) return null;
  return (
    <div className="space-y-1.5">
      {Object.entries(list).map(([k, v]) => (
        <div key={k} className="flex justify-between gap-2 text-[12px]">
          <span className="font-bold text-faded">{k}</span>
          <span className="font-mono font-black text-charcoal truncate max-w-[180px]">{JSON.stringify(v)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AuditLogDetailModal({ item, onClose }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-[560px] max-h-[90vh] overflow-auto rounded-[16px] border-2 border-zinc-200 bg-white shadow-float">
        <div className="sticky top-0 bg-white border-b-2 border-zinc-100 p-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-black tracking-wide text-faded uppercase flex items-center gap-1"><Hash size={12} /> {item.id}</div>
            <h3 className="font-display font-black text-[15px] text-charcoal leading-tight mt-1">{item.action}</h3>
            <div className="text-[12px] font-bold text-pencil mt-1 flex items-center gap-1.5"><User size={12} /> {item.userNama} • {item.userRole} • {item.userId}</div>
            <div className="text-[11px] font-bold text-faded flex items-center gap-1"><Clock size={12} /> {new Date(item.createdAt).toLocaleString('id-ID')}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center hover:bg-zinc-50 shrink-0">
            <X size={14} weight="bold" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3">
              <div className="text-[11px] font-black tracking-wide text-faded uppercase">Entitas</div>
              <div className="text-[13px] font-black text-charcoal mt-1">{item.entity}</div>
              <div className="text-[11px] font-mono font-bold text-faded break-all">{item.entityId}</div>
            </div>
            <div className="rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3">
              <div className="text-[11px] font-black tracking-wide text-faded uppercase flex items-center gap-1"><Globe size={12} /> IP</div>
              <div className="text-[13px] font-mono font-black text-charcoal mt-1">{item.ipAddress}</div>
            </div>
          </div>

          {item.alasan && (
            <div className="rounded-[12px] bg-amber-50 border-2 border-amber-200 p-3">
              <div className="text-[11px] font-black tracking-wide text-amber-900 uppercase">Alasan</div>
              <p className="text-[13px] font-medium text-amber-900 mt-1">{item.alasan}</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-[12px] border-2 border-zinc-200 bg-white p-3">
              <div className="text-[11px] font-black tracking-wide text-faded uppercase">Data Sebelum</div>
              <div className="mt-2">{kv(item.dataSebelum) || <span className="text-[12px] font-medium text-faded">—</span>}</div>
            </div>
            <div className="rounded-[12px] border-2 border-zinc-200 bg-white p-3">
              <div className="text-[11px] font-black tracking-wide text-faded uppercase">Data Sesudah</div>
              <div className="mt-2">{kv(item.dataSesudah) || <span className="text-[12px] font-medium text-faded">—</span>}</div>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={onClose} className="h-9 px-4 rounded-full bg-ink text-white border-2 border-black text-[12px] font-black">Tutup</button>
          </div>
        </div>
      </div>
    </div>
  );
}

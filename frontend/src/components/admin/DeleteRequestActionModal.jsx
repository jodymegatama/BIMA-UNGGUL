import { useState } from 'react';
import { X, WarningCircle, Trash, CheckCircle, Buildings } from 'phosphor-react';
import DeleteRequestStatusBadge from '../operator/DeleteRequestStatusBadge';

export default function DeleteRequestActionModal({ item, onClose, onApprove, onReject }) {
  const [mode, setMode] = useState(null); // 'reject' | null
  const [alasan, setAlasan] = useState('');
  const [err, setErr] = useState('');

  if (!item) return null;

  const isMenunggu = item.statusRequest === 'Menunggu Persetujuan';

  const handleReject = () => {
    if (!alasan.trim()) return setErr('Alasan penolakan wajib diisi.');
    if (alasan.trim().length < 10) return setErr('Minimal 10 karakter.');
    onReject(item.id, alasan.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-[560px] max-h-[90vh] overflow-auto rounded-[16px] border-2 border-zinc-200 bg-white shadow-float">
        <div className="sticky top-0 bg-white border-b-2 border-zinc-100 p-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-black text-[15px] text-charcoal leading-tight">{item.namaKegiatan}</h3>
              <DeleteRequestStatusBadge status={item.statusRequest} />
            </div>
            <div className="text-[12px] font-bold text-pencil mt-1 flex items-center gap-1.5">
              <Buildings size={12} weight="regular" /> {item.madrasahNama} • {item.madrasahKelompok}
            </div>
            <div className="text-[11px] font-bold text-faded">{item.indikatorNama} • {item.indikatorKode} • Skor {item.skor} • ID {item.submissionItemId}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center hover:bg-zinc-50 shrink-0">
            <X size={16} weight="bold" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-4">
            <div className="text-[11px] font-black tracking-wide text-faded uppercase">Alasan Operator</div>
            <p className="text-[13px] font-medium text-charcoal mt-1">{item.alasan}</p>
            <div className="text-[11px] font-bold text-faded mt-1">Diajukan {item.requestedAt ? new Date(item.requestedAt).toLocaleString('id-ID') : '-'}</div>
          </div>

          {item.statusRequest !== 'Menunggu Persetujuan' && (
            <div className={`rounded-[12px] border-2 p-3 ${item.statusRequest === 'Disetujui' ? 'bg-emerald-50 border-emerald-200' : item.statusRequest === 'Ditolak' ? 'bg-red-50 border-red-200' : 'bg-white border-zinc-200'}`}>
              <div className="text-[11px] font-black uppercase tracking-wide">Status: {item.statusRequest}</div>
              {item.alasanAdmin && <div className="text-[12px] font-medium mt-1">Alasan Admin: {item.alasanAdmin}</div>}
              {item.reviewedAt && <div className="text-[11px] font-bold text-faded">Direview {new Date(item.reviewedAt).toLocaleString('id-ID')} {item.reviewedBy ? `• ${item.reviewedBy}` : ''}</div>}
              {item.statusRequest === 'Disetujui' && <div className="text-[11px] font-bold text-emerald-800 mt-1">Soft-delete — skor madrasah akan dihitung ulang, tercatat audit log.</div>}
            </div>
          )}

          {isMenunggu && !mode && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => onApprove(item.id)} className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 h-10 rounded-[12px] bg-eager border-2 border-eager-dark text-white font-black text-[13px] shadow-sticker hover:brightness-[1.03] active:translate-y-[2px] active:shadow-none">
                <CheckCircle size={16} weight="fill" color="white" /> Setujui Hapus
              </button>
              <button onClick={() => setMode('reject')} className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 h-10 rounded-[12px] bg-white border-2 border-zinc-200 text-charcoal font-black text-[13px] hover:border-ink">
                <WarningCircle size={16} weight="regular" /> Tolak
              </button>
            </div>
          )}

          {isMenunggu && mode === 'reject' && (
            <div className="rounded-[12px] border-2 border-zinc-200 bg-white p-4 space-y-3">
              <div className="text-[13px] font-black text-charcoal">Alasan penolakan (wajib)</div>
              <textarea
                id="hapus-reject-alasan"
                name="alasanPenolakanHapus"
                aria-label="Alasan penolakan permintaan hapus (wajib)"
                value={alasan}
                onChange={(e) => { setAlasan(e.target.value); setErr(''); }}
                placeholder="Jelaskan mengapa permintaan ditolak — akan terlihat oleh Operator..."
                rows={3}
                className={`w-full px-3 py-2 rounded-[12px] border-2 bg-white text-[13px] font-medium text-charcoal placeholder:text-faded focus:outline-none focus:ring-2 resize-none ${err ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-zinc-200 focus:border-ink focus:ring-zinc-200'}`}
              />
              {err && <div className="flex items-center gap-1 text-[11px] font-bold text-red-600"><WarningCircle size={12} weight="fill" /> {err}</div>}
              <div className="flex gap-2">
                <button onClick={() => { setMode(null); setAlasan(''); setErr(''); }} className="flex-1 h-9 rounded-full bg-white border-2 border-zinc-200 text-[12px] font-black">Batal</button>
                <button onClick={handleReject} className="flex-1 h-9 rounded-full bg-ink text-white border-2 border-black text-[12px] font-black">Konfirmasi Tolak</button>
              </div>
            </div>
          )}

          {!isMenunggu && (
            <div className="flex justify-end">
              <button onClick={onClose} className="h-9 px-4 rounded-full bg-ink text-white border-2 border-black text-[12px] font-black">Tutup</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

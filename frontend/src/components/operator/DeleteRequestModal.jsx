import { useState } from 'react';
import { X, WarningCircle, Trash } from 'phosphor-react';

export default function DeleteRequestModal({ item, onClose, onSubmit }) {
  const [alasan, setAlasan] = useState('');
  const [err, setErr] = useState('');

  if (!item) return null;

  const handleSubmit = () => {
    if (!alasan.trim()) {
      setErr('Alasan wajib diisi.');
      return;
    }
    if (alasan.trim().length < 10) {
      setErr('Alasan minimal 10 karakter.');
      return;
    }
    onSubmit(item.id, alasan.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-[520px] rounded-[16px] border-2 border-zinc-200 bg-white shadow-float overflow-hidden">
        <div className="h-12 px-5 flex items-center justify-between border-b-2 border-zinc-100 bg-zinc-50/60">
          <h3 className="font-display font-black text-[15px] text-charcoal flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center">
              <Trash size={14} weight="fill" color="#dc2626" />
            </span>
            Ajukan Hapus
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center hover:bg-zinc-50">
            <X size={14} weight="bold" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-4">
            <div className="text-[11px] font-black tracking-wide text-faded uppercase">Data yang akan diajukan hapus</div>
            <div className="text-[13px] font-black text-charcoal mt-1 leading-tight">{item.namaKegiatan}</div>
            <div className="text-[11px] font-bold text-pencil">{item.indikatorNama} • {item.institusi}</div>
            <div className="text-[11px] font-medium text-faded mt-1">Disetujui {new Date(item.tanggalDisetujui).toLocaleDateString('id-ID')} • Skor {item.skor} poin • ID {item.submissionItemId}</div>
          </div>

          <div className="rounded-[12px] bg-amber-50 border-2 border-amber-200 p-3 flex gap-2">
            <WarningCircle size={16} weight="fill" color="#d97706" className="shrink-0 mt-0.5" />
            <p className="text-[11px] leading-5 font-medium text-amber-900">
              Data hanya <b>soft delete</b> — jika disetujui Admin, data ditandai terhapus, skor dihitung ulang, dan tercatat di audit trail. Tidak dapat di-undo tanpa persetujuan Admin.
            </p>
          </div>

          <div>
            <label htmlFor="hapus-alasan-modal" className="block text-[11px] font-black tracking-wide text-charcoal uppercase">
              Alasan penghapusan <span className="text-red-600">*</span>
            </label>
            <textarea
              id="hapus-alasan-modal"
              name="alasanPenghapusan"
              value={alasan}
              onChange={(e) => {
                setAlasan(e.target.value);
                if (err) setErr('');
              }}
              placeholder="Jelaskan alasan wajib — contoh: salah input tahun, data ganda, salah upload bukti..."
              rows={3}
              className={`mt-1.5 w-full px-3 py-2 rounded-[12px] border-2 bg-white text-[13px] font-medium text-charcoal placeholder:text-faded focus:outline-none focus:ring-2 resize-none ${err ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-zinc-200 focus:border-ink focus:ring-zinc-200'}`}
            />
            {err && <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-red-600"><WarningCircle size={12} weight="fill" /> {err}</div>}
            <div className="text-[11px] font-medium text-faded mt-1">{alasan.length}/500 karakter (min 10)</div>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 h-10 rounded-full bg-white border-2 border-zinc-200 text-[13px] font-black text-charcoal hover:border-charcoal">
              Batal
            </button>
            <button onClick={handleSubmit} className="flex-1 h-10 rounded-full bg-red-600 border-2 border-red-700 text-white font-black text-[13px] hover:brightness-[1.03] shadow-[0_4px_0_0_#991b1b] active:translate-y-[2px] active:shadow-none">
              Ajukan Permintaan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

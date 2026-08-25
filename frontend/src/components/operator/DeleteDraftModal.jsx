import { useState } from 'react';
import { WarningCircle, Trash } from 'phosphor-react';

/**
 * DeleteDraftModal — konfirmasi ringan hapus DRAFT permanen (hard delete).
 * Tampilkan detail baris (indikator + nama kegiatan/ringkas + tanggal) supaya
 * user tidak salah hapus draf yang berisi banyak baris.
 * Props:
 *  - draft: { id, indikatorNama?, namaKegiatan?, updatedAt, ... }
 *  - busy: boolean (sedang memanggil API)
 *  - onConfirm(): jalankan DELETE
 *  - onClose()
 */
export default function DeleteDraftModal({ draft, busy, onConfirm, onClose }) {
  const [err, setErr] = useState('');
  if (!draft) return null;

  const tanggal = draft.updatedAt ? new Date(draft.updatedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={busy ? undefined : onClose} />
      <div className="relative w-full max-w-[440px] rounded-[16px] border-2 border-zinc-200 bg-white shadow-float overflow-hidden">
        <div className="h-1.5 bg-red-500" />
        <div className="p-5">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center shrink-0">
              <WarningCircle size={20} weight="fill" color="#dc2626" />
            </span>
            <div>
              <h3 className="font-display font-black text-[16px] text-charcoal leading-tight">Hapus draf ini?</h3>
              <p className="text-[12px] font-medium text-pencil mt-1">
                Draft dihapus <b>permanen</b> dari server dan tidak bisa dikembalikan. Aksi ini tercatat di audit trail.
              </p>
            </div>
          </div>

          {/* Detail baris */}
          <div className="mt-4 rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3 space-y-1.5 text-[12px]">
            {draft.indikatorNama && (
              <div><span className="font-bold text-faded">Indikator:</span> <span className="font-black text-charcoal">{draft.indikatorNama}</span></div>
            )}
            {draft.namaKegiatan && (
              <div><span className="font-bold text-faded">Kegiatan:</span> <span className="font-black text-charcoal">{draft.namaKegiatan}</span></div>
            )}
            <div><span className="font-bold text-faded">Terakhir diubah:</span> <span className="font-bold text-charcoal">{tanggal}</span></div>
            {draft.id != null && <div><span className="font-bold text-faded">ID:</span> <span className="font-mono font-bold text-charcoal">{draft.id}</span></div>}
          </div>

          {err && <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-red-600"><WarningCircle size={12} weight="fill" /> {err}</div>}

          <div className="mt-5 flex gap-2">
            <button
              onClick={onClose}
              disabled={busy}
              className="flex-1 h-10 rounded-[12px] bg-white border-2 border-zinc-200 text-charcoal font-black text-[13px] hover:border-charcoal disabled:opacity-60 transition"
            >
              Batal
            </button>
            <button
              onClick={() => {
                if (busy) return; // guard double-click
                setErr('');
                Promise.resolve(onConfirm()).catch((e) => setErr(e?.message || 'Gagal menghapus draf.'));
              }}
              disabled={busy}
              className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-[12px] bg-red-600 border-2 border-red-700 text-white font-black text-[13px] hover:brightness-110 disabled:opacity-60 transition"
            >
              <Trash size={14} weight="fill" color="white" /> {busy ? 'Menghapus…' : 'Ya, Hapus Permanen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

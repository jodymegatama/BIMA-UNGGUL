import { XCircle, Trash, ArrowClockwise, WarningCircle, Buildings } from 'phosphor-react';
import DeleteRequestStatusBadge from './DeleteRequestStatusBadge';

export default function DeleteRequestPanel({ items = [], onAjukan, onBatal }) {
  return (
    <div className="rounded-[16px] border-2 border-zinc-200 bg-white overflow-hidden shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b-2 border-zinc-100">
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Indikator</th>
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Capaian</th>
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Tgl Disetujui</th>
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Status Hapus</th>
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {items.map((it) => (
              <tr key={it.id} className="hover:bg-zinc-50/70">
                <td className="px-4 py-3">
                  <div className="text-[12px] font-black text-charcoal leading-tight">{it.indikatorNama}</div>
                  <div className="text-[11px] font-mono font-bold text-faded">{it.indikatorKode}</div>
                </td>
                <td className="px-4 py-3 min-w-[220px]">
                  <div className="text-[13px] font-bold text-charcoal leading-tight line-clamp-2">{it.namaKegiatan}</div>
                  <div className="text-[11px] font-medium text-pencil flex items-center gap-1">
                    <Buildings size={10} weight="regular" /> {it.institusi}
                  </div>
                  <div className="text-[11px] font-bold text-faded">Skor {it.skor} • {it.submissionItemId}</div>
                  {it.statusRequest === 'Menunggu Persetujuan' && (
                    <div className="mt-1 text-[11px] font-medium text-pencil">Diajukan {new Date(it.requestedAt).toLocaleDateString('id-ID')} • Alasan: {it.alasan}</div>
                  )}
                  {it.statusRequest === 'Ditolak' && (
                    <div className="mt-1.5 rounded-[10px] bg-red-50 border border-red-200 px-2.5 py-1.5">
                      <div className="text-[11px] font-black text-red-900">Ditolak Admin</div>
                      <div className="text-[11px] font-medium text-red-800">{it.alasanAdmin}</div>
                    </div>
                  )}
                  {it.statusRequest === 'Disetujui' && (
                    <div className="mt-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-[10px] px-2.5 py-1.5">Soft delete — skor dihitung ulang, tercatat audit trail.</div>
                  )}
                </td>
                <td className="px-4 py-3 text-[11px] font-bold text-pencil whitespace-nowrap">{new Date(it.tanggalDisetujui).toLocaleDateString('id-ID')}</td>
                <td className="px-4 py-3">
                  <DeleteRequestStatusBadge status={it.statusRequest} />
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {it.statusRequest === 'Belum Diajukan' && (
                    <button onClick={() => onAjukan(it)} className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black hover:border-red-300 hover:text-red-600">
                      <Trash size={12} weight="regular" /> Ajukan Hapus
                    </button>
                  )}
                  {it.statusRequest === 'Menunggu Persetujuan' && (
                    <button onClick={() => onBatal(it.id)} className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black hover:border-charcoal">
                      <XCircle size={12} weight="regular" /> Batalkan
                    </button>
                  )}
                  {it.statusRequest === 'Ditolak' && (
                    <button onClick={() => onAjukan(it)} className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black hover:border-eager">
                      <ArrowClockwise size={12} weight="regular" /> Ajukan Ulang
                    </button>
                  )}
                  {it.statusRequest === 'Disetujui' && <span className="inline-flex h-8 px-3 rounded-full bg-zinc-50 border-2 border-zinc-100 text-[11px] font-bold text-faded">Riwayat</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length === 0 && (
        <div className="p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-50 border-2 border-zinc-200 mx-auto flex items-center justify-center">
            <WarningCircle size={20} weight="regular" color="#afafaf" />
          </div>
          <div className="text-[13px] font-black text-charcoal mt-3">Tidak ada data Approved</div>
          <div className="text-[12px] font-medium text-pencil">Hanya capaian Disetujui yang bisa diajukan hapus.</div>
        </div>
      )}
    </div>
  );
}

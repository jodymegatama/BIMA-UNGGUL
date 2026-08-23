import DeleteRequestStatusBadge from '../operator/DeleteRequestStatusBadge';

export default function DeleteRequestPanel({ items = [], onRowClick }) {
  return (
    <div className="rounded-[16px] border-2 border-zinc-200 bg-white overflow-hidden shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b-2 border-zinc-100">
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Madrasah</th>
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Indikator</th>
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Ringkasan</th>
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Alasan Operator</th>
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Tgl Diajukan</th>
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {items.map((it) => (
              <tr key={it.id} className="hover:bg-zinc-50/70 cursor-pointer" onClick={() => onRowClick?.(it)}>
                <td className="px-4 py-3">
                  <div className="text-[12px] font-black text-charcoal leading-tight">{it.madrasahNama}</div>
                  <div className="text-[11px] font-bold text-pencil">{it.madrasahKelompok}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-[12px] font-bold text-charcoal leading-tight">{it.indikatorNama}</div>
                  <div className="text-[11px] font-mono text-faded">{it.indikatorKode}</div>
                </td>
                <td className="px-4 py-3 min-w-[180px]">
                  <div className="text-[12px] font-bold text-charcoal leading-tight line-clamp-2">{it.namaKegiatan}</div>
                  <div className="text-[11px] font-medium text-pencil">{it.institusi} • Skor {it.skor}</div>
                </td>
                <td className="px-4 py-3 max-w-[200px]">
                  <div className="text-[12px] font-medium text-charcoal leading-tight line-clamp-2">{it.alasan}</div>
                </td>
                <td className="px-4 py-3 text-[11px] font-bold text-pencil whitespace-nowrap">
                  {it.requestedAt ? new Date(it.requestedAt).toLocaleDateString('id-ID') : '-'}
                </td>
                <td className="px-4 py-3">
                  <DeleteRequestStatusBadge status={it.statusRequest} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length === 0 && <div className="p-8 text-center text-[13px] font-bold text-faded">Tidak ada permintaan hapus sesuai filter</div>}
    </div>
  );
}

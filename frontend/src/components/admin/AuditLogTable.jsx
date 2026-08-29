import { Clock, User, ShieldCheck } from 'phosphor-react';

const actionMeta = {
  login: { label: 'Login', color: 'bg-white border-zinc-200 text-charcoal', icon: User },
  approve_submission: { label: 'Menyetujui Submission', color: 'bg-eager text-white border-eager-dark', icon: ShieldCheck },
  reject_submission: { label: 'Menolak Submission', color: 'bg-ink text-white border-black', icon: User },
  revoke: { label: 'Revoke', color: 'bg-ink text-white border-black', icon: User },
  approve_delete_request: { label: 'Setujui Hapus', color: 'bg-eager text-white border-eager-dark', icon: ShieldCheck },
  reject_delete_request: { label: 'Tolak Hapus', color: 'bg-ink text-white border-black', icon: User },
  request_delete: { label: 'Ajukan Hapus', color: 'bg-spark text-white border-spark-dark', icon: User },
  reopen_period: { label: 'Reopen Periode', color: 'bg-amber-100 border-amber-200 text-amber-900', icon: Clock },
  finalize_period: { label: 'Finalisasi', color: 'bg-ink text-white border-black', icon: ShieldCheck },
  create_periode: { label: 'Buat Periode', color: 'bg-white border-zinc-200 text-charcoal', icon: Clock },
  update_bobot: { label: 'Update Bobot', color: 'bg-white border-zinc-200 text-charcoal', icon: ShieldCheck },
  approve_account: { label: 'Approve Akun', color: 'bg-eager text-white border-eager-dark', icon: ShieldCheck },
  export_pdf: { label: 'Export PDF', color: 'bg-white border-zinc-200 text-charcoal', icon: Clock },
  export_excel: { label: 'Export Excel', color: 'bg-white border-zinc-200 text-charcoal', icon: Clock },
  update_madrasah: { label: 'Update Madrasah', color: 'bg-white border-zinc-200 text-charcoal', icon: User },
};

function humanAction(action) {
  return actionMeta[action]?.label || action;
}

export default function AuditLogTable({ data = [], onRowClick, sortAsc = false, onToggleSort }) {
  return (
    <div className="rounded-[16px] border-2 border-zinc-200 bg-white overflow-hidden shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b-2 border-zinc-100">
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">
                <button onClick={onToggleSort} className="inline-flex items-center gap-1 hover:text-charcoal active:translate-y-[1px] transition">
                  Waktu <Clock size={12} weight="bold" /> {sortAsc ? '↑' : '↓'}
                </button>
              </th>
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">User</th>
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Aksi</th>
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Entitas</th>
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Ringkasan</th>
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Alasan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.map((row) => {
              const meta = actionMeta[row.action] || { label: row.action, color: 'bg-white border-zinc-200 text-charcoal', icon: Clock };
              const Icon = meta.icon;
              const perubahan =
                row.dataSebelum && row.dataSesudah
                  ? Object.keys(row.dataSesudah)
                      .slice(0, 2)
                      .map((k) => `${k}: ${JSON.stringify(row.dataSebelum[k])} → ${JSON.stringify(row.dataSesudah[k])}`)
                      .join(', ')
                  : row.dataSesudah
                    ? JSON.stringify(row.dataSesudah).slice(0, 60)
                    : '-';
              return (
                <tr key={row.id} className="hover:bg-zinc-50/70 cursor-pointer" onClick={() => onRowClick?.(row)}>
                  <td className="px-4 py-3 text-[11px] font-bold text-pencil whitespace-nowrap">{new Date(row.createdAt).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3">
                    <div className="text-[12px] font-black text-charcoal leading-tight">{row.userNama}</div>
                    <div className="text-[11px] font-bold text-faded">{row.userRole} • {row.userId}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 h-6 px-2.5 rounded-full border-2 text-[11px] font-black ${meta.color}`}>
                      <Icon size={12} weight={meta.color.includes('eager') || meta.color.includes('ink') ? 'fill' : 'regular'} /> {humanAction(row.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[12px] font-bold text-charcoal">{row.entity}</div>
                    <div className="text-[11px] font-mono text-faded truncate max-w-[120px]">{row.entityId}</div>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <div className="text-[11px] font-medium text-pencil leading-tight line-clamp-2">{perubahan}</div>
                  </td>
                  <td className="px-4 py-3 max-w-[160px]">
                    <div className="text-[11px] font-medium text-charcoal leading-tight line-clamp-2">{row.alasan || '-'}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {data.length === 0 && <div className="p-8 text-center text-[13px] font-bold text-faded">Tidak ada log sesuai filter</div>}
    </div>
  );
}

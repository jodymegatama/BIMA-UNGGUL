import { Funnel, MagnifyingGlass } from 'phosphor-react';

const aksiOptions = [
  'Semua',
  'login',
  'approve_submission',
  'reject_submission',
  'revoke',
  'approve_delete_request',
  'reject_delete_request',
  'request_delete',
  'reopen_period',
  'finalize_period',
  'create_periode',
  'update_bobot',
  'approve_account',
  'export_pdf',
  'update_madrasah',
];

export default function AuditLogFilterBar({ filters, onChange, users = [] }) {
  const set = (k, v) => onChange({ ...filters, [k]: v });

  return (
    <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-4 shadow-card">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <select value={filters.user} onChange={(e) => set('user', e.target.value)} className="h-9 px-3 rounded-full border-2 border-zinc-200 bg-white text-[12px] font-bold text-charcoal">
          <option value="Semua">Semua User</option>
          {users.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>

        <select value={filters.aksi} onChange={(e) => set('aksi', e.target.value)} className="h-9 px-3 rounded-full border-2 border-zinc-200 bg-white text-[12px] font-bold text-charcoal">
          {aksiOptions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <input id="audit-from" name="audit-from" type="date" aria-label="Tanggal mulai" value={filters.from} onChange={(e) => set('from', e.target.value)} className="h-9 px-3 rounded-full border-2 border-zinc-200 bg-white text-[12px] font-bold text-charcoal" />
        <input id="audit-to" name="audit-to" type="date" aria-label="Tanggal selesai" value={filters.to} onChange={(e) => set('to', e.target.value)} className="h-9 px-3 rounded-full border-2 border-zinc-200 bg-white text-[12px] font-bold text-charcoal" />
      </div>

      <div className="relative mt-3">
        <MagnifyingGlass size={16} weight="regular" color="#afafaf" className="absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          id="audit-search"
          name="audit-search"
          type="search"
          autoComplete="off"
          aria-label="Cari entitas, alasan, atau IP"
          value={filters.q}
          onChange={(e) => set('q', e.target.value)}
          placeholder="Cari entitas, alasan, IP..."
          className="w-full h-9 pl-9 pr-3 rounded-full border-2 border-zinc-200 bg-white text-[13px] font-medium text-charcoal placeholder:text-faded focus:outline-none focus:border-ink"
        />
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-faded">
        <Funnel size={12} weight="regular" color="#afafaf" /> Filter user • aksi • tanggal • kata kunci
      </div>
    </div>
  );
}

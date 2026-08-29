import { useState, useEffect, useCallback } from 'react';
import AuditLogFilterBar from '../../components/admin/AuditLogFilterBar';
import AuditLogTable from '../../components/admin/AuditLogTable';
import AuditLogDetailModal from '../../components/admin/AuditLogDetailModal';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function AuditLog() {
  const { token } = useAuth();
  const [filters, setFilters] = useState({ user: 'Semua', aksi: 'Semua', from: '', to: '', q: '' });
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [sortAsc, setSortAsc] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  const fetchLogs = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filters.user !== 'Semua') q.set('userId', filters.user);
      if (filters.aksi !== 'Semua') q.set('action', filters.aksi);
      if (filters.from) q.set('from', filters.from);
      if (filters.to) q.set('to', filters.to);
      if (filters.q) q.set('q', filters.q);
      q.set('page', String(page));
      q.set('limit', String(perPage));
      q.set('order', sortAsc ? 'asc' : 'desc');
      const res = await apiFetch(`/api/admin/audit-log?${q.toString()}`, { auth: true });
      const data = Array.isArray(res) ? res : (res.data || []);
      setRows(data.map((r) => ({
        id: r.id,
        userNama: r.user?.name || r.userNama || String(r.userId),
        action: r.action,
        entity: r.entity,
        entityId: r.entityId,
        alasan: r.alasan || '-',
        createdAt: r.createdAt,
        ipAddress: r.ipAddress,
        dataSebelum: r.dataSebelum,
        dataSesudah: r.dataSesudah,
        _raw: r,
      })));
      setTotal(res.total ?? data.length);
      const uniq = [...new Set((Array.isArray(res) ? res : (res.data || [])).map((r)=> r.user?.name || String(r.userId)))];
      if (uniq.length) setUsers(uniq);
    } catch {
      // keep rows
    } finally { setLoading(false); }
  }, [token, filters, page, sortAsc]);

  useEffect(() => { fetchLogs(); /* eslint-disable-line react-hooks/set-state-in-effect -- async fn; setState di promise callback (docs: eslint-react) */ }, [fetchLogs]);


  const handleFilterChange = (next) => { setFilters(next); setPage(1); };
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-black tracking-[-0.02em] text-[20px] lg:text-[24px] leading-none text-charcoal">Audit Log</h1>
        <p className="text-[12px] font-medium text-pencil mt-1">READ-ONLY — semua aksi tercatat: approve/reject/revoke, permintaan hapus, reopen periode, bobot, akun BMU.</p>
      </div>

      <AuditLogFilterBar filters={filters} onChange={handleFilterChange} users={users} />

      {loading ? (
        <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-8 text-center text-[13px] font-bold text-faded">Memuat audit log...</div>
      ) : (
        <AuditLogTable data={rows} onRowClick={setSelected} sortAsc={sortAsc} onToggleSort={() => setSortAsc((v) => !v)} />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-faded">Halaman {page} / {totalPages} — {total} entri</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-8 px-3 rounded-full border-2 border-zinc-200 bg-white text-[12px] font-black hover:border-charcoal active:translate-y-[1px] transition disabled:opacity-50 disabled:hover:border-zinc-200 disabled:active:translate-y-0">Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="h-8 px-3 rounded-full border-2 border-zinc-200 bg-white text-[12px] font-black hover:border-charcoal active:translate-y-[1px] transition disabled:opacity-50 disabled:hover:border-zinc-200 disabled:active:translate-y-0">Next</button>
          </div>
        </div>
      )}

      <div className="rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3 text-[11px] font-medium text-pencil">
        Log bersifat READ-ONLY dan hanya bisa difilter — tidak ada aksi edit/hapus dari UI (kepatuhan audit).
      </div>

      <AuditLogDetailModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowClockwise, Clock, WarningCircle } from 'phosphor-react';
import StatusBadge from '../../components/shared/StatusBadge';
import ValidasiFilterBar from '../../components/admin/ValidasiFilterBar';
import ValidasiDetailModal from '../../components/admin/ValidasiDetailModal';
import DeleteRequestPanel from '../../components/admin/DeleteRequestPanel';
import DeleteRequestActionModal from '../../components/admin/DeleteRequestActionModal';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

function mapApiRow(r) {
  // backend: SubmissionItem with includes
  return {
    id: r.id,
    madrasahNama: r.madrasah?.namaMadrasah || r.madrasahNama || '-',
    madrasahKelompok: r.madrasah?.kelompok || r.madrasahKelompok || '-',
    indikatorNama: r.indikator?.nama || r.indikatorNama || '-',
    indikatorKode: r.indikator?.slug || r.indikator?.kode || r.indikatorKode || '-',
    namaKegiatan: r.namaKegiatan || r.nama || '-',
    institusi: r.institusi || '-',
    tingkat: r.tingkatWilayah ? String(r.tingkatWilayah).charAt(0).toUpperCase() + String(r.tingkatWilayah).slice(1) : (r.tingkat || '-'),
    catatan: r.catatan || '',
    linkBukti: r.linkBukti || '#',
    periode: r.periode?.namaPeriode || r.periode || '-',
    skor: r.skorBaris ?? r.skor ?? null,
    status: r.status ? (r.status.charAt(0).toUpperCase() + r.status.slice(1)) : 'Menunggu', // menunggu->Menunggu
    tanggalSubmit: r.createdAt || r.tanggalSubmit || new Date().toISOString(),
    alasan: r.alasanPenolakan || r.alasan || null,
    _raw: r,
  };
}
function mapDeleteRow(r) {
  const si = r.submissionItem || r;
  return {
    id: r.id,
    submissionItemId: r.submissionItemId || si.id,
    madrasahNama: si.madrasah?.namaMadrasah || r.madrasahNama || '-',
    madrasahKelompok: si.madrasah?.kelompok || '-',
    indikatorNama: si.indikator?.nama || r.indikatorNama || '-',
    indikatorKode: si.indikator?.slug || r.indikatorKode || '-',
    namaKegiatan: si.namaKegiatan || r.namaKegiatan || '-',
    institusi: si.institusi || '-',
    statusRequest: r.status === 'menunggu' ? 'Menunggu Persetujuan' : (r.status ? r.status.charAt(0).toUpperCase()+r.status.slice(1) : 'Menunggu Persetujuan'),
    alasan: r.alasan || '-',
    alasanAdmin: r.alasanAdmin || null,
    reviewedBy: r.reviewedBy?.name || r.reviewedBy || null,
    linkBukti: si.linkBukti || '#',
    periode: si.periode?.namaPeriode || '-',
    _raw: r,
  };
}

export default function AntreanValidasi() {
  const { token } = useAuth();
  const { refreshPending } = (useOutletContext() || {});
  const [activeTab, setActiveTab] = useState('validasi'); // 'validasi' | 'hapus'

  // Validasi state — default status 'Menunggu' agar sinkron dengan badge Sidebar
  const [filters, setFilters] = useState({ status: 'Menunggu', indikator: 'Semua', periode: '2026/2027', q: '', kelompok: 'Semua' });
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selected, setSelected] = useState(null);

  // Hapus state
  const [deleteRows, setDeleteRows] = useState([]);
  const [deleteTotal, setDeleteTotal] = useState(0);
  const [deleteFilter, setDeleteFilter] = useState({ status: 'Semua', q: '' });
  const [selectedDelete, setSelectedDelete] = useState(null);
  const [deletePage, setDeletePage] = useState(1);
  const [deleteLoading, setDeleteLoading] = useState(true);

  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  const fetchValidasi = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    setErrorMsg(null);
    try {
      const q = new URLSearchParams();
      if (filters.status !== 'Semua') q.set('status', filters.status.toLowerCase());
      if (filters.q) q.set('q', filters.q);
      if (filters.indikator !== 'Semua') q.set('indikatorId', filters.indikator);
      if (filters.kelompok !== 'Semua') q.set('kelompok', filters.kelompok);
      // periode string -> try periodeId if numeric else ignore
      if (filters.periode !== 'Semua' && /^\d+$/.test(filters.periode)) q.set('periodeId', filters.periode);
      q.set('page', String(page));
      q.set('limit', '20');
      const res = await apiFetch(`/api/admin/validasi?${q.toString()}`, { auth: true });
      const data = Array.isArray(res) ? res : (res.data || res.items || []);
      setRows(data.map(mapApiRow));
      setTotal(res.total ?? data.length);
    } catch (e) {
      setRows([]);
      setTotal(0);
      // tampilkan error inline agar "kosong" tidak menyesatkan
      setErrorMsg(e.status === 401 || e.status === 403 ? 'Akses ditolak — login sebagai Admin.' : (e.message || `Gagal memuat antrian${e.status ? ` (${e.status})` : ''}.`));
    } finally { setLoading(false); }
  }, [token, filters, page]);

  const fetchDelete = useCallback(async () => {
    if (!token) { setDeleteLoading(false); return; }
    setDeleteLoading(true);
    try {
      const q = new URLSearchParams();
      if (deleteFilter.status !== 'Semua') {
        const map = { 'Menunggu Persetujuan': 'menunggu', 'Menunggu': 'menunggu', 'Disetujui': 'disetujui', 'Ditolak': 'ditolak' };
        q.set('status', map[deleteFilter.status] || deleteFilter.status.toLowerCase());
      }
      if (deleteFilter.q) q.set('q', deleteFilter.q);
      q.set('page', String(deletePage));
      q.set('limit', '20');
      const res = await apiFetch(`/api/admin/delete-requests?${q.toString()}`, { auth: true });
      const data = Array.isArray(res) ? res : (res.data || res.items || []);
      setDeleteRows(data.map(mapDeleteRow));
      setDeleteTotal(res.total ?? data.length);
    } catch (e) {
      if (e.status === 401 || e.status === 403) showToast('Akses ditolak — login sebagai Admin.');
    } finally { setDeleteLoading(false); }
  }, [token, deleteFilter, deletePage]);

  useEffect(() => { fetchValidasi(); }, [fetchValidasi]);
  useEffect(() => { if (activeTab === 'hapus') fetchDelete(); }, [fetchDelete, activeTab]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [filters]);
  useEffect(() => { setDeletePage(1); }, [deleteFilter]);

  const pendingHapus = deleteRows.filter((r) => r.statusRequest === 'Menunggu Persetujuan').length;

  const handleApprove = async (id) => {
    try {
      await apiFetch(`/api/admin/validasi/${id}/approve`, { method: 'POST', auth: true });
      showToast(`Approved ${id} — skor dihitung ulang`);
      fetchValidasi();
      refreshPending?.();
      if (selected?.id === id) setSelected((s) => ({ ...s, status: 'Disetujui' }));
    } catch (e) { showToast(e.message || 'Gagal approve'); }
  };
  const handleReject = async (id, alasan) => {
    try {
      await apiFetch(`/api/admin/validasi/${id}/reject`, { method: 'POST', body: { alasan }, auth: true });
      showToast(`Rejected ${id}`);
      fetchValidasi();
      refreshPending?.();
      if (selected?.id === id) setSelected((s) => ({ ...s, status: 'Ditolak', alasan }));
    } catch (e) { showToast(e.message || 'Gagal reject'); }
  };
  const handleRevoke = async (id, alasan) => {
    try {
      await apiFetch(`/api/admin/validasi/${id}/revoke`, { method: 'POST', body: { alasan }, auth: true });
      showToast(`Revoked ${id} → Ditolak (Operator bisa perbaiki via US4)`);
      fetchValidasi();
      refreshPending?.();
      if (selected?.id === id) setSelected((s) => ({ ...s, status: 'Ditolak', alasan }));
    } catch (e) { showToast(e.message || 'Gagal revoke'); }
  };

  const handleApproveDelete = async (id) => {
    try {
      await apiFetch(`/api/admin/delete-requests/${id}/approve`, { method: 'POST', auth: true });
      showToast(`Permintaan hapus ${id} disetujui — soft-delete, skor dihitung ulang`);
      fetchDelete();
      if (selectedDelete?.id === id) setSelectedDelete((s) => ({ ...s, statusRequest: 'Disetujui' }));
    } catch (e) { showToast(e.message || 'Gagal approve hapus'); }
  };
  const handleRejectDelete = async (id, alasanAdmin) => {
    try {
      await apiFetch(`/api/admin/delete-requests/${id}/reject`, { method: 'POST', body: { alasan: alasanAdmin, alasanAdmin }, auth: true });
      showToast(`Permintaan hapus ${id} ditolak`);
      fetchDelete();
      if (selectedDelete?.id === id) setSelectedDelete((s) => ({ ...s, statusRequest: 'Ditolak', alasanAdmin }));
    } catch (e) { showToast(e.message || 'Gagal reject hapus'); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-black tracking-[-0.02em] text-[20px] lg:text-[24px] leading-none text-charcoal">Antrian Validasi</h1>
        <p className="text-[12px] font-medium text-pencil mt-1">Filter status, madrasah, indikator, periode, dan kata kunci — klik baris untuk detail + bukti. Tab Permintaan Hapus untuk approval soft-delete.</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('validasi')}
          className={`h-9 px-4 rounded-full border-2 text-[13px] font-black ${activeTab === 'validasi' ? 'bg-ink text-white border-black' : 'bg-white border-zinc-200 text-charcoal hover:bg-zinc-50'}`}
        >
          Validasi Submission
        </button>
        <button
          onClick={() => setActiveTab('hapus')}
          className={`h-9 px-4 rounded-full border-2 text-[13px] font-black flex items-center gap-2 ${activeTab === 'hapus' ? 'bg-ink text-white border-black' : 'bg-white border-zinc-200 text-charcoal hover:bg-zinc-50'}`}
        >
          Permintaan Hapus
          {pendingHapus > 0 && <span className="min-w-[20px] h-5 px-1 rounded-full bg-eager text-white border border-white flex items-center justify-center text-[10px] font-black">{pendingHapus}</span>}
        </button>
      </div>

      {activeTab === 'validasi' ? (
        <>
          <ValidasiFilterBar filters={filters} onChange={setFilters} />

          {toast && <div className="rounded-[12px] bg-emerald-50 border-2 border-emerald-200 text-emerald-900 px-4 py-3 flex gap-2 text-[13px] font-bold"><CheckCircle size={18} weight="fill" color="#059669" className="shrink-0 mt-0.5" /><span>{toast}</span></div>}

          {!token && <div className="rounded-[12px] bg-amber-50 border-2 border-amber-200 p-3 text-[12px] font-bold text-amber-900">Login sebagai Admin untuk memuat antrian (token tidak ditemukan).</div>}
          {errorMsg && !loading && (
            <div className="rounded-[12px] bg-red-50 border-2 border-red-200 text-red-900 px-4 py-3 flex gap-2 text-[13px] font-bold">
              <WarningCircle size={18} weight="fill" color="#dc2626" className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {loading ? (
            <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-8 text-center text-[13px] font-bold text-faded">Memuat antrian...</div>
          ) : (
          <div className="rounded-[16px] border-2 border-zinc-200 bg-white overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b-2 border-zinc-100">
                    <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Madrasah</th>
                    <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Indikator</th>
                    <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Skor</th>
                    <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Tanggal</th>
                    <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Status</th>
                    <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-50/70 cursor-pointer" onClick={() => setSelected(r)}>
                      <td className="px-4 py-3">
                        <div className="text-[12px] font-black text-charcoal leading-tight">{r.madrasahNama}</div>
                        <div className="text-[11px] font-bold text-pencil">{r.madrasahKelompok}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[12px] font-bold text-charcoal">{r.indikatorNama}</div>
                        <div className="text-[11px] font-mono text-faded">{r.indikatorKode}</div>
                      </td>
                      <td className="px-4 py-3 text-[12px] font-black text-charcoal">{r.skor ?? '-'}</td>
                      <td className="px-4 py-3 text-[11px] font-bold text-pencil whitespace-nowrap">{new Date(r.tanggalSubmit).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          {r.status === 'Menunggu' && (
                            <>
                              <button onClick={() => handleApprove(r.id)} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-eager text-white border-2 border-eager-dark text-[11px] font-black"><CheckCircle size={12} weight="fill" color="white" /> Approve</button>
                              <button onClick={() => setSelected(r)} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black"><XCircle size={12} weight="regular" /> Reject</button>
                            </>
                          )}
                          {r.status === 'Disetujui' && <button onClick={() => setSelected(r)} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-ink text-white border-2 border-black text-[11px] font-black"><ArrowClockwise size={12} weight="regular" color="white" /> Revoke</button>}
                          {r.status === 'Ditolak' && <span className="text-[11px] font-bold text-faded">Menunggu revisi Operator</span>}
                          <button onClick={() => setSelected(r)} className="hidden sm:inline-flex h-7 px-2.5 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-bold text-pencil"><Clock size={12} weight="regular" /> Detail</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length === 0 && <div className="p-8 text-center text-[13px] font-bold text-faded">Tidak ada data sesuai filter {total ? `(${total} total)` : ''}</div>}
            <div className="px-4 py-3 flex items-center justify-between text-[11px] font-bold text-faded border-t-2 border-zinc-100">
              <span>Total {total} • Hal {page}</span>
              <div className="flex gap-2">
                <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="h-7 px-3 rounded-full border-2 border-zinc-200 disabled:opacity-50">Prev</button>
                <button onClick={()=>setPage(p=>p+1)} disabled={rows.length<20} className="h-7 px-3 rounded-full border-2 border-zinc-200 disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
          )}

          <ValidasiDetailModal
            item={selected}
            onClose={() => setSelected(null)}
            onApprove={handleApprove}
            onReject={handleReject}
            onRevoke={handleRevoke}
          />
        </>
      ) : (
        <>
          {/* Filter untuk permintaan hapus */}
          <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-4 flex flex-wrap gap-3">
            <select
              value={deleteFilter.status}
              onChange={(e) => setDeleteFilter((s) => ({ ...s, status: e.target.value }))}
              className="h-9 px-3 rounded-full border-2 border-zinc-200 bg-white text-[12px] font-black text-charcoal"
            >
              <option value="Semua">Semua Status</option>
              <option value="Menunggu Persetujuan">Menunggu</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Ditolak">Ditolak</option>
            </select>
            <input
              id="hapus-filter-search"
              name="hapus-filter-search"
              type="search"
              autoComplete="off"
              aria-label="Cari madrasah, indikator, atau alasan pada permintaan hapus"
              value={deleteFilter.q}
              onChange={(e) => setDeleteFilter((s) => ({ ...s, q: e.target.value }))}
              placeholder="Cari madrasah / indikator / alasan..."
              className="flex-1 min-w-[200px] h-9 px-4 rounded-full border-2 border-zinc-200 bg-white text-[13px] font-medium text-charcoal placeholder:text-faded focus:outline-none focus:border-ink"
            />
          </div>

          {toast && <div className="rounded-[12px] bg-emerald-50 border-2 border-emerald-200 text-emerald-900 px-4 py-3 flex gap-2 text-[13px] font-bold"><CheckCircle size={18} weight="fill" color="#059669" className="shrink-0 mt-0.5" /><span>{toast}</span></div>}

          {deleteLoading ? <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-8 text-center text-[13px] font-bold text-faded">Memuat permintaan hapus...</div> : <DeleteRequestPanel items={filteredDeleteForPanel()} onRowClick={setSelectedDelete} /> }

          <DeleteRequestActionModal
            item={selectedDelete}
            onClose={() => setSelectedDelete(null)}
            onApprove={handleApproveDelete}
            onReject={handleRejectDelete}
          />
          <div className="flex items-center justify-between text-[11px] font-bold text-faded">
            <span>Total {deleteTotal} • Hal {deletePage}</span>
            <div className="flex gap-2">
              <button disabled={deletePage<=1} onClick={()=>setDeletePage(p=>Math.max(1,p-1))} className="h-7 px-3 rounded-full border-2 border-zinc-200 disabled:opacity-50">Prev</button>
              <button onClick={()=>setDeletePage(p=>p+1)} disabled={deleteRows.length<20} className="h-7 px-3 rounded-full border-2 border-zinc-200 disabled:opacity-50">Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  function filteredDeleteForPanel() {
    // DeleteRequestPanel expects original shape; we already mapped to {id, submissionItemId, statusRequest...}
    // but panel may expect statusRequest === 'Menunggu Persetujuan' etc — keep mapped
    return deleteRows;
  }
}

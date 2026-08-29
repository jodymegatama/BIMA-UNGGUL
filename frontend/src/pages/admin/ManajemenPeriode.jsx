import { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Lock, LockOpen, Clock, WarningCircle, CheckCircle, Calendar, SpinnerGap, PencilSimple, Trash, XCircle } from 'phosphor-react';
import PeriodeStatusBadge from '../../components/admin/PeriodeStatusBadge';
import PeriodeForm from '../../components/admin/PeriodeForm';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function ManajemenPeriode() {
  const { token } = useAuth();
    function mapStatus(s) {
    const m = { belum_dimulai: 'Belum Dimulai', aktif: 'Aktif', cutoff: 'Cut-off', penyelesaian_validasi: 'Penyelesaian Validasi', finalisasi: 'Finalisasi', arsip: 'Arsip' };
    return m[s] || s;
  }

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [confirmFinal, setConfirmFinal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteErr, setDeleteErr] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [reopen, setReopen] = useState(null);
  const [alasan, setAlasan] = useState('');
  const [err, setErr] = useState('');
  const [toast, setToast] = useState(null);

  const fetchRows = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/periode', { auth: true });
      const data = Array.isArray(res) ? res : (res.data || res.periode || []);
      // map backend field names to UI: nama, tahunCapaian, tanggalMulai, tanggalCutoff, status
      const mapped = data.map((r) => ({
        id: r.id,
        nama: r.namaPeriode || r.nama,
        tahunCapaian: r.tahunCapaian,
        tanggalMulai: r.tanggalMulai,
        tanggalCutoff: r.tanggalCutoff,
        status: mapStatus(r.status),
        _count: r._count || {},
        _raw: r,
      }));
      setRows(mapped);
    } catch {
      // keep empty, show toast if needed
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchRows(); /* eslint-disable-line react-hooks/set-state-in-effect -- async fn; setState di promise callback (docs: eslint-react) */ }, [fetchRows]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleCreate = async (data) => {
    try {
      // data from PeriodeForm: { nama, tahunCapaian, tanggalMulai, tanggalCutoff }
      const body = { namaPeriode: data.nama, tanggalMulai: data.tanggalMulai, tanggalCutoff: data.tanggalCutoff };
      const res = await apiFetch('/api/admin/periode', { method: 'POST', body, auth: true });
      const r = res.data || res;
      setRows((prev) => [...prev, { id: r.id, nama: r.namaPeriode, tahunCapaian: r.tahunCapaian, tanggalMulai: r.tanggalMulai, tanggalCutoff: r.tanggalCutoff, status: mapStatus(r.status) }]);
      setShowForm(false);
      showToast(`Periode ${r.namaPeriode} dibuat — ${mapStatus(r.status || 'belum_dimulai')}`);
    } catch (e) { showToast(e.message || 'Gagal buat periode'); }
  };

  const handleFinal = async (id) => {
    try {
      await apiFetch(`/api/admin/periode/${id}/finalisasi`, { method: 'POST', auth: true });
      setRows((prev) => prev.map((r) => (String(r.id) === String(id) ? { ...r, status: 'Finalisasi' } : r)));
      setConfirmFinal(null);
      showToast('Periode difinalisasi — submission & bobot terkunci');
    } catch (e) { showToast(e.message || 'Gagal finalisasi'); }
  };

  const handleReopen = async () => {
    if (!alasan.trim()) return setErr('Alasan wajib diisi — tercatat di audit log');
    try {
      await apiFetch(`/api/admin/periode/${reopen.id}/reopen`, { method: 'POST', body: { alasan: alasan.trim() }, auth: true });
      setRows((prev) => prev.map((r) => (String(r.id) === String(reopen.id) ? { ...r, status: 'Penyelesaian Validasi' } : r)));
      setReopen(null); setAlasan(''); setErr('');
      showToast(`Periode ${reopen.nama} di-reopen → Penyelesaian Validasi`);
    } catch (e) { setErr(e.message || 'Gagal reopen'); }
  };

  const handleEditSubmit = async (data) => {
    try {
      // data from PeriodeForm: { nama, tahunCapaian, tanggalMulai, tanggalCutoff }
      const body = { namaPeriode: data.nama, tanggalMulai: data.tanggalMulai, tanggalCutoff: data.tanggalCutoff };
      const res = await apiFetch(`/api/admin/periode/${editRow.id}`, { method: 'PATCH', body, auth: true });
      const r = res.data || res;
      setRows((prev) => prev.map((row) => (String(row.id) === String(editRow.id) ?
        { ...row, id: r.id, nama: r.namaPeriode, tahunCapaian: r.tahunCapaian, tanggalMulai: r.tanggalMulai, tanggalCutoff: r.tanggalCutoff, status: mapStatus(r.status) } : row)));
      setEditRow(null);
      showToast(`Periode ${r.namaPeriode} diperbarui`);
    } catch (e) { showToast(e.message || 'Gagal update periode'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteErr('');
    try {
      const res = await apiFetch(`/api/admin/periode/${confirmDelete.id}`, { method: 'DELETE', auth: true });
      const info = res.data || res;
      setRows((prev) => prev.filter((r) => String(r.id) !== String(confirmDelete.id)));
      setConfirmDelete(null);
      const d = info?.deleted;
      showToast(d && (d.submissions || d.scores || d.bobots)
        ? `Periode ${confirmDelete.nama} dihapus — ${d.submissions} submission, ${d.scores} skor, ${d.bobots} bobot ikut dihapus`
        : `Periode ${confirmDelete.nama} dihapus`);
    } catch (e) {
      setDeleteErr(e.message || 'Gagal hapus periode');
    } finally { setDeleting(false); }
  };

  const now = new Date();
  const countdown = (iso) => {
    const diff = new Date(iso) - now;
    const days = Math.ceil(diff / 86400000);
    if (days < 0) return 'Lewat';
    if (days === 0) return 'Hari ini';
    return `${days} hari lagi`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-black tracking-[-0.02em] text-[20px] lg:text-[24px] leading-none text-charcoal">Manajemen Periode</h1>
          <p className="text-[12px] font-medium text-pencil mt-1">Lifecycle: Belum Dimulai → Aktif → Cut-off → Penyelesaian Validasi → Finalisasi → Arsip</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 h-10 px-5 rounded-[12px] bg-ink border-2 border-black text-white font-black text-[13px] hover:brightness-110">
          <PlusCircle size={16} weight="bold" color="white" /> Buat Periode
        </button>
      </div>

      {toast && <div className="rounded-[12px] bg-emerald-50 border-2 border-emerald-200 text-emerald-900 px-4 py-3 flex gap-2 text-[13px] font-bold"><CheckCircle size={18} weight="fill" color="#059669" className="shrink-0 mt-0.5" /><span>{toast}</span></div>}
      {!token && <div className="rounded-[12px] bg-amber-50 border-2 border-amber-200 p-3 text-[12px] font-bold text-amber-900">Login sebagai Admin untuk memuat periode.</div>}
      {loading ? <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-8 text-center text-[13px] font-bold text-faded flex items-center justify-center gap-2"><SpinnerGap size={16} weight="bold" className="animate-spin" /> Memuat periode...</div> : (
      <div className="rounded-[16px] border-2 border-zinc-200 bg-white overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b-2 border-zinc-100">
                <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Periode</th>
                <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Mulai</th>
                <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Cut-off</th>
                <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Status</th>
                <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Countdown</th>
                <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-50/70">
                  <td className="px-4 py-3">
                    <div className="text-[13px] font-black text-charcoal">{r.nama}</div>
                    <div className="text-[11px] font-bold text-faded">Tahun {r.tahunCapaian}</div>
                  </td>
                  <td className="px-4 py-3 text-[12px] font-bold text-charcoal whitespace-nowrap">{new Date(r.tanggalMulai).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3 text-[12px] font-bold text-charcoal whitespace-nowrap">{new Date(r.tanggalCutoff).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3"><PeriodeStatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-[11px] font-bold text-pencil whitespace-nowrap flex items-center gap-1"><Clock size={12} weight="regular" /> {countdown(r.tanggalCutoff)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1.5">
                      {r.status === 'Aktif' && (
                        <button onClick={() => setConfirmFinal(r)} className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-ink text-white border-2 border-black text-[11px] font-black shadow-[0_2px_0_0_#000437] hover:brightness-[1.03] active:translate-y-[2px] active:shadow-none transition">
                          <Lock size={12} weight="fill" color="white" /> Finalisasi
                        </button>
                      )}
                      {r.status === 'Finalisasi' && (
                        <button onClick={() => setReopen(r)} className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black hover:border-charcoal active:translate-y-[1px] transition">
                          <LockOpen size={12} weight="regular" /> Reopen
                        </button>
                      )}
                      <button
                        onClick={() => setEditRow(r)}
                        disabled={['Finalisasi', 'Arsip'].includes(r.status)}
                        aria-label={`Edit periode ${r.nama}`}
                        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-bold text-pencil hover:border-charcoal hover:text-charcoal active:translate-y-[1px] transition disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <PencilSimple size={12} weight="regular" /> Edit
                      </button>
                      <button
                        onClick={() => { setConfirmDelete(r); setDeleteErr(''); }}
                        disabled={['Finalisasi', 'Arsip'].includes(r.status)}
                        aria-label={`Hapus periode ${r.nama}`}
                        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-bold text-pencil hover:border-red-300 hover:text-red-600 active:translate-y-[1px] transition disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <Trash size={12} weight="regular" /> Hapus
                      </button>
                      {r.status === 'Belum Dimulai' && <span className="text-[11px] font-bold text-faded">—</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length===0 && <div className="p-8 text-center text-[13px] font-bold text-faded">Belum ada periode — buat yang pertama.</div>}
      </div>
      )}

      <div className="rounded-[12px] bg-amber-50 border-2 border-amber-200 p-3 flex gap-2">
        <Calendar size={16} weight="regular" color="#d97706" className="shrink-0 mt-0.5" />
        <p className="text-[11px] leading-5 font-medium text-amber-900">Finalisasi mengunci submission & bobot. Reopen butuh alasan wajib dan tercatat di audit log — gunakan dengan hati-hati.</p>
      </div>

      {showForm && <PeriodeForm onClose={() => setShowForm(false)} onSubmit={handleCreate} />}
      {editRow && <PeriodeForm onClose={() => setEditRow(null)} onSubmit={handleEditSubmit} initial={editRow} submitLabel="Simpan Perubahan" />}

      {confirmFinal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmFinal(null)} />
          <div className="relative w-full max-w-[480px] rounded-[16px] border-2 border-zinc-200 bg-white p-6 shadow-float">
            <h3 className="font-display font-black text-[16px] text-charcoal">Finalisasi {confirmFinal.nama}?</h3>
            <p className="text-[13px] font-medium text-pencil mt-2">Periode akan terkunci. Submission & bobot tidak bisa diubah lagi. Yakin?</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setConfirmFinal(null)} className="flex-1 h-10 rounded-full bg-white border-2 border-zinc-200 text-[13px] font-black">Batal</button>
              <button onClick={() => handleFinal(confirmFinal.id)} className="flex-1 h-10 rounded-full bg-ink text-white border-2 border-black text-[13px] font-black">Ya, Finalisasi</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => { setConfirmDelete(null); setDeleteErr(''); }} />
          <div className="relative w-full max-w-[480px] rounded-[16px] border-2 border-zinc-200 bg-white p-6 shadow-float">
            <h3 className="font-display font-black text-[16px] text-charcoal">Hapus {confirmDelete.nama}?</h3>
            <p className="text-[13px] font-medium text-pencil mt-2">
              Periode ini memiliki <b>{confirmDelete._count?.submissionItems ?? confirmDelete._count?.submissions ?? 0} submission</b>, <b>{confirmDelete._count?.scores ?? 0} skor</b>, dan <b>{confirmDelete._count?.bobots ?? 0} bobot</b>.
              Semua data tersebut akan <b className="text-red-600">DIHAPUS PERMANEN</b>. Apakah Anda yakin?
            </p>
            <div className="mt-3 rounded-[12px] bg-amber-50 border-2 border-amber-200 p-3 flex gap-2">
              <WarningCircle size={16} weight="regular" color="#d97706" className="shrink-0 mt-0.5" />
              <p className="text-[11px] leading-5 font-bold text-amber-900">Aksi ini tercatat di audit log dan tidak dapat dibatalkan.</p>
            </div>
            {deleteErr && <div className="mt-3 rounded-[12px] bg-red-50 border-2 border-red-200 text-red-900 px-4 py-3 text-[12px] font-bold">{deleteErr}</div>}
            <div className="mt-4 flex gap-2">
              <button onClick={() => { setConfirmDelete(null); setDeleteErr(''); }} className="flex-1 h-10 rounded-full bg-white border-2 border-zinc-200 text-[13px] font-black hover:border-charcoal active:translate-y-[1px] transition">Batal</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 h-10 rounded-full bg-red-600 border-2 border-red-700 text-white text-[13px] font-black shadow-[0_4px_0_0_#991b1b] hover:brightness-[1.03] active:translate-y-[2px] active:shadow-none transition disabled:opacity-60">
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {reopen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setReopen(null)} />
          <div className="relative w-full max-w-[480px] rounded-[16px] border-2 border-zinc-200 bg-white p-6 shadow-float">
            <h3 className="font-display font-black text-[16px] text-charcoal">Reopen {reopen.nama}</h3>
            <p className="text-[12px] font-bold text-red-600 mt-1 flex items-center gap-1"><WarningCircle size={12} weight="fill" color="#dc2626" /> Tindakan ini tercatat di audit log.</p>
            <textarea
              id="reopen-alasan"
              name="alasanReopen"
              aria-label="Alasan reopen periode (wajib)"
              value={alasan}
              onChange={(e) => { setAlasan(e.target.value); setErr(''); }}
              placeholder="Alasan wajib — contoh: ada submission tertinggal..."
              rows={3}
              className={`mt-3 w-full px-3 py-2 rounded-[12px] border-2 bg-white text-[13px] font-medium text-charcoal placeholder:text-faded focus:outline-none focus:ring-2 resize-none ${err ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-zinc-200 focus:border-ink focus:ring-zinc-200'}`}
            />
            {err && <div className="text-[11px] font-bold text-red-600 mt-1">{err}</div>}
            <div className="mt-4 flex gap-2">
              <button onClick={() => { setReopen(null); setAlasan(''); setErr(''); }} className="flex-1 h-10 rounded-full bg-white border-2 border-zinc-200 text-[13px] font-black">Batal</button>
              <button onClick={handleReopen} className="flex-1 h-10 rounded-full bg-ink text-white border-2 border-black text-[13px] font-black">Konfirmasi Reopen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

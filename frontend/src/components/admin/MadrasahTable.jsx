import { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlass, PlusCircle, PencilSimple, Trash, SpinnerGap, WarningCircle, Power, Hash } from 'phosphor-react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { KELOMPOKS } from '../../constants/indikator';
import MadrasahForm from './MadrasahForm';

export default function MadrasahTable() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [kelompok, setKelompok] = useState('');
  const [status, setStatus] = useState('aktif'); // aktif | nonaktif
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [confirmSoft, setConfirmSoft] = useState(null);
  const [confirmHard, setConfirmHard] = useState(null);
  const [actionErr, setActionErr] = useState('');
  const [busy, setBusy] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const fetchRows = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (debouncedQ.trim()) p.set('q', debouncedQ.trim());
      if (kelompok) p.set('kelompok', kelompok);
      if (status) p.set('status', status);
      p.set('page', String(page));
      p.set('limit', '20');
      const res = await apiFetch(`/api/admin/madrasah?${p.toString()}`, { auth: true });
      const data = Array.isArray(res) ? res : (res.data || []);
      const mapped = data.map((r) => ({
        id: r.id,
        nomorMadrasah: r.nomorMadrasah,
        namaMadrasah: r.namaMadrasah,
        jenjang: r.jenjang,
        statusKepemilikan: r.statusKepemilikan,
        jumlahSiswa: r.jumlahSiswa,
        alamat: r.alamat || '',
        kelompok: r.kelompok,
        deletedAt: r.deletedAt,
        counts: r._count || {},
      }));
      setRows(mapped);
      setTotal(res.total ?? mapped.length);
    } catch (e) {
      showToast(e.message || 'Gagal memuat madrasah');
    } finally { setLoading(false); }
  }, [token, debouncedQ, kelompok, status, page]);

  // debounce search 350ms — hindari 1 request per keystroke + race response
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => { fetchRows(); /* eslint-disable-line react-hooks/set-state-in-effect -- async fn; setState di promise callback (docs: eslint-react) */ }, [fetchRows]);

  const handleCreate = async (data) => {
    try {
      const res = await apiFetch('/api/admin/madrasah', { method: 'POST', body: data, auth: true });
      const r = res.data || res;
      showToast(`${r.namaMadrasah} dibuat — ${r.nomorMadrasah}`);
      setShowForm(false);
      setStatus('aktif');
      fetchRows();
    } catch (e) { showToast(e.message || 'Gagal buat madrasah'); }
  };

  const handleEditSubmit = async (data) => {
    try {
      await apiFetch(`/api/admin/madrasah/${editRow.id}`, { method: 'PATCH', body: data, auth: true });
      showToast('Madrasah diperbarui');
      setEditRow(null);
      fetchRows();
    } catch (e) { showToast(e.message || 'Gagal update madrasah'); }
  };

  const handleSoftDelete = async () => {
    setBusy(true); setActionErr('');
    try {
      await apiFetch(`/api/admin/madrasah/${confirmSoft.id}/soft-delete`, { method: 'PATCH', body: { alasan: 'Nonaktifkan dari Manajemen Akun' }, auth: true });
      setConfirmSoft(null);
      showToast(`${confirmSoft.namaMadrasah} dinonaktifkan — submission tetap tersimpan`);
      if (status === 'aktif') fetchRows(); else setRows((prev) => prev.filter((r) => r.id !== confirmSoft.id));
    } catch (e) { setActionErr(e.message || 'Gagal nonaktifkan'); }
    finally { setBusy(false); }
  };

  const handleActivate = async (row) => {
    try {
      await apiFetch(`/api/admin/madrasah/${row.id}/activate`, { method: 'PATCH', auth: true });
      showToast(`${row.namaMadrasah} diaktifkan kembali`);
      fetchRows();
    } catch (e) { showToast(e.message || 'Gagal aktifkan'); }
  };

  const handleHardDelete = async () => {
    setBusy(true); setActionErr('');
    try {
      const res = await apiFetch(`/api/admin/madrasah/${confirmHard.id}`, { method: 'DELETE', auth: true });
      const info = res.data || res;
      const c = info.deletedCounts;
      setConfirmHard(null);
      showToast(`${confirmHard.namaMadrasah} dihapus (${c?.submissions ?? 0} submission dihapus)`);
      fetchRows();
    } catch (e) { setActionErr(e.message || 'Gagal hapus madrasah'); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-2">
          {['aktif', 'nonaktif'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`h-8 px-4 rounded-full border-2 text-[12px] font-black transition capitalize ${status === s ? 'bg-ink text-white border-black shadow-[0_4px_0_0_#000437]' : 'bg-white border-zinc-200 text-charcoal hover:border-zinc-300 hover:bg-zinc-50 active:translate-y-[1px]'}`}
            >
              {s === 'aktif' ? 'Aktif' : 'Nonaktif'}
            </button>
          ))}
        </div>
        <select
          aria-label="Filter kelompok"
          value={kelompok}
          onChange={(e) => { setKelompok(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-full border-2 border-zinc-200 bg-white text-[12px] font-bold text-charcoal focus:outline-none focus:border-ink"
        >
          <option value="">Semua kelompok</option>
          {KELOMPOKS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <div className="relative flex-1 min-w-[180px] max-w-[300px]">
          <MagnifyingGlass size={16} weight="regular" color="#afafaf" className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="madrasah-search"
            aria-label="Cari madrasah"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Cari nama / BMU / alamat..."
            className="w-full h-9 pl-9 pr-3 rounded-full border-2 border-zinc-200 bg-white text-[13px] font-medium text-charcoal placeholder:text-faded focus:outline-none focus:border-ink"
          />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-ink border-2 border-black text-white font-black text-[12px] shadow-[0_3px_0_0_#000437] hover:brightness-[1.03] active:translate-y-[2px] active:shadow-none transition"
        >
          <PlusCircle size={14} weight="bold" color="white" /> Tambah Madrasah
        </button>
      </div>

      {toast && <div className="rounded-[12px] bg-emerald-50 border-2 border-emerald-200 text-emerald-900 px-4 py-3 flex gap-2 text-[13px] font-bold"><WarningCircle size={18} weight="fill" color="#059669" className="shrink-0 mt-0.5" /><span>{toast}</span></div>}

      {loading ? (
        <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-8 text-center text-[13px] font-bold text-faded flex items-center justify-center gap-2"><SpinnerGap size={16} weight="bold" className="animate-spin" /> Memuat madrasah...</div>
      ) : (
        <div className="rounded-[16px] border-2 border-zinc-200 bg-white overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b-2 border-zinc-100">
                  <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">BMU</th>
                  <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Nama Madrasah</th>
                  <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Kelompok</th>
                  <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase text-right">Siswa</th>
                  <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Alamat</th>
                  <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Submission</th>
                  <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((r) => (
                  <tr key={r.id} className={`hover:bg-zinc-50/70 ${r.deletedAt ? 'opacity-60 bg-zinc-50/50' : ''}`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-mono font-black text-charcoal"><Hash size={11} weight="bold" /> {r.nomorMadrasah}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[12px] font-black text-charcoal">{r.namaMadrasah}</div>
                      {r.deletedAt && <div className="text-[10px] font-black text-red-600 mt-0.5 uppercase">Nonaktif</div>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-[12px] font-bold text-charcoal">{r.jenjang}</span>
                      <span className="text-[11px] font-bold text-pencil"> • {r.statusKepemilikan}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-[12px] font-mono font-black text-charcoal tabular-nums">{r.jumlahSiswa}</td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="text-[11px] font-medium text-pencil truncate">{r.alamat || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-[12px] font-bold text-pencil">{r.counts.submissions ?? 0}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditRow(r)}
                          aria-label={`Edit ${r.namaMadrasah}`}
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-bold text-pencil hover:border-charcoal hover:text-charcoal active:translate-y-[1px] transition"
                        >
                          <PencilSimple size={12} weight="regular" /> Edit
                        </button>
                        {r.deletedAt ? (
                          <button
                            onClick={() => handleActivate(r)}
                            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black text-charcoal hover:border-eager-dark hover:text-eager-dark active:translate-y-[1px] transition"
                          >
                            <Power size={12} weight="fill" /> Aktifkan
                          </button>
                        ) : (
                          <button
                            onClick={() => { setConfirmSoft(r); setActionErr(''); }}
                            aria-label={`Nonaktifkan ${r.namaMadrasah}`}
                            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-bold text-pencil hover:border-amber-400 hover:text-amber-700 active:translate-y-[1px] transition"
                          >
                            <Power size={12} weight="regular" /> Nonaktifkan
                          </button>
                        )}
                        <button
                          onClick={() => { setConfirmHard(r); setActionErr(''); }}
                          aria-label={`Hapus ${r.namaMadrasah}`}
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-bold text-pencil hover:border-red-300 hover:text-red-600 active:translate-y-[1px] transition"
                        >
                          <Trash size={12} weight="regular" /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && <div className="p-8 text-center text-[13px] font-bold text-faded">Tidak ada madrasah sesuai filter {total ? `(${total} total)` : ''}</div>}
          <div className="px-4 py-3 flex items-center justify-between text-[11px] font-bold text-faded border-t-2 border-zinc-100">
            <span>Total {total} • Hal {page}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="h-7 px-3 rounded-full border-2 border-zinc-200 text-[11px] font-black text-charcoal hover:border-charcoal active:translate-y-[1px] transition disabled:opacity-50 disabled:hover:border-zinc-200 disabled:active:translate-y-0">Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={rows.length < 20} className="h-7 px-3 rounded-full border-2 border-zinc-200 text-[11px] font-black text-charcoal hover:border-charcoal active:translate-y-[1px] transition disabled:opacity-50 disabled:hover:border-zinc-200 disabled:active:translate-y-0">Next</button>
            </div>
          </div>
        </div>
      )}

      {showForm && <MadrasahForm onClose={() => setShowForm(false)} onSubmit={handleCreate} />}
      {editRow && <MadrasahForm onClose={() => setEditRow(null)} onSubmit={handleEditSubmit} initial={editRow} />}

      {/* Modal soft delete (nonaktifkan) */}
      {confirmSoft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmSoft(null)} />
          <div className="relative w-full max-w-[480px] rounded-[16px] border-2 border-zinc-200 bg-white p-6 shadow-float">
            <h3 className="font-display font-black text-[16px] text-charcoal">Nonaktifkan {confirmSoft.namaMadrasah}?</h3>
            <p className="text-[13px] font-medium text-pencil mt-2">
              Madrasah tidak akan muncul di <b>leaderboard publik</b>. Submission, skor, dan riwayat <b className="text-amber-700">TETAP tersimpan</b> — bisa diaktifkan kembali.
            </p>
            <div className="mt-3 rounded-[12px] bg-amber-50 border-2 border-amber-200 p-3 flex gap-2">
              <WarningCircle size={16} weight="regular" color="#d97706" className="shrink-0 mt-0.5" />
              <p className="text-[11px] leading-5 font-bold text-amber-900">Akun operator terkait tetap aktif (reassign madrasah bila perlu). Aksi tercatat di audit log.</p>
            </div>
            {actionErr && <div className="mt-3 rounded-[12px] bg-red-50 border-2 border-red-200 text-red-900 px-4 py-3 text-[12px] font-bold">{actionErr}</div>}
            <div className="mt-4 flex gap-2">
              <button onClick={() => setConfirmSoft(null)} className="flex-1 h-10 rounded-full bg-white border-2 border-zinc-200 text-[13px] font-black hover:border-charcoal active:translate-y-[1px] transition">Batal</button>
              <button onClick={handleSoftDelete} disabled={busy} className="flex-1 h-10 rounded-full bg-amber-500 border-2 border-amber-600 text-white text-[13px] font-black shadow-[0_4px_0_0_#b45309] hover:brightness-[1.03] active:translate-y-[2px] active:shadow-none transition disabled:opacity-60">
                {busy ? 'Memproses...' : 'Ya, Nonaktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal hard delete */}
      {confirmHard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmHard(null)} />
          <div className="relative w-full max-w-[480px] rounded-[16px] border-2 border-zinc-200 bg-white p-6 shadow-float">
            <h3 className="font-display font-black text-[16px] text-charcoal">Hapus {confirmHard.namaMadrasah}?</h3>
            <p className="text-[13px] font-medium text-pencil mt-2">
              Madrasah <span className="font-mono font-black text-charcoal">{confirmHard.nomorMadrasah}</span> dan <b className="text-red-600">SEMUA data terkait</b> akan dihapus permanen: <b>{confirmHard.counts?.submissions ?? 0} submission</b>, skor, dan riwayat.
            </p>
            <div className="mt-3 rounded-[12px] bg-red-50 border-2 border-red-200 p-3 flex gap-2">
              <WarningCircle size={16} weight="fill" color="#dc2626" className="shrink-0 mt-0.5" />
              <p className="text-[11px] leading-5 font-bold text-red-900">Skor leaderboard untuk periode terdampak akan dihitung ulang. Tidak dapat dibatalkan.</p>
            </div>
            {actionErr && <div className="mt-3 rounded-[12px] bg-red-50 border-2 border-red-200 text-red-900 px-4 py-3 text-[12px] font-bold">{actionErr}</div>}
            <div className="mt-4 flex gap-2">
              <button onClick={() => setConfirmHard(null)} className="flex-1 h-10 rounded-full bg-white border-2 border-zinc-200 text-[13px] font-black hover:border-charcoal active:translate-y-[1px] transition">Batal</button>
              <button onClick={handleHardDelete} disabled={busy} className="flex-1 h-10 rounded-full bg-red-600 border-2 border-red-700 text-white text-[13px] font-black shadow-[0_4px_0_0_#991b1b] hover:brightness-[1.03] active:translate-y-[2px] active:shadow-none transition disabled:opacity-60">
                {busy ? 'Menghapus...' : 'Ya, Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

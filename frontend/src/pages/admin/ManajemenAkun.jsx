import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, MagnifyingGlass, Buildings, ShieldCheck, Hash, SpinnerGap, PencilSimple, Trash, PlusCircle, WarningCircle } from 'phosphor-react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import AkunForm from '../../components/admin/AkunForm';
import MadrasahTable from '../../components/admin/MadrasahTable';

const tabs = ['Semua', 'Menunggu', 'Aktif', 'Nonaktif'];

const statusBadge = {
  Menunggu: 'bg-amber-100 border-amber-200 text-amber-900',
  Aktif: 'bg-eager text-white border-eager-dark shadow-sticker',
  Nonaktif: 'bg-white border-zinc-200 text-faded',
};

function mapStatus(s) {
  const m = { menunggu: 'Menunggu', aktif: 'Aktif', nonaktif: 'Nonaktif' };
  return m[s] || s;
}

export default function ManajemenAkun() {
  const { token, user } = useAuth();
  const myId = user?.id;
  const [section, setSection] = useState('akun'); // 'akun' | 'madrasah'
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Semua');
  const [q, setQ] = useState('');
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [madrasahList, setMadrasahList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteErr, setDeleteErr] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchRows = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (activeTab !== 'Semua') p.set('status', activeTab.toLowerCase());
      if (q.trim()) p.set('q', q.trim());
      p.set('page', String(page));
      p.set('limit', '20');
      const res = await apiFetch(`/api/admin/akun?${p.toString()}`, { auth: true });
      const data = Array.isArray(res) ? res : (res.data || []);
      const mapped = data.map((r) => ({
        id: r.id,
        nip: r.nip,
        email: r.email,
        nama: r.name || r.nama || '-',
        madrasah: r.madrasah?.namaMadrasah || r.madrasah || '-',
        madrasahId: r.madrasahId,
        jenjang: r.madrasah?.jenjang || r.jenjang || '-',
        statusKepemilikan: r.madrasah?.statusKepemilikan || r.statusKepemilikan || '-',
        status: mapStatus(r.status),
        bmuId: r.madrasah?.nomorMadrasah || r.bmuId || null,
        _raw: r,
      }));
      setRows(mapped);
      setTotal(res.total ?? mapped.length);
    } catch {
      // keep empty
    } finally { setLoading(false); }
  }, [token, activeTab, q, page]);

  useEffect(() => { fetchRows(); /* eslint-disable-line react-hooks/set-state-in-effect -- async fn; setState di promise callback (docs: eslint-react) */ }, [fetchRows]);

  // fetch list madrasah untuk dropdown AkunForm
  // limit=500: tabel madrasah bisa lebih dari 1 halaman (default 20) — dropdown harus lengkap
  useEffect(() => {
    if (!token) return;
    apiFetch('/api/admin/madrasah?limit=500', { auth: true })
      .then((res) => {
        const list = Array.isArray(res) ? res : (res.data || []);
        setMadrasahList(list);
      })
      .catch(() => { /* dropdown kosong — form tetap bisa submit tanpa madrasah */ });
  }, [token]);


  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleApprove = async (id) => {
    try {
      const res = await apiFetch(`/api/admin/akun/${id}/approve`, { method: 'POST', auth: true });
      const bmu = res.madrasah?.nomorMadrasah || res.bmuId || 'BMU-XXXXXX';
      showToast(`Akun disetujui — Madrasah ${bmu}`);
      fetchRows();
    } catch (e) { showToast(e.message || 'Gagal approve'); }
  };
  const handleDeactivate = async (id) => {
    try {
      await apiFetch(`/api/admin/akun/${id}`, { method: 'PATCH', body: { status: 'nonaktif' }, auth: true });
      showToast('Akun dinonaktifkan');
      fetchRows();
    } catch (e) { showToast(e.message || 'Gagal'); }
  };
  const handleActivate = async (id) => {
    try {
      await apiFetch(`/api/admin/akun/${id}`, { method: 'PATCH', body: { status: 'aktif' }, auth: true });
      showToast('Akun diaktifkan kembali');
      fetchRows();
    } catch (e) { showToast(e.message || 'Gagal'); }
  };

  const handleCreate = async (data) => {
    try {
      const res = await apiFetch('/api/admin/akun', { method: 'POST', body: data, auth: true });
      const r = res.data || res;
      showToast(`Akun ${r.email || data.email} dibuat`);
      setShowForm(false);
      setActiveTab('Semua');
      fetchRows();
    } catch (e) {
      showToast(e.message || 'Gagal buat akun');
    }
  };

  const handleEditSubmit = async (data) => {
    try {
      const body = { ...data };
      if (body.status === 'menunggu') body.status = 'aktif'; // form edit tidak punya status menunggu
      if (!body.password) delete body.password;
      await apiFetch(`/api/admin/akun/${editRow.id}`, { method: 'PATCH', body, auth: true });
      showToast('Akun diperbarui');
      setEditRow(null);
      fetchRows();
    } catch (e) { showToast(e.message || 'Gagal update akun'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteErr('');
    try {
      const res = await apiFetch(`/api/admin/akun/${confirmDelete.id}`, { method: 'DELETE', auth: true });
      const info = res.data || res;
      setRows((prev) => prev.filter((r) => String(r.id) !== String(confirmDelete.id)));
      setConfirmDelete(null);
      const c = info?.deletedCounts;
      showToast(c && (c.submissions || c.validations || c.deleteRequests || c.notifications)
        ? `Akun ${confirmDelete.email || ''} dihapus — ${c.submissions} submission, ${c.validations} validasi, ${c.notifications} notifikasi ikut terhapus${c.madrasahAffected ? ` (skor ${c.madrasahAffected} madrasah dihitung ulang)` : ''}`
: `Akun ${confirmDelete.email || ''} dihapus`);
    } catch (e) {
      setDeleteErr(e.message || 'Gagal hapus akun');
    } finally { setDeleting(false); }
  };

  const filtered = rows; // already filtered server-side

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-black tracking-[-0.02em] text-[20px] lg:text-[24px] leading-none text-charcoal">Manajemen Akun & Madrasah</h1>
          <p className="text-[12px] font-medium text-pencil mt-1">Kelola akun operator/admin dan data madrasah dalam satu halaman.</p>
        </div>
        <div className="flex gap-2 bg-zinc-100 border-2 border-zinc-200 rounded-full p-1">
          <button
            onClick={() => setSection('akun')}
            className={`h-9 px-4 rounded-full border-2 text-[12px] font-black transition ${section === 'akun' ? 'bg-ink text-white border-black shadow-[0_3px_0_0_#000437]' : 'border-transparent text-pencil hover:text-charcoal active:translate-y-[1px]'}`}
          >
            Data Akun
          </button>
          <button
            onClick={() => setSection('madrasah')}
            className={`h-9 px-4 rounded-full border-2 text-[12px] font-black transition ${section === 'madrasah' ? 'bg-ink text-white border-black shadow-[0_3px_0_0_#000437]' : 'border-transparent text-pencil hover:text-charcoal active:translate-y-[1px]'}`}
          >
            Data Madrasah
          </button>
        </div>
      </div>

      {section === 'akun' && (
      <>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-ink border-2 border-black text-white font-black text-[12px] shadow-[0_3px_0_0_#000437] hover:brightness-[1.03] active:translate-y-[2px] active:shadow-none transition"
        >
          <PlusCircle size={14} weight="bold" color="white" /> Tambah Akun
        </button>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => { setActiveTab(t); setPage(1); }}
            className={`h-8 px-4 rounded-full border-2 text-[12px] font-black transition ${activeTab === t ? 'bg-ink text-white border-black shadow-[0_4px_0_0_#000437]' : 'bg-white border-zinc-200 text-charcoal hover:border-zinc-300 hover:bg-zinc-50 active:translate-y-[1px]'}`}
          >
            {t}
          </button>
        ))}
        <div className="relative flex-1 min-w-[200px] max-w-[320px] ml-auto">
          <MagnifyingGlass size={16} weight="regular" color="#afafaf" className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="akun-search"
            name="akun-search"
            type="search"
            autoComplete="off"
            aria-label="Cari nama, email, atau madrasah"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Cari nama / email / madrasah..."
            className="w-full h-9 pl-9 pr-3 rounded-full border-2 border-zinc-200 bg-white text-[13px] font-medium text-charcoal placeholder:text-faded focus:outline-none focus:border-ink"
          />
        </div>
      </div>

      {toast && <div className="rounded-[12px] bg-emerald-50 border-2 border-emerald-200 text-emerald-900 px-4 py-3 flex gap-2 text-[13px] font-bold"><CheckCircle size={18} weight="fill" color="#059669" className="shrink-0 mt-0.5" /><span>{toast}</span></div>}
      {!token && <div className="rounded-[12px] bg-amber-50 border-2 border-amber-200 p-3 text-[12px] font-bold text-amber-900">Login sebagai Admin untuk memuat akun.</div>}

      {loading ? <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-8 text-center text-[13px] font-bold text-faded flex items-center justify-center gap-2"><SpinnerGap size={16} weight="bold" className="animate-spin" /> Memuat akun...</div> : (
      <div className="rounded-[16px] border-2 border-zinc-200 bg-white overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b-2 border-zinc-100">
                <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Nama / Email</th>
                <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Madrasah</th>
                <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Status</th>
                <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">BMU</th>
                <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-50/70">
                  <td className="px-4 py-3">
                    <div className="text-[12px] font-bold text-charcoal">{r.nama}</div>
                    <div className="text-[11px] font-mono font-medium text-pencil">{r.email}{r.nip ? <span className="text-faded"> - NIP {r.nip}</span> : null}</div>
                    <div className="text-[12px] font-bold text-charcoal">{r.nama}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[12px] font-black text-charcoal flex items-center gap-1"><Buildings size={12} weight="regular" /> {r.madrasah}</div>
                    <div className="text-[11px] font-bold text-pencil">{r.jenjang} • {r.statusKepemilikan}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 h-6 px-2.5 rounded-full border-2 text-[11px] font-black ${statusBadge[r.status]}`}>
                      {r.status === 'Menunggu' ? <Clock size={12} weight="fill" color="#92400e" /> : r.status === 'Aktif' ? <CheckCircle size={12} weight="fill" color="white" /> : <XCircle size={12} weight="regular" color="#afafaf" />}
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.bmuId ? (
                      <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-mono font-black text-charcoal"><Hash size={12} weight="bold" /> {r.bmuId}</span>
                    ) : (
                      <span className="text-[11px] font-bold text-faded">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1.5">
                      {r.status === 'Menunggu' && (
                        <button onClick={() => handleApprove(r.id)} className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-eager text-white border-2 border-eager-dark text-[11px] font-black shadow-sticker hover:brightness-[1.03] active:translate-y-[2px] active:shadow-none">
                          <CheckCircle size={12} weight="fill" color="white" /> Approve
                        </button>
                      )}
                      {r.status === 'Aktif' && (
                        <button onClick={() => handleDeactivate(r.id)} className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black hover:border-charcoal active:translate-y-[1px] transition">
                          Nonaktifkan
                        </button>
                      )}
                      {r.status === 'Nonaktif' && (
                        <button onClick={() => handleActivate(r.id)} className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black hover:border-charcoal active:translate-y-[1px] transition">
                          Aktifkan
                        </button>
                      )}
                      <button
                        onClick={() => setEditRow(r)}
                        aria-label={`Edit akun ${r.nama}`}
                        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-bold text-pencil hover:border-charcoal hover:text-charcoal active:translate-y-[1px] transition"
                      >
                        <PencilSimple size={12} weight="regular" /> Edit
                      </button>
                      <button
                        onClick={() => { setConfirmDelete(r); setDeleteErr(''); }}
                        disabled={String(myId) === String(r.id)}
                        title={String(myId) === String(r.id) ? 'Tidak bisa menghapus akun sendiri' : undefined}
                        aria-label={`Hapus akun ${r.nama}`}
                        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-bold text-pencil hover:border-red-300 hover:text-red-600 active:translate-y-[1px] transition disabled:opacity-40 disabled:pointer-events-none"
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
        {filtered.length === 0 && <div className="p-8 text-center text-[13px] font-bold text-faded">Tidak ada akun sesuai filter {total ? `(${total} total)` : ''}</div>}
        <div className="px-4 py-3 flex items-center justify-between text-[11px] font-bold text-faded border-t-2 border-zinc-100">
          <span>Total {total} • Hal {page}</span>
          <div className="flex gap-2">
            <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="h-7 px-3 rounded-full border-2 border-zinc-200 text-[11px] font-black text-charcoal hover:border-charcoal active:translate-y-[1px] transition disabled:opacity-50 disabled:hover:border-zinc-200 disabled:active:translate-y-0">Prev</button>
            <button onClick={()=>setPage(p=>p+1)} disabled={filtered.length<20} className="h-7 px-3 rounded-full border-2 border-zinc-200 text-[11px] font-black text-charcoal hover:border-charcoal active:translate-y-[1px] transition disabled:opacity-50 disabled:hover:border-zinc-200 disabled:active:translate-y-0">Next</button>
          </div>
        </div>
      </div>
      )}

      <div className="rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3 flex gap-2">
        <ShieldCheck size={16} weight="regular" color="#777777" className="shrink-0 mt-0.5" />
        <p className="text-[11px] leading-5 font-medium text-pencil">Approve otomatis generate <b>BMU-XXXXXX</b> berurutan & permanen jika madrasah belum ada — sinkron US1.</p>
      </div>

      {showForm && (
        <AkunForm
          onClose={() => setShowForm(false)}
          onSubmit={handleCreate}
          madrasahList={madrasahList}
          submitLabel="Buat Akun"
        />
      )}
      {editRow && (
        <AkunForm
          onClose={() => setEditRow(null)}
          onSubmit={handleEditSubmit}
          initial={editRow}
          madrasahList={madrasahList}
          submitLabel="Simpan Perubahan"
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => { setConfirmDelete(null); setDeleteErr(''); }} />
          <div className="relative w-full max-w-[480px] rounded-[16px] border-2 border-zinc-200 bg-white p-6 shadow-float">
            <h3 className="font-display font-black text-[16px] text-charcoal">Hapus akun {confirmDelete.nama}?</h3>
            <p className="text-[13px] font-medium text-pencil mt-2">
              Akun <span className="font-mono font-black text-charcoal">{confirmDelete.email}</span> akan dihapus permanen.
              <b className="text-red-600"> SEMUA data terkait ikut terhapus</b>: submission yang dibuat, riwayat validasi, notifikasi, dan audit log.
            </p>
            <div className="mt-3 rounded-[12px] bg-red-50 border-2 border-red-200 p-3 flex gap-2">
              <WarningCircle size={16} weight="fill" color="#dc2626" className="shrink-0 mt-0.5" />
              <p className="text-[11px] leading-5 font-bold text-red-900">Skor madrasah terkait akan dihitung ulang. Aksi tercatat di audit log dan tidak dapat dibatalkan.</p>
            </div>
            {deleteErr && (
              <div className="mt-3 rounded-[12px] bg-red-50 border-2 border-red-200 text-red-900 px-4 py-3 text-[12px] font-bold flex gap-2">
                <WarningCircle size={16} weight="fill" color="#dc2626" className="shrink-0 mt-0.5" />
                <span>{deleteErr}</span>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button onClick={() => { setConfirmDelete(null); setDeleteErr(''); }} className="flex-1 h-10 rounded-full bg-white border-2 border-zinc-200 text-[13px] font-black hover:border-charcoal active:translate-y-[1px] transition">Batal</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 h-10 rounded-full bg-red-600 border-2 border-red-700 text-white text-[13px] font-black shadow-[0_4px_0_0_#991b1b] hover:brightness-[1.03] active:translate-y-[2px] active:shadow-none transition disabled:opacity-60">
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {section === 'madrasah' && <MadrasahTable />}
    </div>
  );
}


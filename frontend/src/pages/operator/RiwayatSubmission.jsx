import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Funnel, MagnifyingGlass, PencilSimple, PaperPlaneTilt, Eye, WarningCircle, CheckCircle, Clock, Trash, SpinnerGap } from 'phosphor-react';
import StatusBadge from '../../components/shared/StatusBadge';
import CapaianRow from '../../components/operator/CapaianRow';
import DeleteDraftModal from '../../components/operator/DeleteDraftModal';
import { apiFetch } from '../../lib/api';
import { validateRow, buildPayload } from '../../constants/indikator';

const FILTERS = ['Semua', 'Draft', 'Menunggu', 'Disetujui', 'Ditolak'];

const TINGKAT_LABEL = { kabupaten: 'Kabupaten', provinsi: 'Provinsi', nasional: 'Nasional', internasional: 'Internasional' };
const JENJANG_LABEL = { s1: 'S1', s2: 'S2', s3: 'S3' };
const STATUS_PEGAWAI_LABEL = { asn: 'ASN', non_asn: 'non-ASN' };

/** Ringkasan dinamis per baris untuk kolom "Kegiatan" (field berbeda per indikator). */
function rowSummary(r) {
  const parts = [];
  if (r.namaKegiatan) parts.push(r.namaKegiatan);
  if (r.institusi) parts.push(r.institusi);
  if (r.namaPeserta) parts.push(r.namaPeserta);
  if (r.statusPegawai) parts.push(STATUS_PEGAWAI_LABEL[r.statusPegawai] || r.statusPegawai);
  if (r.tingkatWilayah) parts.push(TINGKAT_LABEL[r.tingkatWilayah] || r.tingkatWilayah);
  if (r.jenjangPendidikan) parts.push(JENJANG_LABEL[r.jenjangPendidikan] || r.jenjangPendidikan);
  if (r.jumlah != null && r.jumlah !== '') parts.push(`Jumlah ASN: ${r.jumlah}`);
  if (r.pembilang != null && r.penyebut != null && r.pembilang !== '' && r.penyebut !== '') {
    const p = Number(r.pembilang);
    const s = Number(r.penyebut);
    const pct = s > 0 ? ((p / s) * 100).toFixed(1).replace(/\.0$/, '') : '-';
    parts.push(`${p} dari ${s} = ${pct}%`);
  }
  return parts;
}

function normalizeApiRows(apiData) {
  const arr = Array.isArray(apiData) ? apiData : (apiData?.data || apiData?.items || []);
  return arr.map((r, i) => ({
    id: r.id,
    indikatorKode: r.indikator?.slug || r.indikatorKode || r.indikatorId || 'diklat',
    indikatorNama: r.indikator?.nama || r.indikatorNama || r.indikatorKode || '-',
    // field dinamis schema — dipakai ulang oleh CapaianRow saat edit (US4)
    namaKegiatan: r.namaKegiatan || '',
    institusi: r.institusi || '',
    namaPeserta: r.namaPeserta || '',
    statusPegawai: r.statusPegawai || '',
    tingkatWilayah: r.tingkatWilayah || '',
    jenjangPendidikan: r.jenjangPendidikan || '',
    jumlah: r.jumlah ?? '',
    pembilang: r.pembilang ?? '',
    penyebut: r.penyebut ?? '',
    linkBukti: r.linkBukti || '',
    catatan: r.catatan || '',
    summary: rowSummary(r),
    status: r.status ? (r.status.charAt(0).toUpperCase() + r.status.slice(1)) : 'Draft',
    alasan: r.alasanPenolakan || r.alasan || null,
    updatedAt: r.updatedAt || r.createdAt || new Date().toISOString(),
    _idx: i + 1,
    _error: {},
    _raw: r,
  }));
}

export default function RiwayatSubmission() {
  const [filter, setFilter] = useState('Semua');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteAlasan, setDeleteAlasan] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDraftTarget, setDeleteDraftTarget] = useState(null); // {id, indikatorNama, namaKegiatan, updatedAt}
  const [deletingDraft, setDeletingDraft] = useState(false);

  /** Hapus permanen DRAFT (hard delete + audit trail di backend). */
  async function handleDeleteDraft() {
    if (deletingDraft) return; // guard double-click
    if (!deleteDraftTarget) return;
    setDeletingDraft(true);
    try {
      await apiFetch(`/api/operator/submission-item/${deleteDraftTarget.id}`, { method: 'DELETE', auth: true });
      setRows((prev) => prev.filter((r) => String(r.id) !== String(deleteDraftTarget.id)));
      toast.success('Draf dihapus.');
      setDeleteDraftTarget(null);
    } catch (e) {
      if (e.status === 404) {
        // sudah tidak ada di server → bersihkan dari daftar, tanpa error
        setRows((prev) => prev.filter((r) => String(r.id) !== String(deleteDraftTarget.id)));
        toast.info('Draf sudah tidak ada di server — dihapus dari daftar.');
        setDeleteDraftTarget(null);
      } else {
        toast.error(e.message || 'Gagal hapus draf.');
      }
    } finally {
      setDeletingDraft(false);
    }
  }

  useEffect(() => {
    let ignore = false;
    async function fetchRiwayat() {
      try {
        const data = await apiFetch('/api/operator/submission-item', { auth: true });
        if (ignore) return;
        const normalized = normalizeApiRows(data);
        setRows(normalized); // set even if empty — no mock fallback
      } catch (e) {
        // alternative path /api/operator/riwayat
        try {
          const alt = await apiFetch('/api/operator/riwayat', { auth: true });
          if (ignore) return;
          const n2 = normalizeApiRows(alt);
          setRows(n2);
        } catch {
          if (!ignore) setRows([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchRiwayat();
    return () => { ignore = true; };
  }, []);

  const filtered = useMemo(() => {
    let arr = [...rows];
    if (filter !== 'Semua') arr = arr.filter((r) => r.status === filter);
    if (q.trim()) {
      const qq = q.toLowerCase();
      arr = arr.filter((r) => `${r.namaKegiatan} ${r.indikatorNama} ${r.institusi}`.toLowerCase().includes(qq));
    }
    return arr.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [rows, filter, q]);

  const updateRow = (id, field, val) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val, _error: {} } : r)));
    if (editing?.id === id) setEditing((e) => ({ ...e, [field]: val, _error: {} }));
  };

  const handleEdit = (row) => {
    setEditing({ ...row, _error: {} });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveEdit = async () => {
    const e = validateRow(editing.indikatorKode, editing);
    if (Object.keys(e).length) {
      setEditing((prev) => ({ ...prev, _error: e }));
      return;
    }
    const prevRows = rows;
    // optimistic: keep ID tetap (PRD US4)
    setRows((prev) => prev.map((r) => (r.id === editing.id ? { ...editing, status: 'Menunggu', updatedAt: new Date().toISOString(), alasan: null, _error: {} } : r)));
    const editingSnapshot = editing;
    setEditing(null);
    try {
      await apiFetch(`/api/operator/submission-item/${editingSnapshot.id}`, { method: 'PATCH', body: buildPayload(editingSnapshot.indikatorKode, editingSnapshot), auth: true });
      setToast({ type: 'success', msg: 'Perubahan dikirim ulang — status Menunggu.' });
    } catch (e2) {
      // rollback on error
      setRows(prevRows);
      const msg = e2.status === 403 && /cutoff|periode/i.test(e2.message) ? 'Periode sudah cutoff — tidak bisa edit.' : (e2.message || 'Gagal kirim ulang.');
      setToast({ type: 'error', msg });
    }
    setTimeout(() => setToast(null), 3000);
  };

  const handleResubmit = async (id) => {
    const prev = rows;
    setRows((prevR) => prevR.map((r) => (r.id === id ? { ...r, status: 'Menunggu', updatedAt: new Date().toISOString() } : r)));
    try {
      await apiFetch(`/api/operator/submission-item/${id}`, { method: 'PATCH', body: { status: 'menunggu' }, auth: true });
      setToast({ type: 'success', msg: 'Dikirim ulang untuk validasi.' });
    } catch (e) {
      setRows(prev);
      setToast({ type: 'error', msg: e.message || 'Gagal kirim ulang.' });
    }
    setTimeout(() => setToast(null), 2500);
  };

  const handleRequestDelete = async (id) => {
    const alasan = (deleteTarget === id ? deleteAlasan : '').trim();
    if (!alasan) {
      setToast({ type: 'error', msg: 'Alasan hapus wajib diisi.' });
      setTimeout(() => setToast(null), 2500);
      return;
    }
    try {
      await apiFetch(`/api/operator/submission-item/${id}/request-delete`, { method: 'POST', body: { alasan }, auth: true });
      setToast({ type: 'success', msg: 'Permintaan hapus terkirim — menunggu persetujuan Admin.' });
      setDeleteAlasan('');
      setDeleteTarget(null);
    } catch (e) {
      setToast({ type: 'error', msg: e.message || 'Gagal ajukan hapus.' });
    }
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-black tracking-[-0.02em] text-[20px] lg:text-[24px] leading-none text-charcoal">Riwayat Submission</h1>
        <p className="text-[12px] font-medium text-pencil mt-1">Semua baris capaian Anda — filter status, lihat alasan Ditolak, edit & kirim ulang (ID tetap).</p>
      </div>

      {loading && (
        <div className="rounded-[12px] border-2 border-zinc-200 bg-white p-4 flex items-center gap-2 text-[13px] font-bold text-pencil">
          <SpinnerGap size={16} weight="bold" className="animate-spin" /> Memuat riwayat dari server...
        </div>
      )}
      {/* filter bar */}
      <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-4 shadow-card">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const active = f === filter;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`h-8 px-4 rounded-full border-2 text-[12px] font-black transition ${active ? 'bg-eager text-white border-eager-dark shadow-sticker' : 'bg-white text-charcoal border-zinc-200 hover:bg-zinc-50'}`}
                >
                  {f}
                </button>
              );
            })}
          </div>
          <div className="relative w-full lg:w-[260px]">
            <MagnifyingGlass size={16} weight="regular" color="#afafaf" className="absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="riwayat-search"
              name="riwayat-search"
              type="search"
              autoComplete="off"
              aria-label="Cari kegiatan atau institusi"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari kegiatan/institusi..."
              className="w-full h-9 pl-9 pr-3 rounded-full border-2 border-zinc-200 bg-white text-[13px] font-medium text-charcoal placeholder:text-faded focus:outline-none focus:border-eager focus:ring-2 focus:ring-eager/20"
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-faded">
          <Funnel size={12} weight="regular" color="#afafaf" /> {filtered.length} baris • {filter}
        </div>
      </div>

      {toast && (
        <div className={`rounded-[12px] border-2 px-4 py-3 flex gap-2.5 text-[13px] font-bold ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} weight="fill" color="#059669" className="shrink-0 mt-0.5" /> : <WarningCircle size={18} weight="fill" color="#dc2626" className="shrink-0 mt-0.5" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* editing panel */}
      {editing && (
        <div className="rounded-[16px] border-2 border-spark bg-[#f0f9ff] p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-black text-[14px] text-charcoal">Edit & Kirim Ulang — {editing.indikatorNama}</h3>
            <button onClick={() => setEditing(null)} className="h-8 px-3 rounded-full bg-white border-2 border-zinc-200 text-[12px] font-black hover:border-charcoal">Batal</button>
          </div>
          <p className="text-[11px] font-bold text-faded mt-1">ID tetap: {editing.id} • Status akan kembali Menunggu</p>
          <div className="mt-4">
            <CapaianRow row={editing} indikatorKode={editing.indikatorKode} onChange={(id, f, v) => updateRow(id, f, v) || setEditing((e) => ({ ...e, [f]: v }))} onRemove={() => setEditing(null)} showStatus={false} />
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleSaveEdit} className="flex-1 h-10 rounded-[12px] bg-eager border-2 border-eager-dark text-white font-black text-[13px] shadow-sticker">
              Simpan & Kirim Ulang
            </button>
            <button onClick={() => setEditing(null)} className="h-10 px-4 rounded-[12px] bg-white border-2 border-zinc-200 text-charcoal font-black text-[13px]">Batal</button>
          </div>
        </div>
      )}

      {/* table */}
      <div className="rounded-[16px] border-2 border-zinc-200 bg-white overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b-2 border-zinc-100">
                <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Indikator</th>
                <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Kegiatan</th>
                <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Status</th>
                <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase hidden lg:table-cell">Tanggal</th>
                <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-50/70">
                  <td className="px-4 py-3">
                    <div className="text-[12px] font-black text-charcoal leading-tight">{r.indikatorNama}</div>
                    <div className="text-[11px] font-mono font-bold text-faded">{r.indikatorKode}</div>
                  </td>
                  <td className="px-4 py-3 min-w-[220px]">
                    <div className="text-[13px] font-bold text-charcoal leading-tight line-clamp-2">{r.summary[0] || '—'}</div>
                    <div className="text-[11px] font-medium text-pencil truncate">
                      {r.summary.slice(1).join(' • ')} {r.linkBukti && <>• <a href={r.linkBukti} target="_blank" rel="noreferrer" className="text-spark hover:underline inline-flex items-center gap-1">Bukti <Eye size={10} weight="regular" /></a></>}
                    </div>
                    {r.status === 'Ditolak' && r.alasan && (
                      <div className="mt-1.5 rounded-[10px] bg-red-50 border border-red-200 px-2.5 py-1.5">
                        <div className="text-[11px] font-black text-red-900">Alasan Ditolak</div>
                        <div className="text-[11px] font-medium text-red-800">{r.alasan}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 hidden lg:table-cell text-[11px] font-bold text-faded whitespace-nowrap">
                    <span className="inline-flex items-center gap-1"><Clock size={12} weight="regular" /> {new Date(r.updatedAt).toLocaleDateString('id-ID')}</span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {r.status === 'Ditolak' ? (
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => handleEdit(r)} className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black hover:border-charcoal">
                          <PencilSimple size={12} weight="bold" /> Edit
                        </button>
                        <button onClick={() => handleResubmit(r.id)} className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-eager text-white border-2 border-eager-dark text-[11px] font-black shadow-sticker">
                          <PaperPlaneTilt size={12} weight="fill" color="white" /> Kirim Ulang
                        </button>
                      </div>
                    ) : r.status === 'Disetujui' ? (
                      <div className="flex flex-col items-end gap-1.5">
                        {deleteTarget === r.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              id={`hapus-alasan-${r.id}`}
                              name={`hapus-alasan-${r.id}`}
                              type="text"
                              autoComplete="off"
                              aria-label="Alasan permintaan hapus"
                              value={deleteAlasan}
                              onChange={(e)=>setDeleteAlasan(e.target.value)}
                              placeholder="Alasan hapus..."
                              className="h-8 px-3 rounded-full border-2 border-zinc-200 text-[11px] font-bold w-[160px] focus:border-eager focus:outline-none"
                            />
                            <button onClick={()=>handleRequestDelete(r.id)} className="h-8 px-3 rounded-full bg-red-600 text-white text-[11px] font-black">Kirim</button>
                            <button onClick={()=>{setDeleteTarget(null); setDeleteAlasan('');}} className="h-8 px-2 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black">Batal</button>
                          </div>
                        ) : (
                          <button onClick={()=>setDeleteTarget(r.id)} className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black hover:border-red-300 hover:text-red-700">
                            <Trash size={12} weight="bold" /> Minta Hapus
                          </button>
                        )}
                      </div>
                    ) : r.status === 'Draft' ? (
                      <div className="flex justify-end gap-1.5">
                        {/* Lanjutkan → lompat ke tab indikator yang tepat; draft auto-load di sana */}
                        <Link
                          to={{ pathname: '/operator/input', search: `?tab=${encodeURIComponent(r.indikatorKode)}` }}
                          className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-eager text-white border-2 border-eager-dark text-[11px] font-black shadow-sticker hover:brightness-[1.03]"
                          title="Lanjutkan draft di halaman Input Capaian"
                        >
                          <PencilSimple size={12} weight="bold" /> Lanjutkan
                        </Link>
                        <button
                          onClick={() => setDeleteDraftTarget(r)}
                          className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black text-charcoal hover:border-red-300 hover:text-red-700"
                          title="Hapus draf permanen"
                        >
                          <Trash size={12} weight="bold" /> Hapus
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex h-8 px-3 rounded-full bg-zinc-50 border-2 border-zinc-100 text-[11px] font-bold text-faded">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-50 border-2 border-zinc-200 mx-auto flex items-center justify-center"><Clock size={20} weight="regular" color="#afafaf" /></div>
            <div className="text-[13px] font-black text-charcoal mt-3">Tidak ada data</div>
            <div className="text-[12px] font-medium text-pencil">Ubah filter atau tambah capaian baru.</div>
          </div>
        )}
      </div>

      {/* Modal konfirmasi hapus draft — hard delete + audit trail */}
      {deleteDraftTarget && (
        <DeleteDraftModal
          draft={{
            id: deleteDraftTarget.id,
            indikatorNama: deleteDraftTarget.indikatorNama,
            namaKegiatan: deleteDraftTarget.summary?.[0] || deleteDraftTarget.namaKegiatan,
            updatedAt: deleteDraftTarget.updatedAt,
          }}
          busy={deletingDraft}
          onConfirm={handleDeleteDraft}
          onClose={() => setDeleteDraftTarget(null)}
        />
      )}
    </div>
  );
}

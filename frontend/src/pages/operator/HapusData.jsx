import { useState, useEffect, useCallback } from 'react';
import { Trash, WarningCircle, CheckCircle, Info, ShieldCheck, SpinnerGap } from 'phosphor-react';
import DeleteRequestPanel from '../../components/operator/DeleteRequestPanel';
import DeleteRequestModal from '../../components/operator/DeleteRequestModal';
import { apiFetch } from '../../lib/api';

export default function HapusData() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  // Fetch approved submissions milik operator (kandidat request-delete)
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      let arr = [];
      try {
        const data = await apiFetch('/api/operator/submission-item?status=disetujui', { auth: true });
        arr = Array.isArray(data) ? data : (data.data || []);
      } catch {
        try {
          const alt = await apiFetch('/api/operator/riwayat?status=disetujui', { auth: true });
          arr = Array.isArray(alt) ? alt : (alt.data || []);
        } catch  { /* biarkan senyap — non-kritis */ }
      }
      // normalize + merge with local delete-request state (if backend has GET endpoint later)
      setItems(arr.map((r) => ({
        id: r.id,
        indikatorNama: r.indikator?.nama || r.indikatorKode || '-',
        indikatorKode: r.indikator?.slug || '-',
        nama: r.namaKegiatan || '-',
        institusi: r.institusi || '-',
        statusRequest: 'Belum Diajukan',
        alasan: null,
        requestedAt: null,
        alasanAdmin: null,
        _raw: r,
      })));
    } catch {
      setItems([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); /* eslint-disable-line react-hooks/set-state-in-effect -- async fn; setState di promise callback (docs: eslint-react) */ }, [fetchItems]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAjukan = (item) => setSelected(item);

  const handleSubmit = async (id, alasan) => {
    try {
      await apiFetch(`/api/operator/submission-item/${id}/request-delete`, { method: 'POST', body: { alasan }, auth: true });
      setItems((prev) => prev.map((it) => (String(it.id) === String(id) ? { ...it, statusRequest: 'Menunggu Persetujuan', alasan, requestedAt: new Date().toISOString(), alasanAdmin: null } : it)));
      setSelected(null);
      showToast('Permintaan hapus diajukan — Menunggu Persetujuan Admin.', 'success');
    } catch (e) {
      showToast(e.message || 'Gagal ajukan hapus.', 'error');
    }
  };

  const handleBatal = async (_id) => {
    // Backend tidak punya endpoint cancel — tampilkan info
    showToast('Pembatalan pengajuan belum tersedia di backend.', 'error');
  };

  const counts = {
    total: items.length,
    belum: items.filter((i) => i.statusRequest === 'Belum Diajukan').length,
    menunggu: items.filter((i) => i.statusRequest === 'Menunggu Persetujuan').length,
    disetujui: items.filter((i) => i.statusRequest === 'Disetujui').length,
    ditolak: items.filter((i) => i.statusRequest === 'Ditolak').length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black text-charcoal">
          <Trash size={14} weight="regular" /> Hapus Data
        </div>
        <h1 className="font-display font-black tracking-[-0.02em] text-[20px] lg:text-[24px] leading-none text-charcoal mt-3">Permintaan Hapus Data</h1>
        <p className="text-[12px] leading-5 font-medium text-pencil mt-2 max-w-[68ch]">
          Fitur ini <b>hanya untuk data berstatus Disetujui</b>. Draft/Menunggu/Ditolak tidak masuk di sini karena masih bisa diedit langsung. Anda hanya mengajukan
          <b> permintaan hapus</b> (soft delete) dengan alasan wajib — Admin harus menyetujui dulu. Jika disetujui, data ditandai terhapus, skor dihitung ulang, dan tercatat di audit trail.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-[12px] bg-white border-2 border-zinc-200 p-3">
          <div className="text-[11px] font-black tracking-wide text-faded uppercase">Total Approved</div>
          <div className="font-display font-black text-[22px] leading-none text-charcoal mt-1">{counts.total}</div>
          <div className="text-[11px] font-bold text-pencil">Baris Disetujui</div>
        </div>
        <div className="rounded-[12px] bg-spark/10 border-2 border-spark/30 p-3">
          <div className="text-[11px] font-black tracking-wide text-faded uppercase">Menunggu</div>
          <div className="font-display font-black text-[22px] leading-none text-spark mt-1">{counts.menunggu}</div>
          <div className="text-[11px] font-bold text-pencil">Persetujuan Admin</div>
        </div>
        <div className="rounded-[12px] bg-emerald-50 border-2 border-emerald-200 p-3">
          <div className="text-[11px] font-black tracking-wide text-faded uppercase">Disetujui</div>
          <div className="font-display font-black text-[22px] leading-none text-eager mt-1">{counts.disetujui}</div>
          <div className="text-[11px] font-bold text-pencil">Sudah terhapus</div>
        </div>
        <div className="rounded-[12px] bg-zinc-900 border-2 border-black p-3">
          <div className="text-[11px] font-black tracking-wide text-white/60 uppercase">Ditolak</div>
          <div className="font-display font-black text-[22px] leading-none text-white mt-1">{counts.ditolak}</div>
          <div className="text-[11px] font-bold text-white/70">Perlu ajukan ulang</div>
        </div>
      </div>

      {/* Info status flow */}
      <div className="rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3 flex flex-wrap items-center gap-2 text-[11px] font-bold">
        <span className="inline-flex h-6 px-2.5 rounded-full bg-white border-2 border-zinc-200 text-faded">Belum Diajukan</span>
        <span className="text-faded">→</span>
        <span className="inline-flex h-6 px-2.5 rounded-full bg-spark text-white border-2 border-spark-dark">Menunggu Persetujuan</span>
        <span className="text-faded">→</span>
        <span className="inline-flex h-6 px-2.5 rounded-full bg-eager text-white border-2 border-eager-dark">Disetujui</span>
        <span className="text-faded">/</span>
        <span className="inline-flex h-6 px-2.5 rounded-full bg-ink text-white border-2 border-black">Ditolak</span>
        <span className="hidden sm:inline-flex items-center gap-1 ml-2 text-faded">
          <ShieldCheck size={12} weight="regular" /> Hanya Approved
        </span>
      </div>

      {toast && (
        <div className={`rounded-[12px] border-2 px-4 py-3 flex gap-2.5 text-[13px] font-bold ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} weight="fill" color="#059669" className="shrink-0 mt-0.5" /> : <WarningCircle size={18} weight="fill" color="#dc2626" className="shrink-0 mt-0.5" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-8 text-center text-[13px] font-bold text-faded flex items-center justify-center gap-2"><SpinnerGap size={16} weight="bold" className="animate-spin" /> Memuat data approved...</div>
      ) : (
        <DeleteRequestPanel items={items} onAjukan={handleAjukan} onBatal={handleBatal} />
      )}

      <div className="rounded-[12px] bg-amber-50 border-2 border-amber-200 p-3 flex gap-2">
        <Info size={16} weight="regular" color="#d97706" className="shrink-0 mt-0.5" />
        <p className="text-[11px] leading-5 font-medium text-amber-900">
          Soft delete — data tidak hilang permanen, hanya ditandai terhapus untuk audit trail. Approval Admin dikerjakan di halaman Antrian Validasi.
        </p>
      </div>

      {selected && <DeleteRequestModal item={selected} onClose={() => setSelected(null)} onSubmit={handleSubmit} />}
    </div>
  );
}

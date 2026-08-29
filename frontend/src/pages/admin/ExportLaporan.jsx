import { useState, useEffect } from 'react';
import { FilePdf, FileXls, DownloadSimple, Calendar, CheckCircle, Info, SpinnerGap, WarningCircle } from 'phosphor-react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../lib/api';

export default function ExportLaporan() {
  const { token } = useAuth();
  const [periodes, setPeriodes] = useState([]);
  const [periode, setPeriode] = useState('');
  const [kelompok, setKelompok] = useState('');
  const [loading, setLoading] = useState(null); // 'pdf' | 'excel' | null
  const [toast, setToast] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!token) return;
    apiFetch('/api/admin/periode', { auth: true }).then((res) => {
      const list = Array.isArray(res) ? res : (res.data || []);
      const mapped = list.map((p) => ({ id: p.id, nama: p.namaPeriode || p.nama, status: p.status }));
      setPeriodes(mapped);
      // functional update: tak perlu baca `periode` -> bebas dari exhaustive-deps
      setPeriode((cur) => cur || String(mapped[0].id));
    }).catch(()=>{});
  }, [token]);

  const triggerDownload = async (type) => {
    if (!periode) { setErr('Pilih periode dulu'); return; }
    setLoading(type);
    setToast(null); setErr('');
    try {
      const isPdf = type === 'pdf';
      const ext = isPdf ? 'pdf' : 'xlsx';
      const url = `/api/admin/export/${isPdf ? 'pdf' : 'excel'}?periodeId=${encodeURIComponent(periode)}${kelompok ? `&kelompok=${encodeURIComponent(kelompok)}` : ''}`;
      // Use fetch with blob handling
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}${url}`, { headers, credentials: 'include' });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        throw new Error(j.error || j.message || `Gagal export ${type} (${res.status})`);
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `leaderboard-${periode}${kelompok?`-${kelompok}`:''}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // revoke after short delay to allow download
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
      setToast(`Unduhan ${type.toUpperCase()} dimulai — ${periode}${kelompok?` • ${kelompok}`:''}`);
      setTimeout(() => setToast(null), 4000);
    } catch (e) {
      setErr(e.message || `Gagal export ${type}`);
    } finally {
      setLoading(null);
    }
  };

  const periodeInfo = periodes.find((p) => String(p.id) === String(periode));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-black tracking-[-0.02em] text-[20px] lg:text-[24px] leading-none text-charcoal">Export Laporan</h1>
        <p className="text-[12px] font-medium text-pencil mt-1">Filter periode sebelum export — PDF dengan kop instansi & Excel rincian 9 indikator (hanya Disetujui).</p>
      </div>

      <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black text-charcoal">
            <Calendar size={14} weight="regular" /> Periode
          </span>
          <select value={periode} onChange={(e) => setPeriode(e.target.value)} className="h-9 px-4 rounded-full border-2 border-zinc-200 bg-white text-[13px] font-black text-charcoal min-w-[160px]">
            <option value="">Pilih periode</option>
            {periodes.map((p) => (
              <option key={p.id} value={p.id}>{p.nama} — {p.status}</option>
            ))}
          </select>
          <select value={kelompok} onChange={(e) => setKelompok(e.target.value)} className="h-9 px-4 rounded-full border-2 border-zinc-200 bg-white text-[13px] font-black text-charcoal">
            <option value="">Semua kelompok</option>
            {['MI Negeri','MI Swasta','MTs Negeri','MTs Swasta','MA Negeri','MA Swasta'].map((k)=><option key={k} value={k}>{k}</option>)}
          </select>
          <span className="inline-flex h-7 px-3 rounded-full bg-zinc-50 border-2 border-zinc-100 text-[11px] font-bold text-pencil">
            {periodeInfo?.status || '-'} • {periode||'-'}
          </span>
        </div>

        <div className="mt-5 rounded-[12px] border-2 border-dashed border-zinc-200 bg-zinc-50 p-4">
          <div className="text-[11px] font-black tracking-wide text-faded uppercase">Preview</div>
          <div className="mt-2 grid sm:grid-cols-3 gap-3 text-[12px]">
            <div className="rounded-[12px] bg-white border-2 border-zinc-100 p-3">
              <div className="font-black text-charcoal">Kop instansi</div>
              <div className="font-medium text-pencil">Kankemenag Kab. Pasuruan — Seksi Pendma</div>
            </div>
            <div className="rounded-[12px] bg-white border-2 border-zinc-100 p-3">
              <div className="font-black text-charcoal">Periode {periodeInfo?.nama || periode || '-'}</div>
              <div className="font-medium text-pencil">6 kelompok • Top 3 • Semua ranking</div>
            </div>
            <div className="rounded-[12px] bg-white border-2 border-zinc-100 p-3">
              <div className="font-black text-charcoal">Tanggal cetak</div>
              <div className="font-medium text-pencil">{new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</div>
            </div>
          </div>
          <div className="mt-3 text-[11px] font-medium text-faded flex items-center gap-1.5">
            <Info size={12} weight="regular" color="#afafaf" /> Hanya data Disetujui yang masuk laporan (PRD US12).
          </div>
        </div>

        <div className="mt-5 grid sm:grid-cols-2 gap-3">
          <button
            onClick={() => triggerDownload('pdf')}
            disabled={!!loading || !periode}
            className="inline-flex items-center justify-center gap-2 h-11 rounded-[12px] bg-ink border-2 border-black text-white font-black text-[13px] disabled:opacity-60 shadow-[0_4px_0_0_#000437] hover:brightness-[1.03] active:translate-y-[2px] active:shadow-none transition"
          >
            {loading === 'pdf' ? <SpinnerGap size={16} weight="bold" className="animate-spin" /> : <FilePdf size={18} weight="fill" color="white" />}
            {loading === 'pdf' ? 'Memproses PDF...' : 'Export PDF'}
            {!loading && <DownloadSimple size={16} weight="regular" color="white" />}
          </button>
          <button
            onClick={() => triggerDownload('excel')}
            disabled={!!loading || !periode}
            className="inline-flex items-center justify-center gap-2 h-11 rounded-[12px] bg-eager border-2 border-eager-dark text-white font-black text-[13px] shadow-sticker hover:brightness-[1.03] active:translate-y-[2px] active:shadow-none disabled:opacity-60"
          >
            {loading === 'excel' ? <SpinnerGap size={16} weight="bold" className="animate-spin" /> : <FileXls size={18} weight="fill" color="white" />}
            {loading === 'excel' ? 'Memproses Excel...' : 'Export Excel'}
          </button>
        </div>

        {toast && (
          <div className="mt-4 rounded-[12px] bg-emerald-50 border-2 border-emerald-200 text-emerald-900 px-4 py-3 flex gap-2 text-[13px] font-bold">
            <CheckCircle size={18} weight="fill" color="#059669" className="shrink-0 mt-0.5" />
            <span>{toast}</span>
          </div>
        )}
        {err && (
          <div className="mt-4 rounded-[12px] bg-red-50 border-2 border-red-200 text-red-900 px-4 py-3 flex gap-2 text-[13px] font-bold">
            <WarningCircle size={18} weight="fill" color="#dc2626" className="shrink-0 mt-0.5" />
            <span>{err}</span>
          </div>
        )}

        <div className="mt-4 rounded-[12px] bg-amber-50 border-2 border-amber-200 p-3 flex gap-2">
          <Info size={16} weight="regular" color="#d97706" className="shrink-0 mt-0.5" />
          <p className="text-[11px] leading-5 font-medium text-amber-900">
            File diunduh via Blob — <span className="font-mono">URL.createObjectURL</span> + <span className="font-mono">revokeObjectURL</span> untuk cegah memory leak.
          </p>
        </div>
      </div>
    </div>
  );
}

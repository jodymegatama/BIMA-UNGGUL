import { useState, useEffect, useCallback } from 'react';
import { FloppyDisk, Lock, Clock, CheckCircle, WarningCircle, SpinnerGap } from 'phosphor-react';
import BobotIndikatorForm from '../../components/admin/BobotIndikatorForm';
import { TINGKAT_WILAYAH_OPTIONS, JENJANG_PENDIDIKAN_OPTIONS } from '../../constants/indikator';
import { apiFetch } from '../../lib/api';

// kunci field per tipe — derived dari registry constants/indikator.js (satu sumber)
const TINGKAT_WILAYAH_KEYS = TINGKAT_WILAYAH_OPTIONS.map((o) => o.value);
const JENJANG_KEYS = JENJANG_PENDIDIKAN_OPTIONS.map((o) => o.value);

// Fallback periode list if GET /api/admin/periode fails
const FALLBACK_PERIODE = [{ id: 'fallback', namaPeriode: '2026/2027', nama: '2026/2027', status: 'aktif' }];

export default function KonfigurasiBobot() {
  const [periodes, setPeriodes] = useState(FALLBACK_PERIODE);
  const [periodeId, setPeriodeId] = useState(null);
  const [periodeStatus, setPeriodeStatus] = useState('Aktif');
  const [data, setData] = useState(null); // { indikatorId: { tipe, nilai, ... } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchPeriodes = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/periode', { auth: true });
      const list = Array.isArray(res) ? res : (res.data || []);
      if (list.length) {
        const mapped = list.map((p) => ({ id: p.id, nama: p.namaPeriode || p.nama, namaPeriode: p.namaPeriode || p.nama, status: p.status === 'aktif' ? 'Aktif' : p.status === 'finalisasi' ? 'Finalisasi' : p.status }));
        setPeriodes(mapped);
        // functional update: tidak perlu baca state periodeId — bebas dari stale closure
        setPeriodeId((cur) => cur ?? mapped[0].id);
        setPeriodeStatus((cur) => cur === 'Aktif' ? (mapped[0].status || cur) : cur);
      }
    } catch  { /* biarkan senyap — non-kritis */ }
  }, []);

  const fetchBobot = useCallback(async (pid) => {
    if (!pid || pid === 'fallback') { setData(null); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await apiFetch(`/api/admin/bobot?periodeId=${pid}`, { auth: true });
      const arr = Array.isArray(res) ? res : (res.data || []);
      // Backend merge left-join: selalu 9 entri {indikatorId, slug, nama, tipeFormula, ...bobot|null}
      const map = {};
      for (const b of arr) {
        const slug = b.slug || b.indikator?.slug;
        if (!slug) continue;
        const tipeRaw = b.tipeFormula || b.indikator?.tipeFormula || 'per_capaian';
        const tipe = tipeRaw === 'per_tingkat_wilayah' ? 'per_tingkat' : tipeRaw;
        const base = { id: b.indikatorId ?? b.indikator?.id, kode: slug, nama: b.nama || b.indikator?.nama || '' };
        if (tipe === 'per_tingkat') {
          const w = b.bobotTingkatWilayah || {};
          map[slug] = { ...base, tipe, kabupaten: w.kabupaten ?? '', provinsi: w.provinsi ?? '', nasional: w.nasional ?? '', internasional: w.internasional ?? '' };
        } else if (tipe === 'per_jenjang') {
          const j = b.bobotJenjang || {};
          map[slug] = { ...base, tipe, s1: j.s1 ?? '', s2: j.s2 ?? '', s3: j.s3 ?? '' };
        } else {
          map[slug] = { ...base, tipe, nilai: b.nilaiBobot ?? '' };
        }
      }
      setData(map);
    } catch (e) {
      setData(null);
      setToast({ type: 'error', msg: e.message || 'Gagal memuat bobot dari server.' });
      setTimeout(() => setToast(null), 4000);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPeriodes(); /* eslint-disable-line react-hooks/set-state-in-effect -- async fn; setState di promise callback (docs: eslint-react) */ }, [fetchPeriodes]);
  useEffect(() => { if (periodeId) fetchBobot(periodeId); /* eslint-disable-line react-hooks/set-state-in-effect -- async fn; setState di promise callback (docs: eslint-react) */ }, [periodeId, fetchBobot]);

  const isLocked = periodeStatus === 'Finalisasi' || periodeStatus === 'Arsip' || periodeStatus === 'finalisasi';

  // Counter indikator terisi — untuk sticky save bar
  const allValues = Object.values(data || {});
  const isFilled = (item) => {
    if (item.tipe === 'per_tingkat') return TINGKAT_WILAYAH_KEYS.every((f) => item[f] !== '' && item[f] !== null);
    if (item.tipe === 'per_jenjang') return JENJANG_KEYS.every((f) => item[f] !== '' && item[f] !== null);
    return item.nilai !== '' && item.nilai !== null;
  };
  const isiCount = allValues.filter(isFilled).length;
  const totalCount = allValues.length;

  const handleChange = (kode, field, val) => {
    setData((prev) => ({
      ...prev,
      [kode]: { ...(prev?.[kode] || {}), [field]: val === '' ? '' : Number(val) },
    }));
  };

  const handleSave = async () => {
    if (isLocked) return;
    if (!data) return;
    // 0 diizinkan (= indikator nonaktif); hanya kosong/non-numerik yang ditolak — selaras kontrak backend >= 0
    const filled = (v) => v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v));
    const invalid = Object.values(data).some((it) => {
      if (it.tipe === 'per_capaian' || it.tipe === 'persentase') return !filled(it.nilai);
      if (it.tipe === 'per_tingkat') return ![it.kabupaten, it.provinsi, it.nasional, it.internasional].every(filled);
      if (it.tipe === 'per_jenjang') return ![it.s1, it.s2, it.s3].every(filled);
      return false;
    });
    if (invalid) {
      setToast({ type: 'error', msg: 'Semua bobot wajib diisi (0 diizinkan = indikator nonaktif)' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setSaving(true);
    try {
      // Backend expects NUMERIC indikatorId (parseInt). Slug/kode tidak valid — jangan dikirim.
      const bobots = Object.entries(data).map(([, v]) => {
        const indikatorId = Number(v.id);
        if (!Number.isFinite(indikatorId)) return null;
        const payload = { indikatorId };
        if (v.tipe === 'per_capaian' || v.tipe === 'persentase') payload.nilaiBobot = Number(v.nilai);
        if (v.tipe === 'per_tingkat') payload.bobotTingkatWilayah = { kabupaten: Number(v.kabupaten), provinsi: Number(v.provinsi), nasional: Number(v.nasional), internasional: Number(v.internasional) };
        if (v.tipe === 'per_jenjang') payload.bobotJenjang = { s1: Number(v.s1), s2: Number(v.s2), s3: Number(v.s3) };
        return payload;
      }).filter(Boolean);
      if (bobots.length !== Object.keys(data).length) {
        setToast({ type: 'error', msg: 'Sebagian indikator belum punya ID valid — reload halaman lalu coba lagi.' });
        setTimeout(() => setToast(null), 4000);
        return;
      }
      const body = { periodeId, bobots };
      await apiFetch('/api/admin/bobot', { method: 'PATCH', body, auth: true });
      setToast({ type: 'success', msg: `Bobot periode ${periodeId} disimpan — histori diperbarui` });
    } catch (e) {
      const msg = e.status === 423 ? 'Bobot terkunci — periode sudah Finalisasi. Reopen dulu.' : (e.message || 'Gagal simpan bobot');
      setToast({ type: 'error', msg });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handlePeriodeChange = (id) => {
    setPeriodeId(id);
    const p = periodes.find((x) => String(x.id) === String(id));
    if (p) setPeriodeStatus(p.status);
    setData(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-black tracking-[-0.02em] text-[20px] lg:text-[24px] leading-none text-charcoal">Konfigurasi Bobot</h1>
        <p className="text-[12px] font-medium text-pencil mt-1">Bobot per indikator, per tingkat wilayah, per jenjang — histori per periode, terkunci saat Finalisasi.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {periodes.map((p) => (
          <button
            key={p.id}
            onClick={() => handlePeriodeChange(p.id)}
            className={`h-9 px-4 rounded-full border-2 text-[12px] font-black transition ${String(periodeId) === String(p.id) ? 'bg-ink text-white border-black shadow-[0_4px_0_0_#000437]' : 'bg-white border-zinc-200 text-charcoal hover:border-zinc-300 hover:bg-zinc-50 active:translate-y-[1px]'}`}
          >
            {p.namaPeriode || p.nama} <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full border ${p.status === 'Finalisasi' || p.status === 'Arsip' ? 'bg-zinc-100 border-zinc-200 text-faded' : 'bg-story border-[#b8eb8a] text-eager-dark'}`}>{p.status}</span>
          </button>
        ))}
      </div>

      <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ${isLocked ? 'bg-zinc-100 border-zinc-200 text-faded' : 'bg-eager border-eager-dark text-white shadow-sticker'}`}>
            {isLocked ? <Lock size={16} weight="fill" color="#afafaf" /> : <FloppyDisk size={16} weight="regular" color="white" />}
          </span>
          <div>
            <div className="text-[13px] font-black text-charcoal">Periode {periodes.find((p)=>String(p.id)===String(periodeId))?.namaPeriode || periodeId} — {periodeStatus}</div>
            <div className="text-[11px] font-bold text-pencil">{isLocked ? 'Terkunci (Finalisasi/Arsip) — read-only' : 'Editable — bobot akan dipakai untuk hitung skor realtime'}</div>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`rounded-[12px] border-2 px-4 py-3 flex gap-2 text-[13px] font-bold ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} weight="fill" color="#059669" className="shrink-0 mt-0.5" /> : <WarningCircle size={18} weight="fill" color="#dc2626" className="shrink-0 mt-0.5" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-8 text-center text-[13px] font-bold text-faded flex items-center justify-center gap-2"><SpinnerGap size={16} weight="bold" className="animate-spin" /> Memuat bobot...</div>
      ) : (
        <BobotIndikatorForm data={data} onChange={handleChange} locked={isLocked} />
      )}

      {isLocked && (
        <div className="rounded-[12px] bg-amber-50 border-2 border-amber-200 p-3 flex gap-2">
          <Clock size={16} weight="regular" color="#d97706" className="shrink-0 mt-0.5" />
          <p className="text-[11px] leading-5 font-bold text-amber-900">Periode berstatus {periodeStatus} — bobot terkunci. Untuk ubah, lakukan Reopen di Manajemen Periode (butuh alasan, tercatat audit log).</p>
        </div>
      )}

      {/* Sticky save bar — selalu terlihat saat scroll (pola context7 sticky bottom) */}
      {!loading && (
        <div className="sticky bottom-0 z-20 border-t-2 border-zinc-100 bg-white/95 backdrop-blur-sm pt-3 pb-1">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[12px] font-black text-charcoal truncate">
                {isLocked ? 'Periode terkunci' : `${isiCount} dari ${totalCount} indikator terisi`}
              </div>
              <div className="text-[11px] font-bold text-pencil truncate">Bobot 0 = indikator nonaktif • bobot dipakai untuk hitung skor realtime</div>
            </div>
            <button
              onClick={handleSave}
              disabled={isLocked || saving || !periodeId}
              className={`h-10 px-5 rounded-[12px] border-2 font-black text-[13px] flex items-center gap-2 shrink-0 ${isLocked ? 'bg-zinc-100 border-zinc-200 text-faded cursor-not-allowed' : 'bg-eager border-eager-dark text-white shadow-sticker hover:brightness-[1.03] active:translate-y-[2px] active:shadow-none transition'}`}
            >
              {saving ? <><SpinnerGap size={16} weight="bold" className="animate-spin" /> Menyimpan...</> : isLocked ? 'Terkunci' : 'Simpan Bobot'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

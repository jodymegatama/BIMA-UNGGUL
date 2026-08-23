import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { toast } from 'sonner';
import { PlusCircle, FloppyDisk, PaperPlaneTilt, Buildings, Info, SpinnerGap, CheckCircle, WarningCircle, Stack } from 'phosphor-react';
import IndikatorTabs from '../../components/operator/IndikatorTabs';
import CapaianRow from '../../components/operator/CapaianRow';
import { INDIKATORS, emptyRowFor, validateRow, buildPayload } from '../../constants/indikator';
import { apiFetch } from '../../lib/api';
import { useOperator } from '../../context/OperatorContext';

function groupByIndikator(list, indikatorList) {
  const map = {};
  indikatorList.forEach((ind) => (map[ind.kode] = []));
  list.forEach((r, idx) => {
    const kode = r.indikatorKode || r.indikator?.slug || 'diklat';
    if (!map[kode]) map[kode] = [];
    map[kode].push({ ...r, _idx: idx + 1, _error: {} });
  });
  // TANPA auto-placeholder — default halaman: grid baris kosong, muncul setelah "Tambah Baris Baru"
  return map;
}

export default function InputCapaian() {
  const { madrasah } = useOperator();
  const madrasahNama = madrasah?.nama || '-';
  const [periodeNama, setPeriodeNama] = useState('—');
  const [indikators, setIndikators] = useState(INDIKATORS);
  const [active, setActive] = useState('diklat');
  const [data, setData] = useState(() => groupByIndikator([], INDIKATORS));
  // busy: 'draft' | 'submit' | null — loading state tombol aksi (anti double-submit)
  const [busy, setBusy] = useState(null);
  const [lastAction, setLastAction] = useState(null); // {type:'success'|'error'|'info', msg} untuk status inline aria-live
  const [loadingIndikator, setLoadingIndikator] = useState(true);

  // Fetch 9 indikator aktif — GET /api/operator/indikator (tanpa periode, pakai aktif terbaru)
  useEffect(() => {
    let ignore = false;
    async function fetchIndikator() {
      try {
        const res = await apiFetch('/api/operator/indikator', { auth: true });
        if (!ignore && res?.periode?.namaPeriode) setPeriodeNama(res.periode.namaPeriode);
        // backend may return { data: [...] } or array directly
        const list = Array.isArray(res) ? res : (res.data || res.indikators || res.indikator || []);
        if (!ignore && Array.isArray(list) && list.length) {
          const mapped = list.map((it) => ({
            kode: it.slug || it.kode || it.indikatorKode,
            nama: it.nama || it.namaIndikator || it.kode,
            short: it.short || (it.nama || it.kode || '').slice(0, 12),
            id: it.id,
          })).filter((x) => x.kode);
          if (mapped.length) {
            setIndikators(mapped);
            setData((prev) => {
              const flat = Object.values(prev).flat().filter((r) => !String(r.id).startsWith('new-'));
              return groupByIndikator(flat, mapped);
            });
            if (!mapped.find((i) => i.kode === active)) setActive(mapped[0].kode);
          }
        }
      } catch {
        // keep skeleton constants — tidak error UI
      } finally {
        if (!ignore) setLoadingIndikator(false);
      }
    }
    fetchIndikator();
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = data[active] || [];
  const counts = useMemo(() => Object.fromEntries(indikators.map((ind) => [ind.kode, (data[ind.kode] || []).length])), [data, indikators]);
  const activeInd = indikators.find((i) => i.kode === active);
  const activeIndikatorId = activeInd?.id;

  const updateRow = (id, field, val) => {
    setData((prev) => ({
      ...prev,
      [active]: prev[active].map((r) => (r.id === id ? { ...r, [field]: val, _error: { ...r._error, [field]: undefined } } : r)),
    }));
  };

  const removeRow = (id) => {
    setData((prev) => ({
      ...prev,
      [active]: prev[active].filter((r) => r.id !== id).map((r, i) => ({ ...r, _idx: i + 1 })),
    }));
    toast.info('Baris dihapus.');
  };

  const addRow = () => {
    const newId = `new-${active}-${Date.now()}`;
    setData((prev) => ({
      ...prev,
      [active]: [...prev[active], { id: newId, indikatorKode: active, status: 'Draft', ...emptyRowFor(active), _idx: prev[active].length + 1, _error: {} }],
    }));
  };

  const validateRows = () => {
    let hasErr = false;
    const updated = rows.map((r) => {
      // validasi config-driven per indikator (PRD §11) — required, URL, number, ratio
      const e = validateRow(active, r);
      if (Object.keys(e).length) hasErr = true;
      return { ...r, _error: e };
    });
    if (hasErr) {
      setData((prev) => ({ ...prev, [active]: updated }));
    }
    return !hasErr;
  };

  /** Baris dianggap "ada isi" jika minimal satu field dinamis terisi. */
  function rowHasContent(r) {
    return Object.entries(r).some(([k, v]) => !k.startsWith('_') && !['id', 'indikatorKode', 'status'].includes(k) && String(v ?? '').trim() !== '');
  }

  const handleDraft = async () => {
    if (!validateRows()) {
      toast.error('Perbaiki field wajib terlebih dahulu.');
      return;
    }
    setBusy('draft');
    setLastAction(null);
    try {
      // optimistic local
      setData((prev) => ({ ...prev, [active]: prev[active].map((r) => ({ ...r, status: 'Draft' })) }));
      if (activeIndikatorId) {
        const items = rows.filter(rowHasContent).map((r) => buildPayload(active, r));
        if (items.length === 0) {
          setLastAction({ type: 'info', msg: 'Tidak ada baris berisi untuk disimpan.' });
          toast.info('Tidak ada baris berisi untuk disimpan.');
        } else {
          await apiFetch(`/api/operator/indikator/${activeIndikatorId}/draft`, { method: 'POST', body: { items }, auth: true });
          const msg = `Draft tersimpan di server untuk ${activeInd?.nama} (${items.length} baris).`;
          setLastAction({ type: 'success', msg });
          toast.success(msg);
          // UX: grid popout — kembali ke empty state setelah sukses (draft lanjut via Riwayat › Lanjutkan)
          setData((prev) => ({ ...prev, [active]: [] }));
        }
      } else {
        const msg = `Draft disimpan untuk ${activeInd?.nama} (${rows.length} baris).`;
        setLastAction({ type: 'success', msg });
        toast.success(msg);
        setData((prev) => ({ ...prev, [active]: [] }));
      }
    } catch (e) {
      const msg = e.message || 'Gagal simpan draft. Data lokal tetap tersimpan.';
      setLastAction({ type: 'error', msg });
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  };

  const handleSubmit = async () => {
    if (!validateRows()) {
      toast.error('Lengkapi field wajib sesuai indikator.');
      return;
    }
    setBusy('submit');
    setLastAction(null);
    try {
      setData((prev) => ({ ...prev, [active]: prev[active].map((r) => ({ ...r, status: 'Menunggu' })) }));
      if (activeIndikatorId) {
        const items = rows.filter(rowHasContent).map((r) => ({ ...(r.id && !String(r.id).startsWith('new-') ? { id: r.id } : {}), ...buildPayload(active, r) }));
        if (items.length === 0) {
          const msg = 'Tidak ada baris berisi untuk dikirim.';
          setLastAction({ type: 'error', msg });
          toast.error(msg);
          setData((prev) => ({ ...prev, [active]: prev[active].map((r) => ({ ...r, status: 'Draft' })) }));
        } else {
          await apiFetch(`/api/operator/indikator/${activeIndikatorId}/submit`, { method: 'POST', body: { items }, auth: true });
          const msg = `${items.length} baris dikirim untuk validasi (Menunggu).`;
          setLastAction({ type: 'success', msg });
          toast.success(msg, { description: `${activeInd?.nama} • ${madrasahNama}` });
          // UX: grid popout — kembali ke empty state; progres lanjut via Riwayat
          setData((prev) => ({ ...prev, [active]: [] }));
        }
      } else {
        const msg = `${rows.length} baris dikirim untuk validasi.`;
        setLastAction({ type: 'success', msg });
        toast.success(msg);
        setData((prev) => ({ ...prev, [active]: [] }));
      }
    } catch (e) {
      const msg = e.status === 403 && /cutoff|periode/i.test(e.message) ? 'Periode penilaian sudah berakhir — tidak bisa submit.' : (e.message || 'Gagal kirim. Coba lagi.');
      setLastAction({ type: 'error', msg });
      toast.error(msg);
      // revert optimistic if cutoff
      if (/berakhir/i.test(msg)) setData((prev) => ({ ...prev, [active]: prev[active].map((r) => ({ ...r, status: 'Draft' })) }));
    } finally {
      setBusy(null);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-black tracking-[-0.02em] text-[20px] lg:text-[24px] leading-none text-charcoal">Input Capaian</h1>
          <p className="text-[12px] font-medium text-pencil mt-1 flex items-center gap-1.5">
            <Buildings size={12} weight="regular" /> {madrasahNama} • <span className="font-black text-charcoal">{activeInd?.nama}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex h-7 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-bold text-pencil">Periode {periodeNama}</span>
          <span className="inline-flex h-7 px-3 rounded-full bg-story border-2 border-[#b8eb8a] text-[11px] font-black text-eager-dark">9 indikator</span>
        </div>
      </div>

      <IndikatorTabs activeKode={active} onChange={setActive} counts={counts} indikatorList={indikators} />

      <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-4 flex items-start gap-3 shadow-card">
        <div className="w-9 h-9 rounded-[12px] bg-eager border-2 border-eager-dark shadow-sticker flex items-center justify-center shrink-0 text-white font-black text-[12px]">0{indikators.findIndex((i) => i.kode === active) + 1}</div>
        <div>
          <div className="font-display font-black text-[15px] text-charcoal leading-tight">{activeInd?.nama}</div>
          <div className="text-[11px] font-mono font-bold text-faded">{activeInd?.kode}</div>
          <p className="text-[12px] font-medium text-pencil mt-1">Tambah baris tanpa batas. Link bukti wajib akses publik. Draft tidak masuk skor.</p>
        </div>
        <span className="ml-auto hidden sm:inline-flex h-7 px-3 rounded-full bg-zinc-50 border-2 border-zinc-100 text-[11px] font-black text-pencil">{rows.length} baris</span>
      </div>

      {/* Grid baris ↔ Empty state — AnimatePresence popout (Context7 /grx7/framer-motion) */}
      <AnimatePresence mode="wait" initial={false}>
        {rows.length === 0 ? (
          <motion.div
            key={`empty-${active}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-[16px] border-2 border-dashed border-zinc-300 bg-white/60 p-10 text-center"
          >
            <div className="w-14 h-14 rounded-full bg-zinc-50 border-2 border-zinc-200 mx-auto flex items-center justify-center">
              <Stack size={22} weight="regular" color="#afafaf" />
            </div>
            <div className="text-[15px] font-display font-black text-charcoal mt-4">Belum ada baris capaian</div>
            <p className="text-[13px] font-medium text-pencil mt-1 max-w-[46ch] mx-auto">
              Tambahkan baris pertama untuk indikator <b>{activeInd?.nama}</b> — bisa lebih dari satu, tanpa batas jumlah.
            </p>
            <button
              onClick={addRow}
              className="mt-5 inline-flex items-center gap-2 h-11 px-6 rounded-[12px] bg-eager border-2 border-eager-dark text-white font-black text-[14px] shadow-sticker hover:brightness-[1.03] active:translate-y-[2px] active:shadow-none transition"
            >
              <PlusCircle size={18} weight="bold" color="white" /> Tambah Baris Baru
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={`grid-${active}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12, scale: 0.985 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="grid gap-4">
              {rows.map((r) => (
                <CapaianRow key={r.id} row={r} indikatorKode={active} onChange={updateRow} onRemove={removeRow} />
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button onClick={addRow} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-[12px] bg-white border-2 border-zinc-200 text-charcoal font-black text-[13px] hover:border-charcoal">
                <PlusCircle size={16} weight="bold" /> Tambah baris baru
              </button>
              <span className="text-[11px] font-medium text-faded">Tanpa batas jumlah (PRD anti-goal)</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky action bar — selalu terlihat saat scroll; feedback tepat di titik aksi (UX fix) */}
      <div className="sticky bottom-0 z-20 -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 bg-white/95 backdrop-blur border-t-2 border-zinc-100 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        <div className="max-w-[1100px] mx-auto">
          {/* Status inline aria-live — diumumkan screen reader; visual pendamping tombol */}
          <div aria-live="polite" role="status" className="min-h-[20px] mb-1.5">
            {busy ? (
              <span className="inline-flex items-center gap-1.5 text-[12px] font-black text-spark">
                <SpinnerGap size={14} weight="bold" className="animate-spin" />
                {busy === 'draft' ? 'Menyimpan draft…' : 'Mengirim untuk validasi…'}
              </span>
            ) : lastAction ? (
              <span className={`inline-flex items-center gap-1.5 text-[12px] font-bold ${lastAction.type === 'success' ? 'text-emerald-700' : lastAction.type === 'error' ? 'text-red-600' : 'text-sky-600'}`}>
                {lastAction.type === 'success' ? <CheckCircle size={14} weight="fill" /> : lastAction.type === 'error' ? <WarningCircle size={14} weight="fill" /> : <Info size={14} weight="regular" />}
                {lastAction.msg}
              </span>
            ) : rows.length === 0 ? (
              <span className="text-[11px] font-medium text-faded">Tambahkan baris terlebih dahulu untuk menyimpan atau mengirim.</span>
            ) : (
              <span className="text-[11px] font-medium text-faded">Draft tidak masuk skor. Kirim untuk masuk antrian validasi Admin.</span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDraft}
              disabled={!!busy || rows.length === 0}
              title={rows.length === 0 ? 'Tambahkan baris terlebih dahulu' : undefined}
              className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-[12px] bg-white border-2 border-zinc-200 text-charcoal font-black text-[14px] hover:border-charcoal hover:bg-zinc-50 disabled:opacity-60 disabled:pointer-events-none transition"
            >
              {busy === 'draft' ? <SpinnerGap size={16} weight="bold" className="animate-spin" /> : <FloppyDisk size={16} weight="regular" />}
              {busy === 'draft' ? 'Menyimpan…' : 'Simpan Draft'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!!busy || rows.length === 0}
              title={rows.length === 0 ? 'Tambahkan baris terlebih dahulu' : undefined}
              className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-[12px] bg-eager border-2 border-eager-dark text-white font-black text-[14px] shadow-sticker hover:brightness-[1.03] active:translate-y-[2px] active:shadow-none disabled:opacity-60 disabled:pointer-events-none disabled:shadow-none transition"
            >
              {busy === 'submit' ? <SpinnerGap size={16} weight="fill" color="white" className="animate-spin" /> : <PaperPlaneTilt size={16} weight="fill" color="white" />}
              {busy === 'submit' ? 'Mengirim…' : 'Kirim untuk Validasi'}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3 flex gap-2 text-[11px] font-medium text-pencil">
        <Info size={14} weight="regular" color="#afafaf" className="shrink-0 mt-0.5" />
        <span>Link bukti wajib diisi dan harus bisa dibuka Admin di tab baru. Draft tersimpan di server dan bisa dilanjutkan.</span>
      </div>
    </div>
    </MotionConfig>
  );
}

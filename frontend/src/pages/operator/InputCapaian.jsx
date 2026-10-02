import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { toast } from 'sonner';
import { PlusCircle, FloppyDisk, PaperPlaneTilt, Buildings, Info, SpinnerGap, CheckCircle, WarningCircle, Stack, Rows, ArrowSquareOut, X } from 'phosphor-react';
import IndikatorTabs from '../../components/operator/IndikatorTabs';
import DraftPanel from '../../components/operator/DraftPanel';
import CapaianRow from '../../components/operator/CapaianRow';
import DeleteDraftModal from '../../components/operator/DeleteDraftModal';
import PeriodeCutoffChip from '../../components/operator/PeriodeCutoffChip';
import { INDIKATORS, emptyRowFor, validateRow, buildPayload } from '../../constants/indikator';
import { apiFetch } from '../../lib/api';
import { useOperator } from '../../context/OperatorContext';
import { collectServerDrafts, groupDraftsByKode } from '../../lib/allDrafts';
import { sharedFlight, getKey } from '../../lib/singleFlight';

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
  const { madrasah, periode: ctxPeriode } = useOperator();
  const madrasahNama = madrasah?.nama || '-';
  const [searchParams, setSearchParams] = useSearchParams();
  const [periodeNama, setPeriodeNama] = useState('—');
  const [indikators, setIndikators] = useState(INDIKATORS);
  const [active, setActive] = useState('diklat');
  const [data, setData] = useState(() => groupByIndikator([], INDIKATORS));
  // busy: 'draft' | 'submit' | null — loading state tombol aksi (anti double-submit)
  const [busy, setBusy] = useState(null);
  const [lastAction, setLastAction] = useState(null); // {type:'success'|'error'|'info', msg} untuk status inline aria-live
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // baris server-draft yang akan dihapus
  const [deleting, setDeleting] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true); // visibilitas panel Draft Tersimpan (toast aksi)
  const [allMode, setAllMode] = useState(false); // mode "Lanjutkan semua draft" — grid tergrup lintas indikator

  // Dedup in-flight: panggilan beruntun (StrictMode double-effect, remount cepat,
  // refresh pasca-simpan) memakai promise yang sama — cegah fetch ganda + render storm
  // yang bisa menelan klik tab/tombol di antara pointerdown dan click.
  const loadDraftsInFlight = useRef(null);

  /** Muat draft periode aktif (backend sudah filter periode; status=draft) → merge ke form. Return daftar draft. */
  async function loadDrafts() {
    if (loadDraftsInFlight.current) return loadDraftsInFlight.current;
    loadDraftsInFlight.current = (async () => {
    try {
      setLoadingDrafts(true);
      const resD = await apiFetch('/api/operator/submission-item?status=draft', { auth: true });
      const arr = Array.isArray(resD) ? resD : (resD?.data || []);
      if (!arr.length) return [];
      setData((prev) => {
        const next = { ...prev };
        arr.forEach((r0) => {
          const kode = r0.indikator?.slug || 'diklat';
          if (!next[kode]) next[kode] = [];
          if (next[kode].some((x) => String(x.id) === String(r0.id))) return;
          next[kode].push({
            id: r0.id,
            indikatorKode: kode,
            indikatorNama: r0.indikator?.nama,
            namaKegiatan: r0.namaKegiatan || '',
            institusi: r0.institusi || '',
            namaPeserta: r0.namaPeserta || '',
            statusPegawai: r0.statusPegawai || '',
            tingkatWilayah: r0.tingkatWilayah || '',
            jenjangPendidikan: r0.jenjangPendidikan || '',
            jumlah: r0.jumlah ?? '',
            pembilang: r0.pembilang ?? '',
            penyebut: r0.penyebut ?? '',
            linkBukti: r0.linkBukti || '',
            catatan: r0.catatan || '',
            updatedAt: r0.updatedAt || null,
            status: 'Draft',
            _error: {},
          });
        });
        Object.keys(next).forEach((k) => { next[k] = next[k].map((r, i) => ({ ...r, _idx: i + 1 })); });
        return next;
      });
      return arr;
    } catch {
      // draft gagal dimuat → halaman tetap bisa dipakai untuk input baru
      return [];
    } finally {
      setLoadingDrafts(false);
      loadDraftsInFlight.current = null;
    }
    })();
    return loadDraftsInFlight.current;
  }

  // Fetch 9 indikator aktif — GET /api/operator/indikator (tanpa periode, pakai aktif terbaru)
  useEffect(() => {
    let ignore = false;
    async function fetchIndikator() {
      try {
        // sharedFlight: satu request dengan OperatorContext/Dashboard yang memuat
        // endpoint sama di halaman ini (dan StrictMode double-effect).
        const res = await sharedFlight.run(getKey('/api/operator/indikator'), () => apiFetch('/api/operator/indikator', { auth: true }));
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
            // ?tab= dari URL (mis. Riwayat › Lanjutkan) — fallback ke tab pertama
            const wanted = searchParams.get('tab');
            const initial = mapped.find((i) => i.kode === wanted) ? wanted : mapped[0].kode;
            setActive((cur) => (mapped.find((i) => i.kode === cur) ? cur : initial));
            // muat draft periode aktif — hanya bila ada periode (draft difilter per periode di backend)
            if (res?.periode?.id && !ignore) loadDrafts();
          }
        }
      } catch {
        // keep skeleton constants — tidak error UI
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

  // Draft server (id numeric) pada tab aktif — untuk strip info & intersep hapus
  const serverDraftRows = rows.filter((r) => typeof r.id === 'number');
  const latestDraftUpdate = useMemo(() => {
    const max = serverDraftRows.reduce((m, r) => {
      const t = r.updatedAt ? new Date(r.updatedAt).getTime() : 0;
      return t > m ? t : m;
    }, 0);
    return max ? new Date(max).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : null;
  }, [serverDraftRows]);

  // Baris lokal baru (id "new-…") yang sudah berisi tapi belum tersimpan ke server — dihitung dari SEMUA tab
  const unsavedCount = useMemo(
    () =>
      Object.values(data)
        .flat()
        .filter((r) => String(r.id).startsWith('new-') && Object.entries(r).some(([k, v]) => !k.startsWith('_') && !['id', 'indikatorKode', 'status'].includes(k) && String(v ?? '').trim() !== ''))
        .length,
    [data]
  );

  // Jumlah draft server per indikator — badge angka di IndikatorTabs + panel tab aktif
  const draftCounts = useMemo(() => {
    const m = {};
    Object.entries(data).forEach(([kode, list]) => {
      const n = list.filter((r) => typeof r.id === 'number').length;
      if (n > 0) m[kode] = n;
    });
    return m;
  }, [data]);

  const openPanel = () => setPanelOpen(true);

  // Mode "Lanjutkan semua draft" — seluruh draft server lintas indikator
  const allDrafts = useMemo(() => collectServerDrafts(data), [data]);
  const allDraftCount = allDrafts.length;

  /** Lanjutkan dari panel: sorot + scroll ke baris draft di grid (baris sudah dimuat via loadDrafts). */
  function focusDraftRow(id) {
    setPanelOpen(true);
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-row-id="${id}"]`);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-spark', 'ring-offset-2');
      setTimeout(() => el.classList.remove('ring-2', 'ring-spark', 'ring-offset-2'), 1800);
    });
  }

  /** Cari grup indikator yang memuat id (mode "semua" mengedit baris di grupnya sendiri). */
  const findRowKode = (id) => Object.keys(data).find((kode) => (data[kode] || []).some((r) => String(r.id) === String(id))) || active;

  const updateRow = (id, field, val) => {
    const kode = findRowKode(id);
    setData((prev) => ({
      ...prev,
      [kode]: (prev[kode] || []).map((r) => (String(r.id) === String(id) ? { ...r, [field]: val, _error: { ...r._error, [field]: undefined } } : r)),
    }));
  };

  const removeRow = (id) => {
    const kode = findRowKode(id);
    setData((prev) => ({
      ...prev,
      [kode]: (prev[kode] || []).filter((r) => String(r.id) !== String(id)).map((r, i) => ({ ...r, _idx: i + 1 })),
    }));
  };

  /** Intersep hapus: baris server-draft → modal konfirmasi + DELETE; baris lokal baru → langsung. Pencarian lintas grup (mode semua). */
  function handleRemoveRequest(id) {
    const row = Object.values(data).flat().find((r) => String(r.id) === String(id));
    if (row && typeof row.id === 'number') {
      setDeleteTarget(row);
      return;
    }
    removeRow(id);
  }

  async function confirmDeleteDraft() {
    if (deleting) return; // guard double-click
    if (!deleteTarget || typeof deleteTarget.id !== 'number') return;
    setDeleting(true);
    try {
      await apiFetch(`/api/operator/submission-item/${deleteTarget.id}`, { method: 'DELETE', auth: true });
      removeRow(deleteTarget.id);
      toast.success('Draf dihapus.');
      setDeleteTarget(null);
    } catch (e) {
      if (e.status === 404) {
        // Draf sudah tidak ada di server (state basi / sudah terhapus) → tetap bersihkan dari daftar
        removeRow(deleteTarget.id);
        toast.info('Draf sudah tidak ada di server — dihapus dari daftar.');
        setDeleteTarget(null);
      } else {
        throw e; // ditangkap modal → tampilkan error
      }
    } finally {
      setDeleting(false);
    }
  }

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
    if (allMode) return; // tombol disembunyikan di mode semua — guard tambahan
    if (!validateRows()) {
      toast.error('Perbaiki field wajib terlebih dahulu.');
      return;
    }
    setBusy('draft');
    setLastAction(null);
    // Snapshot status baris sebelum optimistic — untuk revert saat gagal simpan
    const prevRows = rows;
    try {
      // optimistic local
      setData((prev) => ({ ...prev, [active]: prev[active].map((r) => ({ ...r, status: 'Draft' })) }));
      if (activeIndikatorId) {
        // PERTAHANKAN id server → saveItems melakukan UPDATE, bukan membuat duplikat
        const items = rows.filter(rowHasContent).map((r) => ({ ...(typeof r.id === 'number' ? { id: r.id } : {}), ...buildPayload(active, r) }));
        if (items.length === 0) {
          setLastAction({ type: 'info', msg: 'Tidak ada baris berisi untuk disimpan.' });
          toast.info('Tidak ada baris berisi untuk disimpan.');
        } else {
          await apiFetch(`/api/operator/indikator/${activeIndikatorId}/draft`, { method: 'POST', body: { items }, auth: true });
          const msg = `Draft tersimpan untuk ${activeInd?.nama} — ${items.length} baris.`;
          setLastAction({ type: 'success', msg });
          // Toast dengan angka + aksi "Lihat Draft" (API action: Sonner docs via Context7)
          toast.success(msg, {
            description: 'Draft tersimpan di server dan bisa dilanjutkan kapan saja.',
            action: { label: 'Lihat Draft', onClick: openPanel },
            duration: 6000,
          });
          setPanelOpen(true);
          // Refresh draft server agar panel menampilkan angka & daftar terbaru
          loadDrafts();
          // UX: grid popout — kembali ke empty state setelah sukses (draft lanjut via Riwayat › Lanjutkan)
          setData((prev) => ({ ...prev, [active]: [] }));
        }
      } else {
        const msg = `Draft disimpan lokal untuk ${activeInd?.nama} — ${rows.length} baris (indikator belum aktif).`;
        setLastAction({ type: 'success', msg });
        toast.success(msg);
        setPanelOpen(true);
        setData((prev) => ({ ...prev, [active]: [] }));
      }
    } catch (e) {
      const msg = e.message || 'Gagal simpan draft. Data lokal tetap tersimpan.';
      setLastAction({ type: 'error', msg });
      toast.error(msg);
      // Revert optimistic — status kembali seperti sebelum klik agar UI jujur (seperti submit cutoff)
      setData((prev) => ({
        ...prev,
        [active]: prev[active].map((r) => {
          const before = prevRows.find((p) => p.id === r.id);
          return before ? { ...r, status: before.status } : r;
        }),
      }));
    } finally {
      setBusy(null);
    }
  };

  const handleSubmit = async () => {
    if (allMode) return; // tombol disembunyikan di mode semua — guard tambahan
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
          <span className="hidden sm:inline-flex items-center h-7 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-bold text-pencil whitespace-nowrap"><span className="font-black text-charcoal">Periode</span> {ctxPeriode?.namaPeriode || periodeNama}</span>
          <PeriodeCutoffChip periode={ctxPeriode} />
          <span className="inline-flex items-center h-7 px-3 rounded-full bg-story border-2 border-[#b8eb8a] text-[11px] font-black text-eager-dark whitespace-nowrap">{INDIKATORS.length} indikator</span>
        </div>
      </div>

      <IndikatorTabs
        activeKode={active}
        onChange={(kode) => {
          setAllMode(false);
          setActive(kode);
          setSearchParams((sp) => { sp.set('tab', kode); return sp; }, { replace: true });
        }}
        counts={counts}
        indikatorList={indikators}
        draftCounts={draftCounts}
      />

      {/* Lanjutkan semua draft — buka seluruh draft lintas indikator sekaligus.
          Seleksi di onPointerDown: kebal badai re-render yang bisa menelan click. */}
      {allDraftCount > 0 && !allMode && (
        <button
          onPointerDown={(e) => { if (e.pointerType !== 'keyboard') { setAllMode(true); setPanelOpen(false); } }}
          onClick={(e) => { if (e.detail === 0) { setAllMode(true); setPanelOpen(false); } }}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-full border-2 border-[#cde9ff] bg-[#f0f9ff] text-[#0b5cab] font-black text-[13px] shadow-card hover:brightness-[0.98] transition"
        >
          <Rows size={16} weight="bold" />
          Lanjutkan semua draft
          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-spark text-white flex items-center justify-center text-[10px] font-black">{allDraftCount}</span>
        </button>
      )}

      {/* Banner mode "Semua Draft" */}
      {allMode && (
        <div className="rounded-[16px] border-2 border-[#cde9ff] bg-[#f0f9ff] p-4 flex flex-wrap items-center gap-3">
          <span className="w-9 h-9 rounded-[12px] bg-[#0b5cab] flex items-center justify-center shrink-0 text-white font-black"><Rows size={16} weight="fill" /></span>
          <div className="min-w-0">
            <div className="font-display font-black text-[15px] text-charcoal leading-tight">Semua Draft — {allDraftCount} baris dari {groupDraftsByKode(allDrafts).size} indikator</div>
            <p className="text-[12px] font-medium text-pencil mt-0.5">Mode baca-edit lintas indikator. Simpan/Kirim dilakukan per indikator lewat tab-nya.</p>
          </div>
          <button
            onClick={() => setAllMode(false)}
            className="ml-auto inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white border-2 border-zinc-200 text-charcoal font-black text-[12px] hover:border-charcoal"
          >
            <X size={14} weight="bold" /> Tutup
          </button>
        </div>
      )}

      {/* Panel Draft Tersimpan — jawaban visual "berapa draft saya & bagaimana melanjutkannya" (disembunyikan di mode semua) */}
      {!allMode && (
        <DraftPanel
          drafts={serverDraftRows}
          unsavedCount={unsavedCount}
          loading={loadingDrafts}
          open={panelOpen}
          onToggle={setPanelOpen}
          onContinue={focusDraftRow}
          onDelete={(row) => setDeleteTarget(row)}
        />
      )}

      <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-4 flex items-start gap-3 shadow-card">
        <div className="w-9 h-9 rounded-[12px] bg-eager border-2 border-eager-dark shadow-sticker flex items-center justify-center shrink-0 text-white font-black text-[12px]">0{indikators.findIndex((i) => i.kode === active) + 1}</div>
        <div>
          <div className="font-display font-black text-[15px] text-charcoal leading-tight">{activeInd?.nama}</div>
          <div className="text-[11px] font-mono font-bold text-faded">{activeInd?.kode}</div>
          <p className="text-[12px] font-medium text-pencil mt-1">Tambah baris tanpa batas. Link bukti wajib akses publik &amp; wajib bukti tahun berjalan. Draft tidak masuk skor.</p>
        </div>
        <span className="ml-auto hidden sm:inline-flex h-7 px-3 rounded-full bg-zinc-50 border-2 border-zinc-100 text-[11px] font-black text-pencil">{rows.length} baris</span>
      </div>

      {/* MODE SEMUA DRAFT — grid tergrup per indikator, hanya baris draft server */}
      {allMode ? (
        allDraftCount === 0 ? (
          <div className="rounded-[16px] border-2 border-dashed border-zinc-300 bg-white/60 p-10 text-center">
            <div className="text-[15px] font-display font-black text-charcoal">Tidak ada draft tersimpan</div>
            <p className="text-[13px] font-medium text-pencil mt-1">Semua draft sudah dikirim atau dihapus.</p>
            <button onClick={() => setAllMode(false)} className="mt-4 inline-flex items-center gap-1.5 h-10 px-5 rounded-[12px] bg-white border-2 border-zinc-200 text-charcoal font-black text-[13px] hover:border-charcoal">
              <ArrowSquareOut size={15} weight="bold" /> Kembali ke input
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {[...groupDraftsByKode(allDrafts).entries()].map(([kode, list]) => {
              const ind = indikators.find((i) => i.kode === kode);
              return (
                <div key={kode}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-[10px] bg-eager border-2 border-eager-dark text-white text-[11px] font-black">0{indikators.findIndex((i) => i.kode === kode) + 1}</span>
                    <span className="font-display font-black text-[14px] text-charcoal">{ind?.nama || kode}</span>
                    <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-zinc-50 border-2 border-zinc-100 text-[11px] font-black text-pencil">{list.length} draft</span>
                    <button
                      onClick={() => {
                        setAllMode(false);
                        setActive(kode);
                        setSearchParams((sp) => { sp.set('tab', kode); return sp; }, { replace: true });
                      }}
                      className="ml-auto inline-flex items-center gap-1 h-8 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black text-charcoal hover:border-charcoal"
                    >
                      Buka tab <ArrowSquareOut size={12} weight="bold" />
                    </button>
                  </div>
                  {list.length > 0 && (
                    <div className="mb-3 rounded-[12px] bg-[#f0f9ff] border-2 border-[#cde9ff] px-4 py-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-bold text-charcoal">
                      <Info size={14} weight="fill" color="#0b5cab" />
                      <span>Draf tersimpan • {list.length} baris</span>
                      <span className="ml-auto text-[11px] font-medium text-pencil hidden sm:inline">Edit di sini atau buka tab untuk Simpan/Kirim</span>
                    </div>
                  )}
                  <div className="grid gap-4">
                    {list.map((r) => (
                      <div key={r.id} data-row-id={r.id} className="rounded-[16px] scroll-mt-24 transition-shadow">
                        <CapaianRow row={r} indikatorKode={kode} onChange={updateRow} onRemove={handleRemoveRequest} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
      /* Grid baris ↔ Empty state — AnimatePresence popout (Context7 /grx7/framer-motion) */
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
            {loadingDrafts ? (
              <div className="inline-flex items-center gap-2 text-[13px] font-bold text-pencil">
                <SpinnerGap size={16} weight="bold" className="animate-spin" /> Memuat draft tersimpan…
              </div>
            ) : (
              <>
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
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key={`grid-${active}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12, scale: 0.985 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
          {/* Strip info draf — visibilitas bahwa baris di bawah adalah draf tersimpan (disembunyikan di mode semua) */}
            {serverDraftRows.length > 0 && !allMode && (
              <div className="mb-4 rounded-[12px] bg-[#f0f9ff] border-2 border-[#cde9ff] px-4 py-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-bold text-charcoal">
                <Info size={14} weight="fill" color="#0b5cab" />
                <span>Draf tersimpan • {serverDraftRows.length} baris</span>
                {latestDraftUpdate && <span className="font-medium text-pencil">• terakhir diubah {latestDraftUpdate}</span>}
                <span className="ml-auto text-[11px] font-medium text-pencil hidden sm:inline">Lanjutkan mengedit lalu Simpan/Kirim</span>
              </div>
            )}

            <div className="grid gap-4">
              {rows.map((r) => (
                <div key={r.id} data-row-id={r.id} className="rounded-[16px] scroll-mt-24 transition-shadow">
                  <CapaianRow row={r} indikatorKode={active} onChange={updateRow} onRemove={handleRemoveRequest} />
                </div>
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
      )}

      {/* Modal konfirmasi hapus draft (hard delete + audit trail) */}
      {deleteTarget && (
        <DeleteDraftModal
          draft={deleteTarget}
          busy={deleting}
          onConfirm={confirmDeleteDraft}
          onClose={() => setDeleteTarget(null)}
        />
      )}

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
            ) : allMode ? (
              <span className="text-[11px] font-medium text-faded">Mode Semua Draft — Simpan/Kirim dilakukan per indikator lewat tab-nya.</span>
            ) : rows.length === 0 ? (
              <span className="text-[11px] font-medium text-faded">Tambahkan baris terlebih dahulu untuk menyimpan atau mengirim.</span>
            ) : (
              <span className="text-[11px] font-medium text-faded">Draft tidak masuk skor. Kirim untuk masuk antrian validasi Admin.</span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {!allMode && (
              <button
                onClick={handleDraft}
                disabled={!!busy || rows.length === 0}
                title={rows.length === 0 ? 'Tambahkan baris terlebih dahulu' : undefined}
                className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-[12px] bg-white border-2 border-zinc-200 text-charcoal font-black text-[14px] hover:border-charcoal hover:bg-zinc-50 disabled:opacity-60 disabled:pointer-events-none transition"
              >
                {busy === 'draft' ? <SpinnerGap size={16} weight="bold" className="animate-spin" /> : <FloppyDisk size={16} weight="regular" />}
                {busy === 'draft' ? 'Menyimpan…' : 'Simpan Draft'}
              </button>
            )}
            {!allMode && (
              <button
                onClick={handleSubmit}
                disabled={!!busy || rows.length === 0}
                title={rows.length === 0 ? 'Tambahkan baris terlebih dahulu' : undefined}
                className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-[12px] bg-eager border-2 border-eager-dark text-white font-black text-[14px] shadow-sticker hover:brightness-[1.03] active:translate-y-[2px] active:shadow-none disabled:opacity-60 disabled:pointer-events-none disabled:shadow-none transition"
              >
                {busy === 'submit' ? <SpinnerGap size={16} weight="fill" color="white" className="animate-spin" /> : <PaperPlaneTilt size={16} weight="fill" color="white" />}
                {busy === 'submit' ? 'Mengirim…' : 'Kirim untuk Validasi'}
              </button>
            )}
            {allMode && (
              <button
                onClick={() => setAllMode(false)}
                className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-[12px] bg-white border-2 border-zinc-200 text-charcoal font-black text-[14px] hover:border-charcoal transition"
              >
                <ArrowSquareOut size={16} weight="bold" /> Tutup mode Semua Draft — kembali ke tab aktif
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3 flex gap-2 text-[11px] font-medium text-pencil">
        <Info size={14} weight="regular" color="#afafaf" className="shrink-0 mt-0.5" />
        <span>Link bukti wajib diisi, wajib bukti tahun berjalan, dan harus bisa dibuka Admin di tab baru. Draft tersimpan di server dan bisa dilanjutkan.</span>
      </div>
    </div>
    </MotionConfig>
  );
}

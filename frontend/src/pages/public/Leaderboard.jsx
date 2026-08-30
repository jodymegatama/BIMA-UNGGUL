import { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Trophy, Clock, Info, ShareNetwork, Buildings, CheckCircle, WarningCircle, ArrowsClockwise } from 'phosphor-react';
import FilterBar from '../../components/public/leaderboard/FilterBar';
import PodiumTop3 from '../../components/public/PodiumTop3';
import LeaderboardChart from '../../components/public/leaderboard/LeaderboardChart';
import LeaderboardTable from '../../components/public/leaderboard/LeaderboardTable';
import useRevealOnScroll from '../../hooks/useRevealOnScroll';
import { apiGet } from '../../lib/api';

// kelompoks eksplisit untuk fallback auto-latest
const KELOMPOK_FALLBACK = 'MI Negeri';

function mapRankingToUi(entry) {
  return {
    rank: entry.ranking,
    nama: entry.madrasah?.namaMadrasah ?? '-',
    slug: entry.madrasah?.slug ?? '',
    skor: typeof entry.totalScore === 'number' ? entry.totalScore : Number(entry.totalScore) || 0,
    approved: entry.submissionCount ?? 0,
    bmuId: entry.madrasah?.nomorMadrasah ?? '-',
    jenjang: entry.madrasah?.jenjang ?? '',
    status: entry.madrasah?.statusKepemilikan ?? '',
    kelompok: entry.madrasah?.kelompok ?? '',
    // hanya dari lastApprovedAt — fallback madrasah.updatedAt menyesatkan saat belum ada validasi
    updatedAt: entry.lastApprovedAt || null,
  };
}

/** Fallback derive status periode di sisi klien (utama: statusEfektif dari backend). */
function deriveStatusClient(p) {
  if (!p) return null;
  const now = Date.now();
  if (p.tanggalMulai && now < new Date(p.tanggalMulai).getTime()) return 'belum_dimulai';
  if (p.tanggalCutoff && now > new Date(p.tanggalCutoff).getTime()) return 'cutoff';
  return 'aktif';
}

function SkeletonCard() {
  return (
    <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-5 lg:p-6 shadow-card animate-pulse">
      <div className="h-5 w-32 bg-zinc-100 rounded-full" />
      <div className="mt-6 flex gap-3 justify-center">
        <div className="w-[140px] h-[140px] bg-zinc-100 rounded-[16px]" />
        <div className="w-[160px] h-[170px] bg-zinc-100 rounded-[16px]" />
        <div className="w-[140px] h-[130px] bg-zinc-100 rounded-[16px]" />
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const [params, setParams] = useSearchParams();
  const periode = params.get('periode') || '';
  const kelompok = params.get('kelompok') || KELOMPOK_FALLBACK;
  const ref = useRef(null);
  useRevealOnScroll(ref);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodeInfo, setPeriodeInfo] = useState(null);
  const [lastRecalc, setLastRecalc] = useState(null);
  const [periodes, setPeriodes] = useState([]);
  const [madrasahCount, setMadrasahCount] = useState(null);
  const [periodesLoaded, setPeriodesLoaded] = useState(false);

  // daftar periode untuk FilterBar — dinamis dari API (BUG-03)
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const json = await apiGet('/api/periode');
        if (ignore) return;
        const list = Array.isArray(json.data) ? json.data : [];
        setPeriodes(list);
        // default periode: dari URL, kalau kosong pakai yang statusEfektif aktif
        if (!params.get('periode')) {
          const aktif = list.find((p) => p.statusEfektif === 'aktif') || list[0];
          if (aktif) setParams((prev) => ({ ...prev, periode: aktif.namaPeriode }), { replace: true });
        }
      } catch { /* biarkan kosong — fetch leaderboard tetap jalan tanpa periodeId */ }
      finally { if (!ignore) setPeriodesLoaded(true); }
    })();
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // map nama periode (URL/pill) → periodeId utk query backend (BUG-03 wiring)
  const periodeId = useMemo(() => {
    const found = periodes.find((p) => p.namaPeriode === periode);
    return found ? String(found.id) : undefined;
  }, [periodes, periode]);

  useEffect(() => {
    if (!periodesLoaded) return; // tunggu periodes dulu — hindari fetch dobel (periode kosong + resolved)
    let ignore = false;
    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);
      try {
        // Backend resolve auto-latest aktif bila periodeId tidak dikirim.
        const q = new URLSearchParams();
        q.set('kelompok', kelompok);
        if (periodeId) q.set('periodeId', periodeId);
        const json = await apiGet(`/api/leaderboard?${q.toString()}`);
        if (ignore) return;
        const periodeResp = json.periode || null;
        setPeriodeInfo(periodeResp);
        if (typeof json.madrasahCount === 'number') setMadrasahCount(json.madrasahCount);
        // normalize rankings: backend bisa return { rankings: [...] } atau { rankings: { "MI Negeri": [...] } }
        let raw = json.rankings;
        let arr = [];
        if (Array.isArray(raw)) arr = raw;
        else if (raw && typeof raw === 'object') arr = raw[kelompok] || Object.values(raw).flat();
        const mapped = Array.isArray(arr) ? arr.map(mapRankingToUi) : [];
        setData(mapped);
        // lastRecalc hanya dari validasi riil (lastApprovedAt) — jangan now() saat belum ada data
        const maxTs = mapped.reduce((max, r) => {
          const t = r.updatedAt ? new Date(r.updatedAt).getTime() : 0;
          return t > max ? t : max;
        }, 0);
        setLastRecalc(maxTs ? new Date(maxTs) : null);
      } catch (e) {
        if (ignore) return;
        setError(e);
        setData([]);
        setLastRecalc(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchLeaderboard();
    return () => { ignore = true; };
  }, [kelompok, periodeId, periodesLoaded]);

  const top3 = data.slice(0, 3);
  const hasApprovedData = data.some((r) => r.approved > 0);
  const timestamp = useMemo(() => {
    if (!hasApprovedData && !lastRecalc) return null; // belum ada pembaruan riil
    const d = lastRecalc || new Date();
    return d.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Jakarta' });
  }, [lastRecalc, hasApprovedData]);

  // ---- State konteks-aware ----
  const isEmpty = !loading && !error && data.length === 0;
  // 404 NO_PERIODE → pesan ramah, bukan error amber
  const noPeriode = !loading && !!error && error?.data?.code === 'NO_PERIODE';
  // status periode efektif: prioritas dari backend (deriveStatus), fallback derive klien
  const statusEfektif = periodeInfo?.statusEfektif || deriveStatusClient(periodeInfo);
  const notStarted = !loading && !error && statusEfektif === 'belum_dimulai';
  // periode berjalan tapi semua entri skor 0 / tanpa capaian disetujui
  const allZero = !loading && !error && data.length > 0 && !hasApprovedData;

  const setPeriode = (p) => {
    const n = new URLSearchParams(params);
    n.set('periode', p);
    setParams(n, { replace: true });
  };
  const setKelompok = (k) => {
    const n = new URLSearchParams(params);
    n.set('kelompok', k);
    setParams(n, { replace: true });
  };

  return (
    <div ref={ref} className="relative">
      {/* dot-pattern kini dari layer global App.jsx — duplikat inline dihapus */}

      {/* Header */}
      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 pt-8 lg:pt-10">
        <div className="flex flex-wrap items-start justify-between gap-4 reveal">
          <div>
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-story border-2 border-[#b8eb8a] text-[11px] font-black text-eager-dark">
                <Trophy size={12} weight="fill" color="#4caf00" /> Leaderboard Publik
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-bold text-pencil">
                <Buildings size={12} weight="regular" /> {madrasahCount ?? '—'} madrasah • 6 kelompok
              </span>
            </div>
            <h1 className="font-display font-black tracking-[-0.02em] text-[30px] lg:text-[40px] leading-none text-charcoal mt-3">
              Peringkat mutu madrasah
            </h1>
            <p className="text-[14px] leading-6 text-pencil font-medium mt-2 max-w-[60ch]">
              Transparan, berbasis bukti tervalidasi. Skor = Σ capaian disetujui × bobot. Peringkat dihitung per kelompok.
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2">
            <div className="inline-flex items-center gap-2 h-8 px-3 rounded-full bg-white border-2 border-zinc-200 shadow-sm text-[12px] font-bold">
              <span className="w-2 h-2 rounded-full bg-eager animate-pulse" style={{ animation: 'pulse-live 1.6s ease infinite' }} />
              <span className="text-charcoal font-black">{periodeInfo?.namaPeriode || periode}</span>
              <span className="w-px h-4 bg-zinc-200" />
              <span className="text-pencil">{kelompok}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-faded bg-zinc-50 border border-zinc-200 rounded-full px-3 py-1.5">
              <Clock size={12} weight="regular" /> {timestamp ? `Diperbarui pada: ${timestamp} WIB` : 'Belum ada pembaruan skor'}
            </div>
          </div>
        </div>

        {/* FilterBar */}
        <div className="mt-6 reveal" style={{ transitionDelay: '0.06s' }}>
          <FilterBar periode={periode} kelompok={kelompok} onPeriode={setPeriode} onKelompok={setKelompok} periodes={periodes} />
        </div>

        {/* Loading / Error / Empty / Content */}
        {loading && (
          <div className="mt-8 grid lg:grid-cols-[1.05fr_0.95fr] gap-5 lg:gap-6 items-start">
            <SkeletonCard />
            <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-5 h-[280px] animate-pulse">
              <div className="h-5 w-40 bg-zinc-100 rounded-full mb-6" />
              <div className="space-y-3">
                <div className="h-6 bg-zinc-100 rounded-full" />
                <div className="h-6 bg-zinc-100 rounded-full w-5/6" />
                <div className="h-6 bg-zinc-100 rounded-full w-4/6" />
              </div>
            </div>
          </div>
        )}

        {/* NO_PERIODE — pesan ramah, bukan error amber */}
        {noPeriode && (
          <div className="mt-8 rounded-[16px] border-2 border-zinc-200 bg-white p-10 text-center reveal">
            <div className="w-12 h-12 rounded-full bg-zinc-50 border-2 border-zinc-200 mx-auto flex items-center justify-center">
              <Trophy size={20} weight="regular" color="#afafaf" />
            </div>
            <div className="text-[14px] font-black text-charcoal mt-3">Periode pemeringkatan belum dimulai</div>
            <div className="text-[13px] font-medium text-pencil mt-1 max-w-[52ch] mx-auto">
              Belum ada periode penilaian aktif. Pemeringkat akan muncul otomatis setelah Admin Seksi Pendma membuka periode penilaian.
            </div>
          </div>
        )}

        {/* error generik (bukan NO_PERIODE) */}
        {error && !loading && !noPeriode && (
          <div className="mt-8 rounded-[16px] border-2 border-amber-200 bg-amber-50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 reveal">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-white border-2 border-amber-200 flex items-center justify-center">
                <WarningCircle size={18} weight="fill" color="#d97706" />
              </span>
              <div>
                <div className="text-[13px] font-black text-charcoal">Gagal memuat leaderboard</div>
                <div className="text-[12px] font-medium text-pencil">{error.message || 'Terjadi kesalahan jaringan.'}</div>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-charcoal text-white text-[13px] font-black hover:brightness-110 shrink-0"
            >
              <ArrowsClockwise size={14} weight="bold" /> Coba lagi
            </button>
          </div>
        )}

        {isEmpty && (
          <div className="mt-8 rounded-[16px] border-2 border-zinc-200 bg-white p-10 text-center reveal">
            <div className="w-12 h-12 rounded-full bg-zinc-50 border-2 border-zinc-200 mx-auto flex items-center justify-center">
              <Trophy size={20} weight="regular" color="#afafaf" />
            </div>
            <div className="text-[14px] font-black text-charcoal mt-3">Belum ada data skor untuk kelompok ini</div>
            <div className="text-[13px] font-medium text-pencil mt-1">Periode {periodeInfo?.namaPeriode || periode} • Kelompok {kelompok} belum memiliki capaian disetujui.</div>
          </div>
        )}

        {/* Banner konteks — tampil DI ATAS konten, daftar tetap tampil demi transparansi (PRD US8) */}
        {!loading && !error && !isEmpty && notStarted && (
          <div className="mt-8 rounded-[16px] border-2 border-[#cde9ff] bg-[#e0f2ff] p-4 flex items-start gap-3 reveal">
            <span className="w-9 h-9 rounded-full bg-white border-2 border-[#cde9ff] flex items-center justify-center shrink-0">
              <Clock size={16} weight="regular" color="#0b5cab" />
            </span>
            <div>
              <div className="text-[13px] font-black text-charcoal">Periode pemeringkatan belum dimulai</div>
              <div className="text-[12px] font-medium text-pencil mt-0.5">
                Periode {periodeInfo?.namaPeriode || periode} dimulai{' '}
                {periodeInfo?.tanggalMulai ? new Date(periodeInfo.tanggalMulai).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-'} —
                daftar di bawah masih pra-pemeringkatan dan skor baru terisi setelah validasi Admin.
              </div>
            </div>
          </div>
        )}
        {!loading && !error && !isEmpty && allZero && (
          <div className={`mt-8 rounded-[16px] border-2 border-amber-200 bg-amber-50 p-4 flex items-start gap-3 reveal ${notStarted ? '' : ''}`}>
            <span className="w-9 h-9 rounded-full bg-white border-2 border-amber-200 flex items-center justify-center shrink-0">
              <Info size={16} weight="regular" color="#d97706" />
            </span>
            <div>
              <div className="text-[13px] font-black text-charcoal">Belum ada capaian yang disetujui Admin untuk kelompok ini</div>
              <div className="text-[12px] font-medium text-pencil mt-0.5">
                Daftar madrasah di bawah menampilkan skor sementara 0 — peringkat akan terbentuk otomatis setelah ada submission yang divalidasi.
              </div>
            </div>
          </div>
        )}

        {!loading && !error && !isEmpty && (
          <>
            {/* Podium + Chart grid */}
            <div className="mt-8 grid lg:grid-cols-[1.05fr_0.95fr] gap-5 lg:gap-6 items-start">
              <div className="reveal" style={{ transitionDelay: '0.1s' }}>
                <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-5 lg:p-6 shadow-card">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display font-black text-[16px] text-charcoal flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-eager border-2 border-eager-dark shadow-sticker flex items-center justify-center text-white">
                        <Trophy size={14} weight="fill" color="white" />
                      </span>
                      Podium Top 3
                    </h2>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-faded">
                      <Info size={12} weight="regular" /> Tinggi podium = peringkat
                    </span>
                  </div>
                  <div className="mt-6">
                    <PodiumTop3 data={top3} />
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-bold text-pencil">
                    <CheckCircle size={12} weight="fill" color="#58cc02" /> Klik nama untuk profil madrasah
                  </div>
                </div>
              </div>

              <div className="reveal" style={{ transitionDelay: '0.14s' }}>
                <LeaderboardChart data={data} />
              </div>
            </div>

            {/* Table */}
            <div className="mt-6 reveal" style={{ transitionDelay: '0.18s' }}>
              <LeaderboardTable data={data} />
            </div>
          </>
        )}

        {/* footer info */}
        <div className="mt-8 mb-10 rounded-[16px] border-2 border-zinc-200 bg-zinc-50 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 reveal">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center">
              <Info size={16} weight="regular" color="#777777" />
            </span>
            <div>
              <div className="text-[13px] font-black text-charcoal">Butuh bantuan?</div>
              <div className="text-[12px] font-medium text-pencil">Filter tersimpan di URL — bisa di-share/bookmark. Data real-time dari API.</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-white border-2 border-zinc-200 text-[13px] font-black text-charcoal hover:border-charcoal">
              Kembali ke Beranda
            </Link>
            <button
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-charcoal text-white text-[13px] font-black hover:brightness-110"
            >
              <ShareNetwork size={14} weight="regular" /> Salin link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

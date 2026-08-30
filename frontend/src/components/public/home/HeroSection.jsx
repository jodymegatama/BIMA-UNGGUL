import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../../../lib/api';
import {
  Trophy,
  ArrowRight,
  PlayCircle,
  ShieldCheck,
  Eye,
  DotsThree,
  Medal,
  User,
  Star,
  Crown,
  ChartBar,
  Clock,
  Buildings,
  CheckCircle,
} from 'phosphor-react';
import useMagnetic from '../../../hooks/useMagnetic';

/**
 * HeroSection — persis dari _backup/index.html #beranda
 * - background blobs (hero-blob + drift); dot global dari layer App.jsx
 * - chip Periode LIVE, heading 3 baris + trophyBounce, paragraph, magnet CTAs, mini stats 3col
 * - right visualization: floating pills (floatA/floatB), heroCard parallax (perspective 900 rotate), skeleton podium + chart barGrow + bottom mini row, decorative rings, trusted strip (reveal)
 * JANGAN tambahkan/duplikasi dot-pattern global — itu sudah di PublicLayout
 */
export default function HeroSection() {
  const ctaPrimaryRef = useMagnetic(true);
  const ctaSecondaryRef = useMagnetic(true);
  const cardRef = useRef(null);
  const heroVisualRef = useRef(null);
  const [stats, setStats] = useState(null);

  // statistik nyata (BUG-01): madrasah aktif dari GET /api/stats
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const json = await apiGet('/api/stats');
        if (!ignore && typeof json.madrasahCount === 'number') setStats(json);
      } catch { /* biarkan null — fallback '—' */ }
    })();
    return () => { ignore = true; };
  }, []);

  // Parallax hero card — persis script: mousemove on parent -> perspective(900) rotateY(cx*4) rotateX(-cy*4)
  useEffect(() => {
    const card = cardRef.current;
    const hero = heroVisualRef.current;
    if (!card || !hero) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = window.matchMedia('(hover:hover)').matches;
    if (prefersReduced || !canHover) return;

    const onMove = (e) => {
      const r = hero.getBoundingClientRect();
      const cx = (e.clientX - r.left - r.width / 2) / r.width;
      const cy = (e.clientY - r.top - r.height / 2) / r.height;
      card.style.transform = `perspective(900px) rotateY(${cx * 4}deg) rotateX(${-cy * 4}deg) translateZ(0)`;
      card.style.transition = 'transform 0.12s linear';
    };
    const onLeave = () => {
      card.style.transform = 'perspective(900px) rotateY(0) rotateX(0)';
      card.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
    };
    hero.addEventListener('mousemove', onMove);
    hero.addEventListener('mouseleave', onLeave);
    return () => {
      hero.removeEventListener('mousemove', onMove);
      hero.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <section id="beranda" className="relative overflow-hidden bg-transparent scroll-mt-[76px]">
      {/* background blobs — dot global kini di App.jsx (fixed), tidak perlu duplikat di hero */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div
          className="hero-blob absolute -top-24 -right-32 w-[520px] h-[520px] bg-story rounded-full"
          style={{ animation: 'drift 12s ease-in-out infinite' }}
        />
        <div
          className="hero-blob absolute top-32 -left-24 w-[420px] h-[420px] bg-[#e0f2ff] rounded-full"
          style={{ animation: 'drift 14s ease-in-out infinite reverse' }}
        />
      </div>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 pt-6 lg:pt-10 pb-8 lg:pb-10">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-6 items-center min-h-[calc(100dvh-88px)] lg:min-h-[640px]">
          {/* LEFT COPY */}
          <div className="relative order-1 lg:pr-2">
            {/* chip */}
            <div className="reveal inline-flex items-center gap-2 h-8 px-3 pr-1 rounded-full bg-white border-2 border-zinc-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-eager animate-pulse" style={{ animation: 'pulse-live 1.6s ease infinite' }} />
              <span className="text-[13px] font-extrabold text-charcoal">Periode 2026/2027</span>
              <span className="w-px h-4 bg-zinc-200" />
              <span className="text-[12px] font-bold text-pencil hidden sm:inline">Seksi Pendma Kankemenag Pasuruan</span>
              <span className="text-[12px] font-bold text-pencil sm:hidden">Kankemenag Pasuruan</span>
              <span className="ml-1 inline-flex items-center justify-center h-6 px-2.5 rounded-full bg-ink text-white text-[11px] font-black">LIVE</span>
            </div>

            {/* heading */}
            <h1 className="font-display font-black tracking-[-0.03em] leading-[0.92] mt-5 max-w-[640px]">
              <span className="block text-[38px] sm:text-[46px] lg:text-[56px] text-charcoal reveal" style={{ transitionDelay: '0.08s' }}>
                Mutu madrasah
              </span>
              <span
                className="block text-[38px] sm:text-[46px] lg:text-[56px] reveal flex items-center gap-3 flex-wrap"
                style={{ transitionDelay: '0.14s' }}
              >
                <span className="text-eager relative inline-flex items-center gap-2">
                  terukur
                  <span
                    className="inline-flex items-center justify-center w-9 h-9 lg:w-11 lg:h-11 rounded-[12px] bg-eager border-2 border-eager-dark shadow-sticker rotate-3 shrink-0"
                    style={{ animation: 'trophyBounce 2.8s ease-in-out infinite' }}
                  >
                    <Trophy weight="fill" size={20} color="white" className="lg:hidden" />
                    <span className="hidden lg:inline-flex">
                      <Trophy weight="fill" size={20} color="white" />
                    </span>
                  </span>
                </span>
                <span className="text-charcoal">dan</span>
              </span>
              <span className="block text-[38px] sm:text-[46px] lg:text-[56px] text-charcoal reveal" style={{ transitionDelay: '0.20s' }}>
                transparan.
              </span>
            </h1>

            <p className="reveal mt-4 text-[16px] lg:text-[17px] leading-[1.5] text-pencil max-w-[52ch] font-medium" style={{ transitionDelay: '0.26s' }}>
              Input capaian, validasi berjenjang, dan pemeringkatan real time untuk 6 kelompok madrasah di Kabupaten Pasuruan. Skor dari bukti, bukan
              asumsi.
            </p>

            {/* CTAs — magnet */}
            <div className="reveal flex flex-wrap items-center gap-3 mt-7" style={{ transitionDelay: '0.32s' }}>
              <Link
                ref={ctaPrimaryRef}
                to="/leaderboard"
                id="ctaPrimary"
                className="magnet inline-flex items-center justify-center h-[52px] px-7 rounded-[12px] bg-eager border-[2px] border-eager-dark text-white font-black text-[15px] shadow-sticker hover:brightness-[1.04] active:translate-y-[2px] active:shadow-none transition-all gap-2"
              >
                Lihat Peringkat
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <ArrowRight weight="bold" size={14} color="white" />
                </span>
              </Link>
              <a
                ref={ctaSecondaryRef}
                href="#metode"
                className="magnet inline-flex items-center justify-center h-[52px] px-7 rounded-[12px] bg-white border-2 border-faded text-spark font-black text-[15px] hover:border-spark hover:bg-[#f0f9ff] active:translate-y-[1px] transition-all gap-2"
              >
                <PlayCircle size={18} weight="regular" />
                Cara Kerja
              </a>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-bold text-faded ml-1">
                <ShieldCheck size={16} weight="regular" color="#58cc02" />
                Data tervalidasi admin
              </span>
            </div>

            {/* mini stats */}
            <div className="reveal grid grid-cols-3 gap-3 mt-8 max-w-[520px]" style={{ transitionDelay: '0.38s' }}>
              <div className="rounded-[12px] border-2 border-zinc-200 bg-white p-3">
                <div className="text-[11px] font-black tracking-wide text-faded uppercase">Kelompok</div>
                <div className="font-display font-black text-[22px] leading-none text-charcoal mt-1">6</div>
                <div className="text-[12px] font-bold text-pencil leading-tight mt-0.5">MI / MTs / MA x Negeri Swasta</div>
              </div>
              <div className="rounded-[12px] border-2 border-zinc-200 bg-white p-3">
                <div className="text-[11px] font-black tracking-wide text-faded uppercase">Indikator</div>
                <div className="font-display font-black text-[22px] leading-none text-charcoal mt-1">9</div>
                <div className="text-[12px] font-bold text-pencil leading-tight mt-0.5">Kriteria mutu berbobot</div>
              </div>
              <div className="rounded-[12px] border-2 border-zinc-200 bg-white p-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-story/60" />
                <div className="relative">
                  <div className="text-[11px] font-black tracking-wide text-eager-dark uppercase">Update</div>
                  <div className="font-display font-black text-[16px] leading-none text-charcoal mt-1">Real time</div>
                  <div className="text-[12px] font-bold text-charcoal/70 leading-tight mt-0.5">Skor hitung ulang otomatis</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT VISUALIZATION */}
          <div ref={heroVisualRef} className="order-2 relative lg:h-[620px] flex items-center justify-center py-4 lg:py-0">
            {/* floating pills behind */}
            <div
              className="absolute hidden lg:flex items-center gap-2 top-6 right-4 z-10 rounded-full bg-white border-2 border-zinc-200 px-3 py-2 shadow-float text-[12px] font-black text-charcoal"
              style={{ animation: 'floatA 5s ease-in-out infinite' }}
            >
              <span className="w-2 h-2 rounded-full bg-eager" /> 9 Kriteria
              <span className="w-px h-4 bg-zinc-200 mx-1" />
              <span className="text-pencil font-bold">Bobot transparan</span>
            </div>
            <div
              className="absolute hidden lg:flex items-center gap-2 bottom-20 -left-2 z-10 rounded-full bg-ink text-white px-3 py-2 shadow-float text-[12px] font-black border-2 border-ink"
              style={{ animation: 'floatB 6s ease-in-out infinite' }}
            >
              <CheckCircle weight="fill" size={16} color="#a5ed6e" />
              Validasi berjenjang
            </div>

            {/* main card — parallax target */}
            <div ref={cardRef} id="heroCard" className="relative w-full max-w-[520px] bg-white rounded-[20px] border-[2px] border-zinc-200 shadow-float overflow-hidden">
              {/* card header */}
              <div className="flex items-center justify-between px-5 h-[56px] border-b-2 border-zinc-100 bg-zinc-50/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center">
                    <ChartBar size={16} weight="regular" color="#777777" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-[13px] font-black text-charcoal leading-none">Leaderboard</div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="w-10 h-2 rounded-full bg-zinc-200" />
                      <span className="w-14 h-2 rounded-full bg-zinc-100 hidden sm:block" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black text-pencil">
                    <Eye size={12} weight="regular" />
                    PREVIEW
                  </span>
                  <span className="w-8 h-8 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center text-pencil">
                    <DotsThree size={16} weight="bold" />
                  </span>
                </div>
              </div>

              {/* podium skeleton */}
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-end gap-2 lg:gap-3 justify-center">
                  {/* rank 2 */}
                  <div className="flex-1 max-w-[148px]">
                    <div className="bg-zinc-50 border-2 border-zinc-200 rounded-[16px] p-3 text-center relative">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-zinc-200 border-2 border-white flex items-center justify-center text-zinc-400">
                        <Medal size={12} weight="regular" />
                      </div>
                      <div className="w-12 h-12 mx-auto mt-2 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center">
                        <User size={18} weight="regular" color="#a1a1aa" />
                      </div>
                      <div className="mt-3 flex flex-col items-center gap-1.5">
                        <span className="w-20 h-2.5 rounded-full bg-zinc-200" />
                        <span className="w-12 h-2 rounded-full bg-zinc-100" />
                      </div>
                      <div className="mt-3 flex justify-center">
                        <span className="inline-flex items-center justify-center w-14 h-6 rounded-full bg-white border-2 border-zinc-200">
                          <Star size={10} weight="regular" color="#d4d4d8" />
                        </span>
                      </div>
                    </div>
                    <div className="h-[54px] bg-zinc-100 border-2 border-t-0 border-zinc-200 rounded-b-[12px] -mt-2 flex items-center justify-center">
                      <span className="w-10 h-2 rounded-full bg-zinc-200" />
                    </div>
                  </div>
                  {/* rank 1 tallest */}
                  <div className="flex-1 max-w-[168px] -mt-4">
                    <div className="bg-white border-2 border-zinc-200 rounded-[16px] p-3 pt-4 text-center relative shadow-sm">
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-zinc-100 border-[3px] border-white flex items-center justify-center shadow-sm">
                        <Crown size={16} weight="regular" color="#a1a1aa" />
                      </div>
                      <div className="w-14 h-14 mx-auto mt-3 rounded-full bg-zinc-50 border-[3px] border-zinc-200 flex items-center justify-center">
                        <Trophy size={18} weight="regular" color="#a1a1aa" />
                      </div>
                      <div className="mt-3 flex flex-col items-center gap-1.5">
                        <span className="w-24 h-2.5 rounded-full bg-zinc-200" />
                        <span className="w-14 h-2 rounded-full bg-zinc-100" />
                      </div>
                      <div className="mt-3 flex justify-center">
                        <span className="w-16 h-7 rounded-full bg-zinc-100 border-2 border-zinc-200" />
                      </div>
                    </div>
                    <div className="h-[78px] bg-zinc-100 border-2 border-t-0 border-zinc-200 rounded-b-[12px] -mt-2 flex flex-col items-center justify-center gap-1.5">
                      <Trophy size={16} weight="regular" color="#d4d4d8" />
                      <span className="w-10 h-2 rounded-full bg-zinc-200" />
                    </div>
                  </div>
                  {/* rank 3 */}
                  <div className="flex-1 max-w-[148px]">
                    <div className="bg-zinc-50 border-2 border-zinc-200 rounded-[16px] p-3 text-center relative">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-zinc-200 border-2 border-white flex items-center justify-center text-zinc-400">
                        <Medal size={12} weight="regular" />
                      </div>
                      <div className="w-12 h-12 mx-auto mt-2 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center">
                        <User size={18} weight="regular" color="#a1a1aa" />
                      </div>
                      <div className="mt-3 flex flex-col items-center gap-1.5">
                        <span className="w-20 h-2.5 rounded-full bg-zinc-200" />
                        <span className="w-12 h-2 rounded-full bg-zinc-100" />
                      </div>
                      <div className="mt-3 flex justify-center">
                        <span className="inline-flex items-center justify-center w-14 h-6 rounded-full bg-white border-2 border-zinc-200">
                          <Star size={10} weight="regular" color="#d4d4d8" />
                        </span>
                      </div>
                    </div>
                    <div className="h-[42px] bg-zinc-100 border-2 border-t-0 border-zinc-200 rounded-b-[12px] -mt-2 flex items-center justify-center">
                      <span className="w-10 h-2 rounded-full bg-zinc-200" />
                    </div>
                  </div>
                </div>

                {/* chart skeleton */}
                <div className="mt-5 rounded-[16px] border-2 border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center">
                        <ChartBar size={14} weight="regular" color="#a1a1aa" />
                      </span>
                      <span className="w-28 h-3 rounded-full bg-zinc-200" />
                    </div>
                    <span className="w-16 h-2 rounded-full bg-zinc-100 hidden sm:block" />
                  </div>
                  <div className="space-y-2.5" id="barChart">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center text-[10px] font-black text-zinc-400 shrink-0">1</span>
                      <span className="flex-1 h-8 rounded-full bg-white border-2 border-zinc-200 overflow-hidden p-1 flex">
                        <span className="h-full rounded-full bg-zinc-200" style={{ '--w': '92%', width: 0, animation: 'barGrow 1.1s 0.7s forwards cubic-bezier(0.16,1,0.3,1)' }} />
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center text-[10px] font-black text-zinc-400 shrink-0">2</span>
                      <span className="flex-1 h-8 rounded-full bg-white border-2 border-zinc-200 overflow-hidden p-1 flex">
                        <span className="h-full rounded-full bg-zinc-200" style={{ '--w': '68%', width: 0, animation: 'barGrow 1.1s 0.85s forwards cubic-bezier(0.16,1,0.3,1)' }} />
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center text-[10px] font-black text-zinc-400 shrink-0">3</span>
                      <span className="flex-1 h-8 rounded-full bg-white border-2 border-zinc-200 overflow-hidden p-1 flex">
                        <span className="h-full rounded-full bg-zinc-100 border-2 border-zinc-200" style={{ '--w': '52%', width: 0, animation: 'barGrow 1.1s 1s forwards cubic-bezier(0.16,1,0.3,1)' }} />
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t-2 border-dashed border-zinc-200 pt-3">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Clock size={14} weight="regular" />
                      <span className="w-32 h-2 rounded-full bg-zinc-200 block" />
                    </span>
                    <span className="w-16 h-2 rounded-full bg-zinc-100" />
                  </div>
                </div>

                {/* bottom mini row skeleton */}
                <div className="grid grid-cols-3 gap-1.5 mt-3">
                  <div className="rounded-[10px] bg-zinc-50 border border-zinc-200 px-2 py-2 text-center">
                    <div className="w-6 h-6 rounded-full bg-white border border-zinc-200 mx-auto flex items-center justify-center">
                      <Buildings size={12} weight="regular" color="#a1a1aa" />
                    </div>
                    <div className="w-12 h-1.5 rounded-full bg-zinc-200 mx-auto mt-1.5" />
                    <div className="w-8 h-1.5 rounded-full bg-zinc-100 mx-auto mt-1" />
                  </div>
                  <div className="rounded-[10px] bg-white border border-zinc-200 px-2 py-2 text-center">
                    <div className="w-6 h-6 rounded-full bg-white border border-zinc-200 mx-auto flex items-center justify-center">
                      <CheckCircle size={12} weight="regular" color="#a1a1aa" />
                    </div>
                    <div className="w-10 h-1.5 rounded-full bg-zinc-200 mx-auto mt-1.5" />
                    <div className="w-8 h-1.5 rounded-full bg-zinc-100 mx-auto mt-1" />
                  </div>
                  <div className="rounded-[10px] bg-white border border-zinc-200 px-2 py-2 text-center">
                    <div className="w-6 h-6 rounded-full bg-white border border-zinc-200 mx-auto flex items-center justify-center">
                      <Clock size={12} weight="regular" color="#a1a1aa" />
                    </div>
                    <div className="w-10 h-1.5 rounded-full bg-zinc-200 mx-auto mt-1.5" />
                    <div className="w-8 h-1.5 rounded-full bg-zinc-100 mx-auto mt-1" />
                  </div>
                </div>
              </div>
            </div>

            {/* decorative rings */}
            <div className="pointer-events-none absolute -z-10 w-[620px] h-[620px] rounded-full border-[1.5px] border-dashed border-zinc-200 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:block" />
            <div className="pointer-events-none absolute -z-10 w-[760px] h-[760px] rounded-full border border-zinc-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:block" />
          </div>
        </div>

        {/* trusted strip below hero */}
        <div className="mt-6 lg:mt-2 rounded-[16px] border-2 border-zinc-200 bg-zinc-50 px-4 lg:px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-4 reveal">
          <div className="flex items-center gap-3 text-[13px] font-bold text-charcoal">
            <span className="hidden sm:inline-flex w-8 h-8 rounded-full bg-white border-2 border-zinc-200 items-center justify-center">
              <Buildings size={16} weight="regular" color="#777777" />
            </span>
            <span>
              Diikuti <b className="text-charcoal">{stats?.madrasahCount ?? '—'} madrasah</b> <span className="text-pencil font-medium">MI, MTs, MA Negeri dan Swasta se Kab. Pasuruan</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[12px] font-black">
            <span className="hidden sm:inline text-pencil">Alur</span>
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white border-2 border-zinc-200">
              <span className="w-5 h-5 rounded-full bg-eager text-white flex items-center justify-center text-[10px] font-black">1</span> Input
            </span>
            <span className="text-faded">→</span>
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white border-2 border-zinc-200">
              <span className="w-5 h-5 rounded-full bg-spark text-white flex items-center justify-center text-[10px] font-black">2</span> Validasi
            </span>
            <span className="text-faded">→</span>
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-eager text-white border-2 border-eager-dark shadow-sm">
              <Trophy weight="fill" size={12} color="white" />
              Peringkat
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

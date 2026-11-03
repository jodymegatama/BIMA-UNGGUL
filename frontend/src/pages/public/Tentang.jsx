import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Info, ArrowRight, Buildings, Trophy } from 'phosphor-react';
import useRevealOnScroll from '../../hooks/useRevealOnScroll';
import { INDIKATORS } from '../../constants/indikator';
import IntroSection from '../../components/public/tentang/IntroSection';
import IndikatorDetailSection from '../../components/public/tentang/IndikatorDetailSection';
import MetodologiSection from '../../components/public/tentang/MetodologiSection';

/**
 * Tentang — /tentang
 * Versi LENGKAP dari ringkasan di Home (#indikator, #metode). Single-column editorial, dot-pattern subtle, reveal stagger.
 * JANGAN ubah Navbar/Footer — ini halaman mandiri, link Navbar masih anchor #indikator/#metode (update terpisah nanti).
 */
export default function Tentang() {
  const ref = useRef(null);
  useRevealOnScroll(ref);

  return (
    <div ref={ref} className="relative">
      {/* dot global kini di App.jsx (fixed), tidak perlu dot lokal per-section */}

      {/* hero header */}
      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 pt-8 lg:pt-10">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
          <Link to="/" className="text-pencil hover:text-charcoal">Beranda</Link>
          <span className="text-faded">/</span>
          <span className="text-charcoal">Tentang</span>
          <span className="hidden sm:inline-flex ml-2 h-6 px-2.5 rounded-full bg-white border-2 border-zinc-200 text-faded">PRD §1, §6, §11</span>
        </div>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4 reveal">
          <div className="max-w-[760px]">
            <div className="inline-flex items-center gap-2 h-7 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black text-charcoal">
              <Buildings size={14} weight="regular" color="#777777" /> Seksi Pendma • Kankemenag Kab. Pasuruan
            </div>
            <h1 className="font-display font-black tracking-[-0.02em] text-[32px] lg:text-[42px] leading-none text-charcoal mt-4">
              Tentang BIMA UNGGUL
            </h1>
            <p className="text-[14px] leading-6 text-pencil font-medium mt-3">
              Halaman ini merangkum <b>identitas, {INDIKATORS.length} indikator, dan metodologi</b> dari PRD. Ringkasan di Home hanya teaser — di sini versi lengkap untuk publik & operator.
            </p>
          </div>
          <div className="hidden lg:flex flex-col items-end gap-2">
            <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-eager text-white border-2 border-eager-dark shadow-sticker text-[12px] font-black">
              <Trophy size={12} weight="fill" color="white" /> Transparan & berbasis bukti
            </span>
            <span className="text-[11px] font-bold text-faded">Periode contoh 2026/2027</span>
          </div>
        </div>
      </div>

      <div className="reveal" style={{ transitionDelay: '0.06s' }}>
        <IntroSection />
      </div>
      <div className="reveal" style={{ transitionDelay: '0.08s' }}>
        <IndikatorDetailSection />
      </div>
      <div className="reveal" style={{ transitionDelay: '0.1s' }}>
        <MetodologiSection />
      </div>

      {/* CTA footer */}
      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 pb-10">
        <div className="mt-8 rounded-[16px] border-2 border-zinc-200 bg-zinc-50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 reveal">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center">
              <Info size={18} weight="regular" color="#777777" />
            </span>
            <div>
              <div className="text-[14px] font-black text-charcoal">Siap melihat peringkat?</div>
              <div className="text-[12px] font-medium text-pencil">Data dummy, filter & tie-breaker sudah deterministik.</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/leaderboard" className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-eager border-2 border-eager-dark text-white text-[13px] font-black shadow-sticker">
              Lihat Leaderboard <ArrowRight size={14} weight="bold" color="white" />
            </Link>
            <Link to="/" className="hidden sm:inline-flex h-10 px-4 rounded-full bg-white border-2 border-zinc-200 text-[13px] font-black text-charcoal hover:border-charcoal">
              Kembali ke Beranda
            </Link>
          </div>
        </div>

        <div className="mt-4 text-[11px] font-bold text-faded text-center">
          Catatan: Jika ada bagian PRD yang belum dirinci (mis. nilai bobot numerik exact per indikator), halaman ini menampilkan <b>tipe formula & variasi bobot</b> saja — tidak mengarang angka.
        </div>
      </div>
    </div>
  );
}

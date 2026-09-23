import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, } from 'react-router-dom';
import { Trophy, List, X, ArrowRight } from 'phosphor-react';
import ThemeToggle from '../shared/ThemeToggle';

/**
 * Navbar — ekstrak persis dari _backup/index.html#navbar
 * - Logo trophy box eager-green rounded-[12px] shadow-sticker dipertahankan
 * - Menu desktop: Beranda, Indikator, Tentang
 *   Saat di "/" → anchor scroll (#beranda/#indikator/#metode) via smooth offset
 *   Saat bukan "/" → Link to="/#..." agar kembali ke Home lalu scroll
 * - Mobile: React state (bukan DOM classList), hamburger ↔ X via phosphor-react
 * - Sticky shadow: useEffect + rAF throttle, bukan manipulasi classList vanilla
 */
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(() => window.scrollY > 8); // lazy init — deep link langsung scrolled
  const location = useLocation();

  const isHome = location.pathname === '/';
  const prefersReduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // Shadow on scroll — persis logika: scrollY > 8 ? add shadow-sm : remove, throttled via rAF
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 8);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Smooth scroll dengan offset 76px (tinggi navbar 72px + 4px buffer, persis script asli)
  const scrollToId = useCallback(
    (id) => {
      const target = document.querySelector(id);
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY - 76;
      window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
    },
    [prefersReduced]
  );

  // Jika sedang di Home, preventDefault + smooth scroll. Jika bukan Home, navigate ke /#id
  const handleAnchorClick = useCallback(
    (e, hash) => {
      if (isHome) {
        e.preventDefault();
        scrollToId(hash);
        setIsOpen(false);
      } else {
        // Biarkan Link navigasi, tapi tutup menu
        setIsOpen(false);
      }
    },
    [isHome, scrollToId]
  );

  // Saat hash di URL berubah setelah navigasi dari non-Home (mis. /leaderboard → /#indikator)
  // scroll setelah mount. Juga handle load langsung dengan hash.
  useEffect(() => {
    if (location.hash) {
      // delay 80ms agar DOM Home selesai render sebelum diukur
      const t = setTimeout(() => scrollToId(location.hash), 80);
      return () => clearTimeout(t);
    }
  }, [location.pathname, location.hash, scrollToId]);

  // Tutup menu saat route berubah — pola "storing info from
  // previous renders" (docs react.dev): setState langsung saat render, tanpa effect.
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setIsOpen(false);
  }

  const inactivePill = 'hover:bg-eager/10 hover:text-eager-dark text-charcoal';

  return (
    <nav
      id="navbar"
      className={`sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-zinc-100 transition-all duration-300 ${isScrolled ? 'shadow-sm' : ''}`}
    >
      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 h-[64px] lg:h-[72px] flex items-center justify-between gap-4">
        {/* Logo — Link to="/" persis box eager-green rounded 12px shadow sticker */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group" aria-label="BIMA UNGGUL — Beranda">
          <div className="w-10 h-10 rounded-[12px] bg-eager flex items-center justify-center border-[2px] border-eager-dark shadow-sticker group-active:translate-y-[2px] group-active:shadow-none transition-all">
            <Trophy weight="fill" size={20} color="white" />
          </div>
          <div className="leading-none">
            <div className="font-display font-black text-[18px] tracking-tight text-charcoal leading-none">BIMA UNGGUL</div>
            <div className="text-[11px] font-bold tracking-wide text-pencil uppercase">Kemenag Kab. Pasuruan</div>
          </div>
        </Link>

        {/* Menu desktop — 4 item */}
        <div className="hidden lg:flex items-center gap-1 text-[14px] font-bold">
          {isHome ? (
            <a href="#beranda" onClick={(e) => handleAnchorClick(e, '#beranda')} className={`px-4 py-2 rounded-full transition ${inactivePill}`}>
              Beranda
            </a>
          ) : (
            <Link to="/#beranda" onClick={(e) => handleAnchorClick(e, '#beranda')} className={`px-4 py-2 rounded-full transition ${inactivePill}`}>
              Beranda
            </Link>
          )}

          {isHome ? (
            <a href="#indikator" onClick={(e) => handleAnchorClick(e, '#indikator')} className={`px-4 py-2 rounded-full transition ${inactivePill}`}>
              Indikator
            </a>
          ) : (
            <Link to="/#indikator" onClick={(e) => handleAnchorClick(e, '#indikator')} className={`px-4 py-2 rounded-full transition ${inactivePill}`}>
              Indikator
            </Link>
          )}

          {isHome ? (
            <a href="#metode" onClick={(e) => handleAnchorClick(e, '#metode')} className={`px-4 py-2 rounded-full transition ${inactivePill}`}>
              Tentang
            </a>
          ) : (
            <Link to="/#metode" onClick={(e) => handleAnchorClick(e, '#metode')} className={`px-4 py-2 rounded-full transition ${inactivePill}`}>
              Tentang
            </Link>
          )}

        </div>

        {/* CTAs */}
        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          <ThemeToggle />
          <Link
            to="/login"
            className="hidden sm:inline-flex items-center justify-center h-10 px-5 rounded-[12px] border-2 border-faded text-charcoal font-extrabold text-[14px] hover:border-charcoal hover:bg-zinc-50 transition"
          >
            Masuk
          </Link>
          <Link
            to="/leaderboard"
            className="inline-flex items-center justify-center h-10 lg:h-11 px-5 lg:px-6 rounded-[12px] bg-eager border-2 border-eager-dark text-white font-black text-[14px] shadow-sticker hover:brightness-[1.03] active:translate-y-[2px] active:shadow-none transition-all gap-1.5"
          >
            Lihat Peringkat <ArrowRight weight="bold" size={14} />
          </Link>
          <button
            id="mobileMenuBtn"
            type="button"
            aria-expanded={isOpen}
            aria-controls="mobileMenu"
            aria-label={isOpen ? 'Tutup menu' : 'Buka menu'}
            onClick={() => setIsOpen((v) => !v)}
            className="lg:hidden w-10 h-10 rounded-[12px] border-2 border-zinc-200 flex items-center justify-center text-charcoal hover:bg-zinc-50 transition"
          >
            {isOpen ? <X size={20} weight="regular" /> : <List size={20} weight="regular" />}
          </button>
        </div>
      </div>

      {/* Mobile menu — React state, bukan classList toggle */}
      <div
        id="mobileMenu"
        className={`${isOpen ? 'block' : 'hidden'} lg:hidden border-t border-zinc-100 bg-white px-4 py-4 space-y-1`}
      >
        {isHome ? (
          <a href="#beranda" onClick={(e) => handleAnchorClick(e, '#beranda')} className="block px-4 py-3 rounded-[12px] bg-zinc-50 font-bold text-charcoal">
            Beranda
          </a>
        ) : (
          <Link to="/#beranda" onClick={(e) => handleAnchorClick(e, '#beranda')} className="block px-4 py-3 rounded-[12px] bg-zinc-50 font-bold text-charcoal">
            Beranda
          </Link>
        )}
        {isHome ? (
          <a href="#indikator" onClick={(e) => handleAnchorClick(e, '#indikator')} className="block px-4 py-3 rounded-[12px] hover:bg-eager/10 hover:text-eager-dark font-bold text-charcoal">
            Indikator
          </a>
        ) : (
          <Link to="/#indikator" onClick={(e) => handleAnchorClick(e, '#indikator')} className="block px-4 py-3 rounded-[12px] hover:bg-eager/10 hover:text-eager-dark font-bold text-charcoal">
            Indikator
          </Link>
        )}
        {isHome ? (
          <a href="#metode" onClick={(e) => handleAnchorClick(e, '#metode')} className="block px-4 py-3 rounded-[12px] hover:bg-eager/10 hover:text-eager-dark font-bold text-charcoal">
            Tentang
          </a>
        ) : (
          <Link to="/#metode" onClick={(e) => handleAnchorClick(e, '#metode')} className="block px-4 py-3 rounded-[12px] hover:bg-eager/10 hover:text-eager-dark font-bold text-charcoal">
            Tentang
          </Link>
        )}
          <Link
            to="/login"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-3 rounded-[12px] border-2 border-zinc-200 font-bold text-center hover:border-charcoal hover:bg-zinc-50 transition"
          >
          Masuk sebagai Operator
        </Link>
      </div>
    </nav>
  );
}

import { useRef } from 'react';
import HeroSection from '../../components/public/home/HeroSection';
import IndikatorSection from '../../components/public/home/IndikatorSection';
import MetodeSection from '../../components/public/home/MetodeSection';
import FaqSection from '../../components/public/home/FaqSection';
import useRevealOnScroll from '../../hooks/useRevealOnScroll';

/**
 * HomePage — komposisi Home (/) zona Publik
 * Semua section di antara Navbar dan Footer dipindah persis dari _backup/index.html:
 *  - Hero #beranda (blob + dot-pattern hero + parallax)
 *  - Indikator #indikator (9 kartu)
 *  - Metode #metode (formula + skeleton preview)
 *  - FAQ #faq (5 details)
 * Reveal-on-scroll di-wire via hook reusable (threshold 0.15), menghormati prefers-reduced-motion via CSS.
 * Navbar/Footer tetap dari PublicLayout — JANGAN disentuh di sini.
 */
export default function HomePage() {
  const rootRef = useRef(null);
  useRevealOnScroll(rootRef, '.reveal, .stagger', 0.15);

  return (
    <div ref={rootRef}>
      <HeroSection />
      <IndikatorSection />
      <MetodeSection />
      <FaqSection />
    </div>
  );
}

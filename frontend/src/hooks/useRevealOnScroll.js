import { useEffect } from 'react';

/**
 * useRevealOnScroll — reusable IntersectionObserver untuk kelas .reveal / .stagger
 * Diambil dari script vanilla _backup/index.html:
 *   new IntersectionObserver(entries => entries.forEach(e => if(e.isIntersecting){add('in'), unobserve}), {threshold:0.15})
 *
 * Scope: TIDAK dipakai di Navbar/Footer (mereka tidak punya .reveal).
 *
 * FIX konten async: snapshot querySelectorAll di mount saja membuat elemen .reveal
 * yang dirender SETELAH fetch (Leaderboard, MadrasahDetail) tidak pernah di-observe
 * → opacity:0 permanen. Sekarang MutationObserver mengawasi penambahan node dan
 * mem-observe elemen .reveal/.stagger baru secara otomatis (pola Context7 /reactjs/react.dev:
 * observer + cleanup disconnect di useEffect untuk cegah leak).
 *
 * @param {React.RefObject<HTMLElement>} containerRef — opsional, jika tidak diberi akan observe document
 * @param {string} selector — default '.reveal, .stagger'
 * @param {number} threshold — default 0.15 (persis dari HTML asli)
 */
export function useRevealOnScroll(containerRef, selector = '.reveal, .stagger', threshold = 0.15) {
  useEffect(() => {
    const root = containerRef?.current ?? document;
    if (!root) return;

    const seen = new WeakSet();

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold }
    );

    const scan = () => {
      root.querySelectorAll(selector).forEach((el) => {
        // lewati yang sudah ter-reveal atau sudah terdaftar — hindari double-observe
        if (!el.classList.contains('in') && !seen.has(el)) {
          seen.add(el);
          io.observe(el);
        }
      });
    };
    scan(); // elemen statis yang sudah ada di mount

    // Node .reveal/.stagger yang ditambahkan belakangan (konten async post-fetch) ikut di-observe.
    // childList+subtree: fire hanya saat node ditambah/dihapus, bukan attribute change → murah.
    const mo = new MutationObserver(() => scan());
    mo.observe(root, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [containerRef, selector, threshold]);
}

export default useRevealOnScroll;

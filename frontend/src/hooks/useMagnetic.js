import { useEffect, useRef } from 'react';

/**
 * useMagnetic — replikasi magnetic CTA dari _backup/index.html
 *   el.addEventListener('mousemove', e => {
 *     x = (clientX - left - w/2)*0.14
 *     y = (clientY - top - h/2)*0.18
 *     el.style.transform = `translate(${x}px,${y}px)`
 *   })
 *   mouseleave -> translate(0,0)
 * Hanya aktif jika (prefers-reduced-motion: no-preference) && (hover:hover)
 */
export function useMagnetic(enabled = true) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = window.matchMedia('(hover:hover)').matches;
    if (prefersReduced || !canHover) return;

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.14;
      const y = (e.clientY - r.top - r.height / 2) * 0.18;
      el.style.transform = `translate(${x}px, ${y}px)`;
    };
    const onLeave = () => {
      el.style.transform = 'translate(0,0)';
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [enabled]);

  return ref;
}

export default useMagnetic;

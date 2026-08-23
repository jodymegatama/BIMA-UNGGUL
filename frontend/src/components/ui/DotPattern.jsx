import { useId } from 'react';
import { cn } from '../../lib/utils';

/**
 * DotPattern — SATU layer global fixed (single opacity, tanpa variant/mask per-halaman)
 * Token: zinc-400 / faded #afafaf, opacity 0.13 → halus untuk tabel/form Operator/Admin/Login,
 * tetap terlihat sebagai tekstur di Home/Hero. Size/spacing tetap 16x16 r1 (terbukti pas).
 * Dipasang 1× di App.jsx sebagai fixed inset-0 -z-10 pointer-events-none (viewport, tidak hilang saat scroll).
 * Warna konsisten DESIGN.md, tanpa mask radial — polos memenuhi viewport.
 */
function DotPattern({
  width = 16,
  height = 16,
  x = 0,
  y = 0,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
  ...props
}) {
  const rawId = useId();
  // useId() di React 19 menghasilkan ':r0:' dengan ':' — tidak valid untuk url(#id) di SVG pada beberapa browser.
  // Sanitasi: hapus ':' agar pattern id dan fill="url(#id)" selalu match tanpa perlu escape.
  const id = rawId.replace(/:/g, '');

  return (
    <svg
      aria-hidden="true"
      className={cn('pointer-events-none h-full w-full fill-zinc-400/[0.13]', className)}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <circle id={`${id}-circle`} cx={cx} cy={cy} r={cr} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
    </svg>
  );
}

export { DotPattern };
export default DotPattern;

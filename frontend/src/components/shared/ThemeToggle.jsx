import { Sun, MoonStars } from 'phosphor-react';
import useTheme from '../../hooks/useTheme';

/**
 * ThemeToggle — switch pill dark/light mode (dipakai lintas zona: publik, operator, admin).
 * Dark = bg-ink (navy) + ikon matahari; Light = bg-white + ikon bulan.
 */
export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
      aria-pressed={dark}
      title={dark ? 'Mode terang' : 'Mode gelap'}
      className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition shrink-0 active:translate-y-[1px] ${
        dark
          ? 'bg-ink border-ink text-white hover:brightness-[1.2]'
          : 'bg-white border-zinc-200 text-pencil hover:border-charcoal hover:text-charcoal'
      } ${className}`}
    >
      {dark ? <Sun size={16} weight="bold" /> : <MoonStars size={16} weight="bold" />}
    </button>
  );
}

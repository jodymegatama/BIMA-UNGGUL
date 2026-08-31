import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'bima-theme';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * useTheme — state tema light/dark + persist localStorage.
 * Sync ke <html class="dark"> (index.html sudah set sebelum paint utk anti-FOUC).
 * Default saat pertama kali: ikut preferensi sistem.
 */
export default function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch { /* private mode — biarkan senyap */ }
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  return { theme, toggle };
}

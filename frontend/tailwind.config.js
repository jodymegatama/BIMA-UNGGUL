/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Kemenag Brand Colors
        brand: {
          navy: '#04437A',
          teal: '#0EAC95',
        },
        // Neutral palette
        neutral: {
          dark: '#2D3748',
          light: '#F7FAFC',
        },
        // Design tokens from backup (accent colors)
        accent: {
          'eager-green': '#58cc02',
          'spark-blue': '#1cb0f6',
          'fresh-leaf': '#a5ed6e',
          'night-ink': '#000437',
        },
        // Grayscale
        gray: {
          charcoal: '#4b4b4b',
          pencil: '#777777',
          faded: '#afafaf',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        feather: ['feather', 'system-ui'],
      },
      borderRadius: {
        12: '12px',
      },
    },
  },
  plugins: [],
}

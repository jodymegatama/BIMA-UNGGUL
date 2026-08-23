/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design tokens — persis dari _backup/index.html & DESIGN.md
        // JANGAN ubah nilai; nama eager/story/spark/fresh/ink/charcoal/pencil/faded/paper harus tetap
        eager: '#58cc02',
        'eager-dark': '#4caf00',
        story: '#d7ffb8',
        spark: '#1cb0f6',
        'spark-dark': '#0ea5e9',
        fresh: '#a5ed6e',
        ink: '#000437',
        charcoal: '#4b4b4b',
        pencil: '#777777',
        faded: '#afafaf',
        paper: '#ffffff',
        // Alias legacy — tetap dipertahankan untuk kompatibilitas Operator/Admin placeholder
        brand: {
          navy: '#04437A',
          teal: '#0EAC95',
        },
        neutral: {
          dark: '#2D3748',
          light: '#F7FAFC',
        },
        accent: {
          'eager-green': '#58cc02',
          'spark-blue': '#1cb0f6',
          'fresh-leaf': '#a5ed6e',
          'night-ink': '#000437',
        },
        gray: {
          charcoal: '#4b4b4b',
          pencil: '#777777',
          faded: '#afafaf',
        },
      },
      fontFamily: {
        // Display = Nunito (feather substitute 700), Body = Nunito Sans
        display: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Nunito Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Nunito Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        feather: ['Nunito', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        duo: '12px',
        'duo-lg': '16px',
        'duo-xl': '20px',
        12: '12px',
      },
      boxShadow: {
        sticker: '0 4px 0 0 #4caf00',
        'sticker-blue': '0 4px 0 0 #0ea5e9',
        card: '0 2px 0 0 rgba(175,175,175,0.3), 0 8px 24px rgba(0,0,0,0.06)',
        float: '0 20px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}

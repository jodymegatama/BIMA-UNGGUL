import { BrowserRouter } from 'react-router-dom';
import { Suspense } from 'react';
import { Toaster } from 'sonner';
import 'sonner/dist/styles.css';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { DotPattern } from './components/ui/DotPattern';
import useTheme from './hooks/useTheme';
import AppRoutes from './router';

function App() {
  const { theme } = useTheme();
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Global DotPattern — SATU layer fixed di root, viewport, tidak hilang saat scroll.
            WAJIB di luar div bg-white agar -z-10 tidak tertutup background parent (stacking context).
            pointer-events-none + -z-10 agar di belakang semua konten tapi tidak block klik/modal. */}
        <DotPattern className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true" />
        {/* Sonner global toast — bottom-right fixed, offset bawah agar tidak menutupi sticky action bar */}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          duration={4000}
          theme={theme === 'dark' ? 'dark' : 'light'}
          offset={{ bottom: 96 }}
          toastOptions={{
            style: { fontFamily: "'Nunito Sans', ui-sans-serif, system-ui, sans-serif", borderRadius: '12px' },
          }}
        />
        <div className="relative min-h-screen">
          <Suspense
            fallback={
              <div className="min-h-screen grid place-items-center text-slate-400 font-semibold">Memuat…</div>
            }
          >
            <AppRoutes />
          </Suspense>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

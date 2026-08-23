import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import 'sonner/dist/styles.css';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { DotPattern } from './components/ui/DotPattern';

// Public — wrapper + pages
import PublicLayout from './components/public/PublicLayout';
import HomePage from './pages/public/HomePage';
import Leaderboard from './pages/public/Leaderboard';
import MadrasahDetail from './pages/public/MadrasahDetail';
import Tentang from './pages/public/Tentang';
import Login from './pages/auth/Login';
import Daftar from './pages/auth/Daftar';

// Operator
import OperatorDashboard from './pages/operator/Dashboard';
import OperatorLayout from './components/operator/OperatorLayout';
import InputCapaian from './pages/operator/InputCapaian';
import RiwayatSubmission from './pages/operator/RiwayatSubmission';
import ProfilMadrasah from './pages/operator/ProfilMadrasah';
import HapusData from './pages/operator/HapusData';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminLayout from './components/admin/AdminLayout';
import AntreanValidasi from './pages/admin/AntreanValidasi';
import ManajemenPeriode from './pages/admin/ManajemenPeriode';
import KonfigurasiBobot from './pages/admin/KonfigurasiBobot';
import ManajemenAkun from './pages/admin/ManajemenAkun';
import ExportLaporan from './pages/admin/ExportLaporan';
import AuditLog from './pages/admin/AuditLog';
import NotFound from './pages/NotFound';

function App() {
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
          offset={{ bottom: 96 }}
          toastOptions={{
            style: { fontFamily: "'Nunito Sans', ui-sans-serif, system-ui, sans-serif", borderRadius: '12px' },
          }}
        />
        <div className="relative min-h-screen">
          <Routes>
        {/* Zona Publik — semua route dibungkus PublicLayout (Navbar + dot-pattern + Footer) */}
        <Route element={<PublicLayout activePeriod="2026/2027" />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/tentang" element={<Tentang />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/madrasah/:slug" element={<MadrasahDetail />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Auth — TANPA PublicLayout (split standalone, sesuai instruksi; PRD §10 menyebut Shell Publik minimal — jika ingin konsisten, bungkus di sini) */}
        <Route path="/login" element={<Login />} />
        <Route path="/daftar" element={<Daftar />} />

        {/* Zona Operator — tetap layout terpisah, protected operator */}
        <Route path="/operator" element={<ProtectedRoute role="operator"><OperatorLayout /></ProtectedRoute>}>
          <Route index element={<OperatorDashboard />} />
          <Route path="input" element={<InputCapaian />} />
          <Route path="riwayat" element={<RiwayatSubmission />} />
          <Route path="hapus-data" element={<HapusData />} />
          <Route path="profil" element={<ProfilMadrasah />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Zona Admin — protected admin */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="validasi" element={<AntreanValidasi />} />
          <Route path="validasi/:id" element={<AntreanValidasi />} />
          <Route path="periode" element={<ManajemenPeriode />} />
          <Route path="bobot" element={<KonfigurasiBobot />} />
          <Route path="akun" element={<ManajemenAkun />} />
          <Route path="laporan" element={<ExportLaporan />} />
          <Route path="audit-log" element={<AuditLog />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Global fallback — untuk path benar-benar tidak dikenal di luar semua shell */}
        <Route path="*" element={<NotFound />} />
      </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

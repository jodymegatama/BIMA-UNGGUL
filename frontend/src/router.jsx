import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './components/public/PublicLayout';
import OperatorLayout from './components/operator/OperatorLayout';
import AdminLayout from './components/admin/AdminLayout';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import NotFound from './pages/NotFound';

function PageFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="text-[13px] font-bold text-faded animate-pulse">Memuat halaman...</div>
    </div>
  );
}

function Zone({ children }) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<PageFallback />}>{children}</Suspense>
    </RouteErrorBoundary>
  );
}

// Zona Publik
const HomePage = lazy(() => import('./pages/public/HomePage'));
const Leaderboard = lazy(() => import('./pages/public/Leaderboard'));
const MadrasahDetail = lazy(() => import('./pages/public/MadrasahDetail'));
const Tentang = lazy(() => import('./pages/public/Tentang'));

// Zona Auth
const Login = lazy(() => import('./pages/auth/Login'));
const Daftar = lazy(() => import('./pages/auth/Daftar'));

// Zona Operator
const OperatorDashboard = lazy(() => import('./pages/operator/Dashboard'));
const InputCapaian = lazy(() => import('./pages/operator/InputCapaian'));
const RiwayatSubmission = lazy(() => import('./pages/operator/RiwayatSubmission'));
const ProfilMadrasah = lazy(() => import('./pages/operator/ProfilMadrasah'));
const HapusData = lazy(() => import('./pages/operator/HapusData'));
const OperatorNotifikasi = lazy(() => import('./pages/operator/Notifikasi'));

// Zona Admin
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AntreanValidasi = lazy(() => import('./pages/admin/AntreanValidasi'));
const ManajemenPeriode = lazy(() => import('./pages/admin/ManajemenPeriode'));
const KonfigurasiBobot = lazy(() => import('./pages/admin/KonfigurasiBobot'));
const ManajemenAkun = lazy(() => import('./pages/admin/ManajemenAkun'));
const ExportLaporan = lazy(() => import('./pages/admin/ExportLaporan'));
const AuditLog = lazy(() => import('./pages/admin/AuditLog'));
const AdminNotifikasi = lazy(() => import('./pages/admin/Notifikasi'));

function AppRoutes() {
  return (
    <Routes>
      {/* Zona Publik — semua route dibungkus PublicLayout (Navbar + dot-pattern + Footer) */}
      <Route element={<PublicLayout activePeriod="2026/2027" />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tentang" element={<Tentang />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/madrasah/:slug" element={<MadrasahDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Auth — TANPA PublicLayout (split standalone) */}
      <Route path="/login" element={<Login />} />
      <Route path="/daftar" element={<Daftar />} />

      {/* Zona Operator — layout terpisah, protected operator */}
      <Route path="/operator" element={<ProtectedRoute role="operator"><OperatorLayout /></ProtectedRoute>}>
        <Route index element={<Zone><OperatorDashboard /></Zone>} />
        <Route path="input" element={<Zone><InputCapaian /></Zone>} />
        <Route path="riwayat" element={<Zone><RiwayatSubmission /></Zone>} />
        <Route path="hapus-data" element={<Zone><HapusData /></Zone>} />
        <Route path="profil" element={<Zone><ProfilMadrasah /></Zone>} />
        <Route path="notifikasi" element={<Zone><OperatorNotifikasi /></Zone>} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Zona Admin — protected admin */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Zone><AdminDashboard /></Zone>} />
        <Route path="validasi" element={<Zone><AntreanValidasi /></Zone>} />
        <Route path="validasi/:id" element={<Zone><AntreanValidasi /></Zone>} />
        <Route path="periode" element={<Zone><ManajemenPeriode /></Zone>} />
        <Route path="bobot" element={<Zone><KonfigurasiBobot /></Zone>} />
        <Route path="akun" element={<Zone><ManajemenAkun /></Zone>} />
        <Route path="laporan" element={<Zone><ExportLaporan /></Zone>} />
        <Route path="audit-log" element={<Zone><AuditLog /></Zone>} />
        <Route path="notifikasi" element={<Zone><AdminNotifikasi /></Zone>} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Global fallback — untuk path benar-benar tidak dikenal di luar semua shell */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;

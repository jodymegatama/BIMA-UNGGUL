import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

// Public pages
import HomePage from './pages/public/HomePage';
import LeaderboardPage from './pages/public/LeaderboardPage';
import MadrasahDetailPage from './pages/public/MadrasahDetailPage';

// Operator pages
import OperatorDashboard from './pages/operator/Dashboard';
import OperatorLayout from './layouts/OperatorLayout';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminLayout from './layouts/AdminLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/madrasah/:slug" element={<MadrasahDetailPage />} />

        {/* Operator Routes */}
        <Route path="/operator" element={<OperatorLayout />}>
          <Route index element={<OperatorDashboard />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

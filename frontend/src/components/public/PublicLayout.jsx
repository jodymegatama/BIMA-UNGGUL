import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * PublicLayout — wrapper untuk semua halaman zona Publik
 * Dot-pattern global kini di App.jsx (fixed layer), tidak perlu duplikat di sini.
 */
export default function PublicLayout({ activePeriod = '2026/2027' }) {
  return (
    <div className="antialiased relative min-h-screen flex flex-col bg-transparent">

      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer activePeriod={activePeriod} />
    </div>
  );
}

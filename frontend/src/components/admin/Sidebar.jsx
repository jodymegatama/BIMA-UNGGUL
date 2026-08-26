import { NavLink, useNavigate } from 'react-router-dom';
import { SquaresFour, ClipboardText, Calendar, Sliders, Users, FileArrowDown, SignOut, ShieldCheck, Scroll } from 'phosphor-react';

const menu = [
  { to: '/admin', label: 'Dashboard', icon: SquaresFour, end: true },
  { to: '/admin/validasi', label: 'Antrian Validasi', icon: ClipboardText, badge: true },
  { to: '/admin/periode', label: 'Manajemen Periode', icon: Calendar },
  { to: '/admin/bobot', label: 'Konfigurasi Bobot', icon: Sliders },
  { to: '/admin/akun', label: 'Manajemen Akun', icon: Users },
  { to: '/admin/laporan', label: 'Laporan / Export', icon: FileArrowDown },
  { to: '/admin/audit-log', label: 'Audit Log', icon: Scroll },
];

export default function Sidebar({ admin, periode, pendingValidasi = 0, onNavigate, onLogout }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    if (onLogout) onLogout();
    else navigate('/login');
  };

  return (
    <div className="flex flex-col h-full bg-white border-r-2 border-zinc-100">
      <div className="h-[64px] flex items-center gap-3 px-5 border-b-2 border-zinc-100 shrink-0">
        <div className="w-9 h-9 rounded-[12px] bg-ink border-2 border-black flex items-center justify-center shrink-0">
          <ShieldCheck size={18} weight="fill" color="white" />
        </div>
        <div className="leading-none min-w-0">
          <div className="font-display font-black text-[13px] tracking-tight text-charcoal leading-none truncate">BIMA UNGGUL</div>
          <div className="text-[10px] font-bold tracking-wide text-faded uppercase truncate">Admin • Seksi Pendma</div>
        </div>
      </div>

      <div className="p-4 border-b-2 border-zinc-100">
        <div className="rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} weight="fill" color="#000437" />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-black text-charcoal leading-none truncate">{admin.nama}</div>
              <div className="text-[11px] font-bold text-faded truncate">NIP {admin.nip}</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-story border-2 border-[#b8eb8a] text-[10px] font-black text-eager-dark">
              Periode {periode}
            </span>
            <span className="text-[11px] font-bold text-pencil">Aktif</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-auto">
        <div className="text-[10px] font-black tracking-wide text-faded uppercase px-2 mb-1">Validasi</div>
        {menu.slice(0, 2).map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            end={m.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center justify-between h-10 px-3 rounded-[12px] border-2 text-[13px] font-black transition ${
                isActive ? 'bg-ink text-white border-black' : 'bg-white border-transparent text-charcoal hover:bg-zinc-50 hover:border-zinc-100'
              }`
            }
          >
            <span className="flex items-center gap-3">
              <m.icon size={18} weight="regular" />
              {m.label}
            </span>
            {m.badge && pendingValidasi > 0 && <span className="min-w-[20px] h-5 px-1 rounded-full bg-eager text-white border border-white flex items-center justify-center text-[10px] font-black">{pendingValidasi}</span>}
          </NavLink>
        ))}
        <div className="text-[10px] font-black tracking-wide text-faded uppercase px-2 mt-3 mb-1">Konfigurasi</div>
        {menu.slice(2, 5).map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 h-10 px-3 rounded-[12px] border-2 text-[13px] font-black transition ${
                isActive ? 'bg-ink text-white border-black' : 'bg-white border-transparent text-charcoal hover:bg-zinc-50 hover:border-zinc-100'
              }`
            }
          >
            <m.icon size={18} weight="regular" />
            {m.label}
          </NavLink>
        ))}
        <div className="text-[10px] font-black tracking-wide text-faded uppercase px-2 mt-3 mb-1">Laporan</div>
        {menu.slice(5).map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 h-10 px-3 rounded-[12px] border-2 text-[13px] font-black transition ${
                isActive ? 'bg-ink text-white border-black' : 'bg-white border-transparent text-charcoal hover:bg-zinc-50 hover:border-zinc-100'
              }`
            }
          >
            <m.icon size={18} weight="regular" />
            {m.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t-2 border-zinc-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 h-10 px-3 rounded-[12px] border-2 border-zinc-200 bg-white text-[13px] font-black text-charcoal hover:border-charcoal hover:bg-zinc-50 transition"
        >
          <SignOut size={18} weight="regular" />
          Keluar
        </button>
        <div className="text-[11px] font-medium text-faded text-center mt-2">© {new Date().getFullYear()} Kemenag Kab. Pasuruan</div>
      </div>
    </div>
  );
}

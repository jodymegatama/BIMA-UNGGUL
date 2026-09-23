import { NavLink, useNavigate } from 'react-router-dom';
import { SquaresFour, PlusCircle, ClockCounterClockwise, User, SignOut, Trophy, Buildings, Trash } from 'phosphor-react';

const menu = [
  { to: '/operator', label: 'Dashboard', icon: SquaresFour, end: true },
  { to: '/operator/input', label: 'Input Capaian', icon: PlusCircle },
  { to: '/operator/riwayat', label: 'Riwayat', icon: ClockCounterClockwise },
  { to: '/operator/hapus-data', label: 'Hapus Data', icon: Trash },
  { to: '/operator/profil', label: 'Profil Madrasah', icon: User },
];

/**
 * Sidebar — putih bersih, border tipis, tidak dot-pattern
 * Desktop: fixed 260px. Mobile: drawer overlay (controlled by parent)
 */
export default function Sidebar({ madrasah, operator, onNavigate, onLogout }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    if (onLogout) onLogout();
    else navigate('/login');
  };

  return (
    <div className="flex flex-col h-full bg-white border-r-2 border-zinc-100">
      {/* logo */}
      <div className="h-[64px] flex items-center gap-3 px-5 border-b-2 border-zinc-100 shrink-0">
        <div className="w-9 h-9 rounded-[12px] bg-eager border-2 border-eager-dark shadow-sticker flex items-center justify-center shrink-0">
          <Trophy size={18} weight="fill" color="white" />
        </div>
        <div className="leading-none min-w-0">
          <div className="font-display font-black text-[13px] tracking-tight text-charcoal leading-none truncate">BIMA UNGGUL</div>
          <div className="text-[10px] font-bold tracking-wide text-faded uppercase truncate">Operator</div>
        </div>
      </div>

      {/* user info */}
      <div className="p-4 border-b-2 border-zinc-100">
        <div className="rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center shrink-0">
              <User size={18} weight="regular" color="#777777" />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-black text-charcoal leading-none truncate">{operator.nama}</div>
              <div className="text-[11px] font-bold text-faded truncate">{operator.email}</div>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-charcoal leading-tight">
              <Buildings size={12} weight="regular" color="#777777" />
              <span className="truncate">{madrasah.nama}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex h-6 px-2 rounded-full bg-white border-2 border-zinc-200 text-[10px] font-black text-pencil">
                {madrasah.kelompok}
              </span>
              <span className="text-[10px] font-mono font-bold text-faded truncate">{madrasah.bmuId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-auto">
        {menu.map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            end={m.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 h-10 px-3 rounded-[12px] border-2 text-[13px] font-black transition ${
                isActive ? 'bg-eager text-white border-eager-dark shadow-sticker' : 'bg-white border-transparent text-charcoal hover:bg-zinc-50 hover:border-zinc-100'
              }`
            }
          >
            <m.icon size={18} weight="regular" />
            {m.label}
          </NavLink>
        ))}
      </nav>

      {/* logout */}
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

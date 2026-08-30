import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IdentificationCard, Lock, Eye, EyeSlash, WarningCircle, CheckCircle, SpinnerGap, Buildings, ShieldCheck } from 'phosphor-react';
import { useAuth } from '../../context/AuthContext';
import { INDIKATORS } from '../../constants/indikator';

/**
 * LoginForm — NIP + password (PRD: custom auth, bukan email)
 * Validasi dasar frontend, submit dummy dengan delay, simulasi error untuk testing tampilan
 * Props: { onSuccess? } — dipanggil setelah dummy sukses (untuk redirect role-based di parent)
 */
export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState('operator'); // 'operator' | 'admin'
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!nip.trim()) return setError('NIP wajib diisi.');
    if (!/^[0-9]{8,18}$/.test(nip.trim())) return setError('NIP harus 8–18 digit angka.');
    if (!password) return setError('Password wajib diisi.');
    if (password.length < 6) return setError('Password minimal 6 karakter.');

    setLoading(true);
    try {
      const { user } = await login(nip.trim(), password);
      // precise success by returned role (ignore pill, trust backend)
      const isAdmin = user?.role === 'admin';
      if (role === 'admin' && !isAdmin) {
        setError('Akun ini bukan Admin. Pilih “Operator”.');
        return;
      }
      if (role === 'operator' && isAdmin) {
        setError('Akun Admin — pilih “Admin” untuk masuk.');
        return;
      }
      setSuccess(`Login berhasil sebagai ${isAdmin ? 'Admin' : 'Operator'} — mengalihkan...`);
      setTimeout(() => {
        if (isAdmin) navigate('/admin', { replace: true });
        else navigate('/operator', { replace: true });
      }, 100);
    } catch (err) {
      // Preserve dummy triggers for local dev without backend: fallback
      const nipT = nip.trim();
      if (nipT === '00000000' || password.toLowerCase() === 'salah123') {
        setError('NIP atau password salah. Periksa kembali.');
      } else if (err.code === 'ACCOUNT_NOT_APPROVED' || err.status === 403) {
        setError('Akun Anda masih “Menunggu Persetujuan” Admin. Hubungi Seksi Pendma.');
      } else if (err.status === 401) {
        setError(err.message || 'NIP atau password salah. Periksa kembali.');
      } else if (err.status === 429) {
        setError(err.message);
      } else {
        // if backend not reachable, show network hint but keep error
        setError(err.message || 'Gagal login. Periksa koneksi atau coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Role-pill swipe */}
      <div>
        <div className="block text-[11px] font-black tracking-wide text-faded uppercase mb-2">Masuk sebagai</div>
        <div className="relative flex p-1 bg-zinc-100 rounded-full border-2 border-zinc-200">
          {/* sliding background */}
          <div
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-eager rounded-full shadow-sticker border-2 border-eager-dark transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ left: role === 'operator' ? '4px' : 'calc(50% + 2px)' }}
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={() => setRole('operator')}
            aria-pressed={role === 'operator'}
            className={`relative z-10 flex-1 h-8 rounded-full flex items-center justify-center gap-1.5 text-[13px] font-black transition-colors ${role === 'operator' ? 'text-white' : 'text-pencil hover:text-charcoal'}`}
          >
            <Buildings size={16} weight={role === 'operator' ? 'fill' : 'regular'} />
            Operator
          </button>
          <button
            type="button"
            onClick={() => setRole('admin')}
            aria-pressed={role === 'admin'}
            className={`relative z-10 flex-1 h-8 rounded-full flex items-center justify-center gap-1.5 text-[13px] font-black transition-colors ${role === 'admin' ? 'text-white' : 'text-pencil hover:text-charcoal'}`}
          >
            <ShieldCheck size={16} weight={role === 'admin' ? 'fill' : 'regular'} />
            Admin
          </button>
        </div>
        <div className="text-[11px] font-medium text-faded mt-1.5">
          {role === 'operator' ? `Akun madrasah — kelola ${INDIKATORS.length} indikator` : 'Seksi Pendma — validasi & kelola periode'}
        </div>
      </div>

      {error && (
        <div className="rounded-[12px] bg-red-50 border-2 border-red-200 text-red-900 px-4 py-3 flex gap-2.5 text-[13px] font-bold leading-5" role="alert">
          <WarningCircle size={18} weight="fill" color="#dc2626" className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="rounded-[12px] bg-emerald-50 border-2 border-emerald-200 text-emerald-900 px-4 py-3 flex gap-2.5 text-[13px] font-bold leading-5" role="status">
          <CheckCircle size={18} weight="fill" color="#059669" className="shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* NIP */}
      <div>
        <label htmlFor="nip" className="block text-[12px] font-black tracking-wide text-charcoal uppercase">
          NIP
        </label>
        <div className="relative mt-1.5">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pencil">
            <IdentificationCard size={18} weight="regular" color="#777777" />
          </span>
          <input
            id="nip"
            name="nip"
            inputMode="numeric"
            autoComplete="username"
            placeholder="Contoh: 197812345678900001"
            value={nip}
            onChange={(e) => setNip(e.target.value.replace(/\D/g, '').slice(0, 18))}
            className="w-full h-11 pl-10 pr-4 rounded-[12px] border-2 border-zinc-200 bg-white text-[14px] font-bold text-charcoal placeholder:text-faded focus:outline-none focus:border-eager focus:ring-2 focus:ring-eager/20 transition"
          />
        </div>
        <div className="text-[11px] font-medium text-faded mt-1.5">Hanya angka, 8–18 digit. Bukan email.</div>
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-[12px] font-black tracking-wide text-charcoal uppercase">
            Password
          </label>
          <Link to="#" onClick={(e) => e.preventDefault()} className="text-[11px] font-black text-spark hover:underline">
            Lupa password?
          </Link>
        </div>
        <div className="relative mt-1.5">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pencil">
            <Lock size={18} weight="regular" color="#777777" />
          </span>
          <input
            id="password"
            name="password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 pl-10 pr-10 rounded-[12px] border-2 border-zinc-200 bg-white text-[14px] font-bold text-charcoal placeholder:text-faded focus:outline-none focus:border-eager focus:ring-2 focus:ring-eager/20 transition"
          />
          <button
            type="button"
            aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
            onClick={() => setShow((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full hover:bg-zinc-50 flex items-center justify-center text-pencil"
          >
            {show ? <EyeSlash size={18} weight="regular" /> : <Eye size={18} weight="regular" />}
          </button>
        </div>
      </div>

      {/* Remember */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          id="remember-me"
          name="remember-me"
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="w-4 h-4 rounded border-2 border-zinc-300 text-eager focus:ring-eager/20"
        />
        <span className="text-[13px] font-bold text-charcoal">Ingat saya</span>
        <span className="text-[11px] font-medium text-faded">di perangkat ini</span>
      </label>

      {/* Submit — style sama CTA hijau "Lihat Peringkat" */}
      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-[12px] bg-eager border-2 border-eager-dark text-white font-black text-[14px] shadow-sticker hover:brightness-[1.03] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-sticker"
      >
        {loading ? (
          <>
            <SpinnerGap size={16} weight="bold" className="animate-spin" /> Memproses...
          </>
        ) : (
          'Masuk'
        )}
      </button>

      <div className="text-center text-[13px] font-medium text-pencil">
        Belum punya akun?{' '}
        <Link to="/daftar" className="font-black text-spark hover:underline">
          Daftar sebagai Operator
        </Link>
      </div>

      <div className="rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3 text-[11px] leading-5 font-medium text-pencil">
        <span className="font-black text-charcoal">Tips uji error:</span> NIP <code className="px-1 py-0.5 rounded bg-white border border-zinc-200 font-mono">00000000</code> + password apa saja → gagal. NIP mengandung <code className="px-1 py-0.5 rounded bg-white border">999</code> → “Menunggu Persetujuan”. Pill di atas menentukan redirect: <b>Operator → /operator</b>, <b>Admin → /admin</b>.
      </div>
    </form>
  );
}

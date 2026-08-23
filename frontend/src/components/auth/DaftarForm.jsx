import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IdentificationCard,
  User,
  Phone,
  Lock,
  Eye,
  EyeSlash,
  Buildings,
  GraduationCap,
  ShieldCheck,
  MapPin,
  Users,
  WarningCircle,
  CheckCircle,
  SpinnerGap,
} from 'phosphor-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';

/**
 * DaftarForm — single-page grouped (Data Akun + Data Madrasah)
 * Validasi per-field spesifik, NIP 18 digit numerik (asumsi), password min 8, konfirmasi, checkbox wajib
 * Props: { onSuccess: (payload) => void }
 */
export default function DaftarForm({ onSuccess }) {
  const [f, setF] = useState({
    nip: '',
    namaLengkap: '',
    telepon: '',
    password: '',
    confirm: '',
    namaMadrasah: '',
    alamatMadrasah: '',
    jumlahSiswa: '',
    jenjang: '',
    status: '',
    agree: false,
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalErr, setGlobalErr] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const validate = () => {
    const e = {};
    if (!f.nip.trim()) e.nip = 'NIP wajib diisi.';
    else if (!/^[0-9]{18}$/.test(f.nip.trim())) e.nip = 'NIP harus 18 digit angka (format NIP PNS).';
    if (!f.namaLengkap.trim()) e.namaLengkap = 'Nama lengkap wajib diisi.';
    else if (f.namaLengkap.trim().length < 3) e.namaLengkap = 'Minimal 3 karakter.';
    if (!f.telepon.trim()) e.telepon = 'No. telepon/WhatsApp wajib diisi.';
    else if (!/^[0-9+\-\s]{10,15}$/.test(f.telepon.replace(/\s/g, ''))) e.telepon = 'Format telepon 10–15 digit.';
    if (!f.password) e.password = 'Password wajib diisi.';
    else if (f.password.length < 8) e.password = 'Password minimal 8 karakter.';
    if (!f.confirm) e.confirm = 'Konfirmasi password wajib diisi.';
    else if (f.confirm !== f.password) e.confirm = 'Konfirmasi tidak sama dengan password.';
    if (!f.namaMadrasah.trim()) e.namaMadrasah = 'Nama madrasah wajib diisi.';
    if (!f.alamatMadrasah.trim()) e.alamatMadrasah = 'Alamat madrasah wajib diisi.';
    else {
      const a = f.alamatMadrasah.trim();
      if (a.length < 5 || a.length > 500) e.alamatMadrasah = 'Alamat 5–500 karakter.';
    }
    const jsNum = Number(f.jumlahSiswa);
    if (!f.jumlahSiswa) e.jumlahSiswa = 'Jumlah siswa wajib diisi.';
    else if (!Number.isInteger(jsNum) || jsNum <= 0) e.jumlahSiswa = 'Harus angka bulat > 0.';
    else if (jsNum > 10000) e.jumlahSiswa = 'Maksimal 10000 siswa.';
    if (!f.jenjang) e.jenjang = 'Pilih jenjang.';
    if (!f.status) e.status = 'Pilih status.';
    if (!f.agree) e.agree = 'Anda harus menyetujui pernyataan.';
    return e;
  };

  const { register } = useAuth();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalErr('');
    const eMap = validate();
    setErrors(eMap);
    if (Object.keys(eMap).length) return;

    setLoading(true);
    try {
      // Map form to backend contract: DaftarForm has namaLengkap/telepon vs API expects name/email + madrasahData
      const email = `${f.nip}@madrasah.local`; // fallback if email not collected; backend requires email
      const payload = {
        nip: f.nip.trim(),
        name: f.namaLengkap.trim(),
        email,
        password: f.password,
        telepon: f.telepon.replace(/[\s\-]/g, ''), // No. Telepon/WhatsApp — disimpan di kolom User.telepon
        madrasahData: {
          nama: f.namaMadrasah.trim(),
          jenjang: f.jenjang,
          statusKepemilikan: f.status,
          alamat: f.alamatMadrasah.trim(),
          jumlahSiswa: Number(f.jumlahSiswa),
        },
      };
      const res = await register(payload);
      // success — backend returns { status: "menunggu_persetujuan" }
      onSuccess?.({ ...f, submittedAt: new Date().toISOString(), api: res });
    } catch (err) {
      const msg = err.message || 'Registrasi gagal';
      const code = err.code;
      if (code === 'INVALID_NIP' || code === 'DUPLICATE' || /sudah terdaftar/i.test(msg)) {
        setErrors((s) => ({ ...s, nip: msg }));
      }
      if (/NIP/i.test(msg) && f.nip === '197812345678900001') {
        setErrors((s) => ({ ...s, nip: 'NIP sudah terdaftar.' }));
      }
      setGlobalErr(msg);
      // keep mock trigger for dev without backend: if network fails, fallback to mock success for 111...? no, show error
    } finally {
      setLoading(false);
    }
  };

  const fieldErr = (k) =>
    errors[k] ? (
      <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-red-600">
        <WarningCircle size={12} weight="fill" color="#dc2626" /> {errors[k]}
      </div>
    ) : null;

  const inputCls = (hasErr) =>
    `w-full h-11 pl-10 pr-4 rounded-[12px] border-2 bg-white text-[14px] font-bold text-charcoal placeholder:text-faded focus:outline-none focus:ring-2 transition ${
      hasErr ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-zinc-200 focus:border-eager focus:ring-eager/20'
    }`;

  const selectCls = (hasErr) =>
    `w-full h-11 pl-10 pr-8 rounded-[12px] border-2 bg-white text-[14px] font-bold text-charcoal focus:outline-none focus:ring-2 transition appearance-none ${
      hasErr ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-zinc-200 focus:border-eager focus:ring-eager/20'
    }`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {globalErr && (
        <div className="rounded-[12px] bg-red-50 border-2 border-red-200 text-red-900 px-4 py-3 flex gap-2.5 text-[13px] font-bold leading-5" role="alert">
          <WarningCircle size={18} weight="fill" color="#dc2626" className="shrink-0 mt-0.5" />
          <span>{globalErr}</span>
        </div>
      )}

      {/* Section: Data Akun */}
      <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-4 lg:p-5">
        <div className="flex items-center gap-2 text-[11px] font-black tracking-wide text-faded uppercase">
          <span className="w-6 h-6 rounded-full bg-eager text-white flex items-center justify-center text-[11px] font-black">1</span>
          Data Akun
        </div>

        <div className="mt-4 grid gap-4">
          {/* NIP */}
          <div>
            <label htmlFor="nip" className="block text-[11px] font-black tracking-wide text-charcoal uppercase">
              NIP <span className="text-red-600">*</span>
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pencil">
                <IdentificationCard size={18} weight="regular" color="#777777" />
              </span>
              <input
                id="nip"
                inputMode="numeric"
                placeholder="18 digit, contoh: 197812345678900002"
                value={f.nip}
                onChange={(e) => set('nip', e.target.value.replace(/\D/g, '').slice(0, 18))}
                className={inputCls(!!errors.nip)}
              />
            </div>
            {fieldErr('nip')}
            <div className="text-[11px] font-medium text-faded mt-1">Asumsi: NIP PNS 18 digit numerik. BMU-XXXXXX dibuat Admin saat approve.</div>
          </div>

          {/* Nama lengkap */}
          <div>
            <label htmlFor="namaLengkap" className="block text-[11px] font-black tracking-wide text-charcoal uppercase">
              Nama lengkap Operator <span className="text-red-600">*</span>
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pencil">
                <User size={18} weight="regular" color="#777777" />
              </span>
              <input
                id="namaLengkap"
                placeholder="Nama penanggung jawab input"
                value={f.namaLengkap}
                onChange={(e) => set('namaLengkap', e.target.value)}
                className={inputCls(!!errors.namaLengkap)}
              />
            </div>
            {fieldErr('namaLengkap')}
          </div>

          {/* Telepon */}
          <div>
            <label htmlFor="telepon" className="block text-[11px] font-black tracking-wide text-charcoal uppercase">
              No. Telepon/WhatsApp <span className="text-red-600">*</span>
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pencil">
                <Phone size={18} weight="regular" color="#777777" />
              </span>
              <input
                id="telepon"
                inputMode="tel"
                placeholder="08xxxxxxxxxx"
                value={f.telepon}
                onChange={(e) => set('telepon', e.target.value)}
                className={inputCls(!!errors.telepon)}
              />
            </div>
            {fieldErr('telepon')}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-[11px] font-black tracking-wide text-charcoal uppercase">
              Password <span className="text-red-600">*</span>
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pencil">
                <Lock size={18} weight="regular" color="#777777" />
              </span>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                placeholder="Minimal 8 karakter"
                value={f.password}
                onChange={(e) => set('password', e.target.value)}
                className={`w-full h-11 pl-10 pr-10 rounded-[12px] border-2 bg-white text-[14px] font-bold text-charcoal placeholder:text-faded focus:outline-none focus:ring-2 transition ${errors.password ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-zinc-200 focus:border-eager focus:ring-eager/20'}`}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full hover:bg-zinc-50 flex items-center justify-center text-pencil"
                aria-label={showPw ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showPw ? <EyeSlash size={18} weight="regular" /> : <Eye size={18} weight="regular" />}
              </button>
            </div>
            {fieldErr('password')}
          </div>

          {/* Konfirmasi */}
          <div>
            <label htmlFor="confirm" className="block text-[11px] font-black tracking-wide text-charcoal uppercase">
              Konfirmasi Password <span className="text-red-600">*</span>
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pencil">
                <Lock size={18} weight="regular" color="#777777" />
              </span>
              <input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Ulangi password"
                value={f.confirm}
                onChange={(e) => set('confirm', e.target.value)}
                className={`w-full h-11 pl-10 pr-10 rounded-[12px] border-2 bg-white text-[14px] font-bold text-charcoal placeholder:text-faded focus:outline-none focus:ring-2 transition ${errors.confirm ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-zinc-200 focus:border-eager focus:ring-eager/20'}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full hover:bg-zinc-50 flex items-center justify-center text-pencil"
                aria-label={showConfirm ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showConfirm ? <EyeSlash size={18} weight="regular" /> : <Eye size={18} weight="regular" />}
              </button>
            </div>
            {fieldErr('confirm')}
          </div>
        </div>
      </div>

      {/* Section: Data Madrasah */}
      <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-4 lg:p-5">
        <div className="flex items-center gap-2 text-[11px] font-black tracking-wide text-faded uppercase">
          <span className="w-6 h-6 rounded-full bg-ink text-white flex items-center justify-center text-[11px] font-black">2</span>
          Data Madrasah
        </div>

        <div className="mt-4 grid gap-4">
          <div>
            <label htmlFor="namaMadrasah" className="block text-[11px] font-black tracking-wide text-charcoal uppercase">
              Nama madrasah <span className="text-red-600">*</span>
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pencil">
                <Buildings size={18} weight="regular" color="#777777" />
              </span>
              <input
                id="namaMadrasah"
                placeholder="Contoh: MI Al Hikmah Bangil"
                value={f.namaMadrasah}
                onChange={(e) => set('namaMadrasah', e.target.value)}
                className={inputCls(!!errors.namaMadrasah)}
              />
            </div>
            {fieldErr('namaMadrasah')}
          </div>

          <div>
            <label htmlFor="alamatMadrasah" className="block text-[11px] font-black tracking-wide text-charcoal uppercase">
              Alamat madrasah <span className="text-red-600">*</span>
            </label>
            <textarea
              id="alamatMadrasah"
              rows={2}
              placeholder="Jl. Raya ..."
              value={f.alamatMadrasah}
              onChange={(e) => set('alamatMadrasah', e.target.value)}
              className={`mt-1.5 w-full px-4 py-2.5 rounded-[12px] border-2 bg-white text-[14px] font-bold text-charcoal placeholder:text-faded focus:outline-none focus:ring-2 transition resize-none ${errors.alamatMadrasah ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-zinc-200 focus:border-eager focus:ring-eager/20'}`}
            />
            {fieldErr('alamatMadrasah')}
          </div>

          <div>
            <label htmlFor="jumlahSiswa" className="block text-[11px] font-black tracking-wide text-charcoal uppercase">
              Jumlah siswa <span className="text-red-600">*</span>
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pencil">
                <Users size={18} weight="regular" color="#777777" />
              </span>
              <input
                id="jumlahSiswa"
                type="number"
                min={1}
                max={10000}
                placeholder="342"
                value={f.jumlahSiswa}
                onChange={(e) => set('jumlahSiswa', e.target.value)}
                className={`${inputCls(!!errors.jumlahSiswa)} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
              />
            </div>
            {fieldErr('jumlahSiswa')}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="jenjang" className="block text-[11px] font-black tracking-wide text-charcoal uppercase">
                Jenjang <span className="text-red-600">*</span>
              </label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pencil">
                  <GraduationCap size={18} weight="regular" color="#777777" />
                </span>
                <select id="jenjang" value={f.jenjang} onChange={(e) => set('jenjang', e.target.value)} className={selectCls(!!errors.jenjang)}>
                  <option value="">Pilih jenjang</option>
                  <option value="MI">MI</option>
                  <option value="MTs">MTs</option>
                  <option value="MA">MA</option>
                </select>
              </div>
              {fieldErr('jenjang')}
            </div>
            <div>
              <label htmlFor="status" className="block text-[11px] font-black tracking-wide text-charcoal uppercase">
                Status <span className="text-red-600">*</span>
              </label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pencil">
                  <ShieldCheck size={18} weight="regular" color="#777777" />
                </span>
                <select id="status" value={f.status} onChange={(e) => set('status', e.target.value)} className={selectCls(!!errors.status)}>
                  <option value="">Pilih status</option>
                  <option value="Negeri">Negeri</option>
                  <option value="Swasta">Swasta</option>
                </select>
              </div>
              {fieldErr('status')}
            </div>
          </div>

          <div className="rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3 flex gap-2">
            <CheckCircle size={16} weight="fill" color="#58cc02" className="shrink-0 mt-0.5" />
            <p className="text-[11px] leading-5 font-bold text-pencil">
              Kode <span className="font-mono font-black text-charcoal">BMU-XXXXXX</span> akan dibuat otomatis oleh Admin saat menyetujui. Anda tidak perlu mengisinya.
            </p>
          </div>
        </div>
      </div>

      {/* Persetujuan */}
      <label className={`flex gap-3 p-3 rounded-[12px] border-2 cursor-pointer ${errors.agree ? 'bg-red-50 border-red-200' : 'bg-white border-zinc-200 hover:border-zinc-300'}`}>
        <input id="agree" name="agree" type="checkbox" checked={f.agree} onChange={(e) => set('agree', e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-2 border-zinc-300 text-eager focus:ring-eager/20 shrink-0" />
        <span className="text-[12px] leading-5 font-bold text-charcoal">
          Saya menyatakan data yang diisi benar dan bertanggung jawab atas keakuratannya. <span className="text-red-600">*</span>
        </span>
      </label>
      {fieldErr('agree')}

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-[12px] bg-eager border-2 border-eager-dark text-white font-black text-[14px] shadow-sticker hover:brightness-[1.03] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <SpinnerGap size={16} weight="bold" className="animate-spin" /> Mengirim...
          </>
        ) : (
          'Daftar Sekarang'
        )}
      </button>

      <div className="text-center text-[13px] font-medium text-pencil">
        Sudah punya akun?{' '}
        <Link to="/login" className="font-black text-spark hover:underline">
          Masuk
        </Link>
      </div>
    </form>
  );
}

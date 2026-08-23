import { Link } from 'react-router-dom';
import { Trophy, ArrowLeft, ShieldCheck } from 'phosphor-react';
import LoginForm from '../../components/auth/LoginForm';
import AuthBrandPanel from '../../components/auth/AuthBrandPanel';

/**
 * Login — /login
 * Tanpa PublicLayout (keputusan: auth split full-screen, sesuai instruksi prompt; PRD §10 menyebut Shell Publik form minimal — tapi untuk UX modern split, kita pakai standalone).
 * Jika nanti butuh konsisten dengan PRD, tinggal bungkus dengan PublicLayout minimal — tinggal ubah App.jsx.
 */
export default function Login() {
  return (
    <div className="min-h-[100dvh] bg-transparent flex flex-col relative">
      {/* top bar tipis */}
      <div className="max-w-[1200px] mx-auto w-full px-4 lg:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="w-8 h-8 rounded-[10px] bg-eager border-2 border-eager-dark shadow-sticker flex items-center justify-center group-active:translate-y-[1px] group-active:shadow-none transition">
            <Trophy size={16} weight="fill" color="white" />
          </span>
          <span className="font-display font-black text-[14px] tracking-tight text-charcoal">BIMA UNGGUL</span>
          <span className="hidden sm:inline text-[11px] font-bold text-faded">• Kembali ke Beranda</span>
        </Link>
        <Link to="/" className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white border-2 border-zinc-200 text-[12px] font-black text-charcoal hover:border-charcoal">
          <ArrowLeft size={14} weight="bold" /> Beranda
        </Link>
      </div>

      <div className="flex-1 grid lg:grid-cols-[1.05fr_0.95fr] max-w-[1200px] mx-auto w-full">
        {/* kiri: form */}
        <div className="px-4 lg:px-8 xl:px-10 py-6 lg:py-8 flex flex-col justify-center">
          <div className="max-w-[440px] w-full mx-auto lg:mx-0">
            <div className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-story border-2 border-[#b8eb8a] text-[11px] font-black text-eager-dark">
              <ShieldCheck size={12} weight="fill" color="#4caf00" /> Masuk • NIP + Password
            </div>
            <h1 className="font-display font-black tracking-[-0.02em] text-[28px] lg:text-[32px] leading-none text-charcoal mt-4">Masuk ke akun Anda</h1>
            <p className="text-[13px] leading-5 font-medium text-pencil mt-2">
              Operator Madrasah & Admin Seksi Pendma. Publik tidak perlu login.
            </p>

            <div className="mt-6 rounded-[16px] border-2 border-zinc-200 bg-white p-5 lg:p-6 shadow-card">
              <LoginForm />
            </div>

            <div className="mt-4 text-center text-[11px] font-medium text-faded">
              Dengan masuk, Anda menyetujui alur validasi berjenjang & audit trail.
            </div>
          </div>
        </div>

        {/* kanan: branding panel */}
        <AuthBrandPanel />
      </div>

      <div className="border-t-2 border-zinc-100 bg-zinc-50/60">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-6 h-10 flex items-center justify-between text-[11px] font-bold text-faded">
          <span>© {new Date().getFullYear()} Kankemenag Kab. Pasuruan</span>
          <span className="hidden sm:inline">Butuh bantuan? Hubungi Seksi Pendma</span>
        </div>
      </div>
    </div>
  );
}

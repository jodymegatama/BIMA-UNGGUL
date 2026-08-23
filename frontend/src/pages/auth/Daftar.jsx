import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowLeft } from 'phosphor-react';
import AuthBrandPanel from '../../components/auth/AuthBrandPanel';
import DaftarForm from '../../components/auth/DaftarForm';
import DaftarSuccessState from '../../components/auth/DaftarSuccessState';

/**
 * Daftar — /daftar
 * Tanpa PublicLayout (split standalone, reuse AuthBrandPanel dari Login)
 * Single-page grouped: Data Akun + Data Madrasah, success state terpisah
 */
export default function Daftar() {
  const [successData, setSuccessData] = useState(null);

  return (
    <div className="min-h-[100dvh] bg-transparent flex flex-col relative">
      {/* top bar */}
      <div className="max-w-[1200px] mx-auto w-full px-4 lg:px-6 h-14 flex items-center justify-between shrink-0">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="w-8 h-8 rounded-[10px] bg-eager border-2 border-eager-dark shadow-sticker flex items-center justify-center group-active:translate-y-[1px] group-active:shadow-none transition">
            <Trophy size={16} weight="fill" color="white" />
          </span>
          <span className="font-display font-black text-[14px] tracking-tight text-charcoal">BIMA UNGGUL</span>
          <span className="hidden sm:inline text-[11px] font-bold text-faded">• Kembali ke Beranda</span>
        </Link>
        <Link to="/login" className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white border-2 border-zinc-200 text-[12px] font-black text-charcoal hover:border-charcoal">
          <ArrowLeft size={14} weight="bold" /> Masuk
        </Link>
      </div>

      <div className="flex-1 grid lg:grid-cols-[1.05fr_0.95fr] max-w-[1200px] mx-auto w-full">
        {/* kiri: form / success */}
        <div className="px-4 lg:px-8 xl:px-10 py-6 lg:py-8 flex flex-col">
          <div className="max-w-[520px] w-full mx-auto lg:mx-0 flex-1">
            {!successData ? (
              <>
                <div className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-story border-2 border-[#b8eb8a] text-[11px] font-black text-eager-dark">
                  Daftar Operator • Menunggu Persetujuan
                </div>
                <h1 className="font-display font-black tracking-[-0.02em] text-[26px] lg:text-[30px] leading-none text-charcoal mt-4">Daftar akun Operator</h1>
                <p className="text-[13px] leading-5 font-medium text-pencil mt-2">
                  Akun terikat ke satu madrasah. Kode <span className="font-mono font-black text-charcoal">BMU-XXXXXX</span> dibuat otomatis saat Admin menyetujui.
                </p>

                <div className="mt-6">
                  <DaftarForm onSuccess={setSuccessData} />
                </div>
              </>
            ) : (
              <>
                <h1 className="font-display font-black tracking-[-0.02em] text-[24px] leading-none text-charcoal">Pendaftaran terkirim</h1>
                <p className="text-[13px] leading-5 font-medium text-pencil mt-2">Status akun Anda sekarang menunggu verifikasi Admin.</p>
                <div className="mt-6">
                  <DaftarSuccessState data={successData} onReset={() => setSuccessData(null)} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* kanan: branding — reuse */}
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

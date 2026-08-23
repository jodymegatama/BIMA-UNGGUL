import { Link } from 'react-router-dom';
import { CheckCircle, Clock, Buildings, ShieldCheck, ArrowLeft, House } from 'phosphor-react';

/**
 * DaftarSuccessState — card konfirmasi setelah submit sukses
 * Menampilkan status Menunggu Persetujuan, bukan redirect ke dashboard
 */
export default function DaftarSuccessState({ data, onReset }) {
  return (
    <div className="rounded-[16px] border-2 border-zinc-200 bg-white overflow-hidden shadow-card">
      <div className="bg-story/40 border-b-2 border-zinc-100 p-6 text-center">
        <span className="w-14 h-14 rounded-full bg-eager border-2 border-eager-dark shadow-sticker mx-auto flex items-center justify-center">
          <CheckCircle size={28} weight="fill" color="white" />
        </span>
        <h2 className="font-display font-black tracking-[-0.02em] text-[22px] leading-none text-charcoal mt-4">Pendaftaran terkirim!</h2>
        <p className="text-[13px] leading-5 font-bold text-pencil mt-2 max-w-[36ch] mx-auto">
          Akun Anda berhasil dikirim dan berstatus <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-amber-100 border-2 border-amber-200 text-amber-900 text-[11px] font-black">Menunggu Persetujuan</span>
        </p>
      </div>

      <div className="p-6 space-y-4">
        {data && (
          <div className="rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-4 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-black tracking-wide text-faded uppercase">
              <Buildings size={14} weight="regular" color="#afafaf" /> Data yang dikirim
            </div>
            <div className="grid gap-1.5 text-[13px]">
              <div className="flex justify-between">
                <span className="font-bold text-pencil">NIP</span>
                <span className="font-mono font-black text-charcoal">{data.nip}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-pencil">Nama</span>
                <span className="font-black text-charcoal truncate ml-4">{data.namaLengkap}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-pencil">Madrasah</span>
                <span className="font-black text-charcoal truncate ml-4">
                  {data.namaMadrasah} • {data.jenjang} {data.status}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-[12px] bg-white border-2 border-zinc-200 p-4 flex gap-3">
          <Clock size={18} weight="regular" color="#1cb0f6" className="shrink-0 mt-0.5" />
          <div>
            <div className="text-[13px] font-black text-charcoal leading-tight">Apa selanjutnya?</div>
            <p className="text-[12px] leading-5 font-medium text-pencil mt-1">
              Admin Seksi Pendma akan memverifikasi data madrasah Anda. Jika disetujui, sistem otomatis membuat kode{' '}
              <span className="font-mono font-black text-charcoal">BMU-XXXXXX</span> permanen dan Anda dapat login dengan NIP + password yang
              didaftarkan. Estimasi 1–2 hari kerja — Anda akan dihubungi via WhatsApp di nomor yang terdaftar bila perlu klarifikasi.
            </p>
          </div>
        </div>

        <div className="rounded-[12px] bg-amber-50 border-2 border-amber-200 p-3 flex gap-2">
          <ShieldCheck size={16} weight="fill" color="#d97706" className="shrink-0 mt-0.5" />
          <p className="text-[11px] leading-5 font-bold text-amber-900">
            Jangan membuat akun duplikat dengan NIP sama selama menunggu. Jika NIP sudah terdaftar, Anda akan lihat error “NIP sudah terdaftar” saat mencoba daftar lagi.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Link to="/" className="flex-1 inline-flex items-center justify-center gap-1.5 h-11 rounded-[12px] bg-eager border-2 border-eager-dark text-white font-black text-[14px] shadow-sticker hover:brightness-[1.03] active:translate-y-[2px] active:shadow-none transition">
            <House size={16} weight="fill" color="white" /> Kembali ke Beranda
          </Link>
          <Link to="/login" className="flex-1 inline-flex items-center justify-center gap-1.5 h-11 rounded-[12px] bg-white border-2 border-zinc-200 text-charcoal font-black text-[14px] hover:border-charcoal">
            Ke Halaman Masuk
          </Link>
        </div>

        {onReset && (
          <button type="button" onClick={onReset} className="w-full text-center text-[12px] font-bold text-faded hover:text-charcoal underline">
            Daftar akun lain
          </button>
        )}

        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-1 text-[12px] font-black text-pencil hover:text-charcoal">
            <ArrowLeft size={14} weight="bold" /> Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

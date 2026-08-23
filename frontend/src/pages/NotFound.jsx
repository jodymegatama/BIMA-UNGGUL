import { Link, useNavigate } from 'react-router-dom';
import { SmileySad, House, ArrowLeft, Trophy, MapTrifold, Buildings } from 'phosphor-react';

export default function NotFound() {
  const nav = useNavigate();
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[640px] text-center">
        <div className="mx-auto w-16 h-16 rounded-[16px] bg-story border-2 border-[#b8eb8a] flex items-center justify-center">
          <SmileySad size={28} weight="regular" color="#4caf00" />
        </div>
        <div className="inline-flex items-center gap-1.5 mt-4 h-7 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black text-faded">
          404 • Halaman tidak ditemukan
        </div>
        <h1 className="font-display font-black tracking-[-0.02em] text-[32px] lg:text-[42px] leading-none text-charcoal mt-3">
          Ups, halaman <span className="text-eager">tidak ada</span>
        </h1>
        <p className="text-[13px] leading-5 font-medium text-pencil mt-3 max-w-[44ch] mx-auto">
          URL yang Anda buka tidak ditemukan atau sudah dipindahkan. Kembali ke Beranda atau lihat peringkat madrasah. Link bukti tidak ditampilkan di sini.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-4 flex gap-3 items-start">
            <span className="w-9 h-9 rounded-[12px] bg-eager border-2 border-eager-dark shadow-sticker flex items-center justify-center shrink-0 text-white">
              <House size={16} weight="fill" color="white" />
            </span>
            <div>
              <div className="text-[13px] font-black text-charcoal">Beranda</div>
              <div className="text-[11px] font-medium text-pencil">Kembali ke landing</div>
            </div>
          </div>
          <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-4 flex gap-3 items-start">
            <span className="w-9 h-9 rounded-[12px] bg-spark border-2 border-spark-dark shadow-sticker-blue flex items-center justify-center shrink-0 text-white">
              <Trophy size={16} weight="fill" color="white" />
            </span>
            <div>
              <div className="text-[13px] font-black text-charcoal">Leaderboard</div>
              <div className="text-[11px] font-medium text-pencil">Lihat peringkat</div>
            </div>
          </div>
          <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-4 flex gap-3 items-start">
            <span className="w-9 h-9 rounded-[12px] bg-white border-2 border-zinc-200 flex items-center justify-center shrink-0">
              <Buildings size={16} weight="regular" color="#777777" />
            </span>
            <div>
              <div className="text-[13px] font-black text-charcoal">Tentang</div>
              <div className="text-[11px] font-medium text-pencil">Metodologi</div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => nav(-1)} className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-white border-2 border-zinc-200 text-[13px] font-black text-charcoal hover:border-charcoal">
            <ArrowLeft size={16} weight="bold" /> Kembali
          </button>
          <Link to="/" className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-eager border-2 border-eager-dark text-white font-black text-[13px] shadow-sticker hover:brightness-[1.03]">
            <House size={16} weight="fill" color="white" /> Ke Beranda
          </Link>
          <Link to="/leaderboard" className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-white border-2 border-zinc-200 text-[13px] font-black text-charcoal hover:border-charcoal">
            <Trophy size={16} weight="fill" color="#58cc02" /> Leaderboard
          </Link>
        </div>

        <div className="mt-4 text-[11px] font-medium text-faded flex items-center justify-center gap-1.5">
          <MapTrifold size={12} weight="regular" /> Jika link dari Admin/Operator, hubungi Seksi Pendma.
        </div>
      </div>
    </div>
  );
}

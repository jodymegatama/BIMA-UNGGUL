import { Trophy, ShieldCheck, Buildings, CheckCircle, Medal, User } from 'phosphor-react';

/**
 * AuthBrandPanel — sisi kanan/dekoratif untuk halaman auth
 * Reuse elemen visual Hero (blob + dot-pattern) tapi lebih tenang, tidak duplikat HeroSection utuh
 * Hanya branding + mini preview card leaderboard (skeleton ringan) agar terasa satu kesatuan
 */
export default function AuthBrandPanel() {
  return (
    <div className="relative hidden lg:flex flex-col overflow-hidden bg-transparent border-l-2 border-zinc-100 p-8 lg:p-10">
      {/* subtle blobs — drift + gentle float */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-[420px] h-[420px] bg-story rounded-full hero-blob" style={{ animation: 'drift 14s ease-in-out infinite' }} />
      <div className="pointer-events-none absolute top-48 -left-12 w-[320px] h-[320px] bg-[#e0f2ff] rounded-full hero-blob" style={{ animation: 'drift 12s ease-in-out infinite reverse' }} />
      <div className="pointer-events-none absolute bottom-20 right-10 w-[220px] h-[220px] bg-story/40 rounded-full blur-2xl" style={{ animation: 'floatC 7s ease-in-out infinite' }} />

      {/* dot global kini di App.jsx — blobs tetap sebagai aksen lokal */}

      {/* content */}
      <div className="relative flex-1 flex flex-col">
        {/* top branding */}
        <div>
          <div className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-eager border-2 border-eager-dark shadow-sticker flex items-center justify-center">
              <Trophy size={20} weight="fill" color="white" />
            </div>
            <div className="leading-none">
              <div className="font-display font-black text-[16px] tracking-tight text-charcoal leading-none">BIMA UNGGUL</div>
              <div className="text-[11px] font-bold tracking-wide text-pencil uppercase">Kemenag Kab. Pasuruan</div>
            </div>
          </div>
          <h2 className="font-display font-black tracking-[-0.02em] text-[24px] lg:text-[26px] leading-[0.95] text-charcoal mt-7 max-w-[18ch]">
            Mutu madrasah terukur dan transparan<span className="text-eager">.</span>
          </h2>
          <p className="text-[13px] leading-5 font-medium text-pencil mt-3 max-w-[32ch]">
            Masuk dengan NIP untuk mengelola capaian 9 indikator. Skor = Σ capaian disetujui × bobot.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black text-charcoal">
              <ShieldCheck size={12} weight="fill" color="#4caf00" /> Tervalidasi
            </span>
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-bold text-pencil">
              <Buildings size={12} weight="regular" /> 6 kelompok
            </span>
          </div>
        </div>

        {/* center: preview card — vertically centered, floating */}
        <div className="flex-1 flex items-center justify-center py-8">
          <div
            className="relative w-full max-w-[360px] rounded-[16px] border-2 border-zinc-200 bg-white overflow-hidden shadow-float"
            style={{ animation: 'floatC 6s ease-in-out infinite' }}
          >
        <div className="h-11 px-4 flex items-center justify-between border-b-2 border-zinc-100 bg-zinc-50/60">
          <span className="text-[12px] font-black text-charcoal flex items-center gap-2">
            <Trophy size={14} weight="fill" color="#58cc02" /> Preview Peringkat
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-faded">
            <span className="w-2 h-2 rounded-full bg-zinc-300" /> Skeleton
          </span>
        </div>
        <div className="p-4 space-y-2.5">
          {/* rank 1 skeleton — subtle pulse */}
          <div className="flex items-center gap-3 rounded-[12px] border-2 border-zinc-200 bg-white px-3 py-3">
            <span className="w-7 h-7 rounded-full bg-zinc-100 border-2 border-white shadow-sm flex items-center justify-center shrink-0">
              <Medal size={12} weight="fill" color="#d4d4d8" />
            </span>
            <div className="flex-1 space-y-1.5">
              <span className="block w-28 h-2.5 rounded-full bg-zinc-200 animate-pulse" />
              <span className="block w-16 h-2 rounded-full bg-zinc-100 animate-pulse" style={{ animationDelay: '0.2s' }} />
            </div>
            <span className="w-12 h-6 rounded-full bg-zinc-100 border-2 border-zinc-200 shrink-0 animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
          {/* rank 2 skeleton */}
          <div className="flex items-center gap-3 rounded-[12px] border-2 border-zinc-100 bg-zinc-50 px-3 py-3">
            <span className="w-7 h-7 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center shrink-0">
              <User size={12} weight="regular" color="#d4d4d8" />
            </span>
            <div className="flex-1 space-y-1.5">
              <span className="block w-24 h-2.5 rounded-full bg-zinc-200 animate-pulse" style={{ animationDelay: '0.15s' }} />
              <span className="block w-14 h-2 rounded-full bg-zinc-100 animate-pulse" style={{ animationDelay: '0.35s' }} />
            </div>
            <span className="w-10 h-6 rounded-full bg-white border-2 border-zinc-200 shrink-0 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
          {/* rank 3 skeleton */}
          <div className="flex items-center gap-3 rounded-[12px] border-2 border-zinc-100 bg-zinc-50 px-3 py-3">
            <span className="w-7 h-7 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center shrink-0">
              <User size={12} weight="regular" color="#d4d4d8" />
            </span>
            <div className="flex-1 space-y-1.5">
              <span className="block w-20 h-2.5 rounded-full bg-zinc-200 animate-pulse" style={{ animationDelay: '0.3s' }} />
              <span className="block w-12 h-2 rounded-full bg-zinc-100 animate-pulse" style={{ animationDelay: '0.45s' }} />
            </div>
            <span className="w-10 h-6 rounded-full bg-white border-2 border-zinc-200 shrink-0 animate-pulse" style={{ animationDelay: '0.6s' }} />
          </div>
        </div>
        <div className="px-4 py-3 bg-zinc-50 border-t-2 border-zinc-100 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center">
              <Buildings size={12} weight="regular" color="#d4d4d8" />
            </span>
            <span className="w-16 h-2 rounded-full bg-zinc-200 block animate-pulse" />
          </span>
          <span className="w-12 h-2 rounded-full bg-zinc-100 block animate-pulse" style={{ animationDelay: '0.3s' }} />
        </div>
      </div>
        </div>

        <div className="relative text-[11px] font-medium text-faded pt-2">© {new Date().getFullYear()} Kankemenag Kab. Pasuruan • Seksi Pendma</div>
      </div>
    </div>
  );
}

import { Gear, Trophy, ChartBar, Eye, Stack, Check, Medal } from 'phosphor-react';

/**
 * MetodeSection — persis dari _backup/index.html #metode
 * - #tentang sr-only anchor
 * - kiri: badge "Bagaimana Sistem Bekerja", heading, formula card, grid 4 langkah
 * - kanan: sticky preview skeleton (Simulasi skor 3 rows + note) + floating badge floatC
 */
export default function MetodeSection() {
  return (
    <section id="metode" className="py-14 lg:py-20 bg-zinc-50 border-y-2 border-zinc-100 scroll-mt-[76px]">
      <div id="tentang" className="sr-only" aria-hidden="true" />
      <div className="max-w-[1200px] mx-auto px-4 lg:px-6">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-10 items-start">
          <div>
            <div className="inline-flex items-center gap-2 h-7 px-3 rounded-full bg-white border-2 border-zinc-200 text-[12px] font-black text-charcoal">
              <Gear size={14} weight="regular" color="#777777" />
              Bagaimana Sistem Bekerja
            </div>
            <h2 className="font-display font-black tracking-[-0.02em] text-[32px] lg:text-[40px] leading-[0.95] text-charcoal mt-4">
              Skor dari bukti. Bukan dari target.
            </h2>
            <p className="text-[15px] leading-[1.6] text-pencil font-medium mt-3 max-w-[56ch]">
              Tidak ada skor minimum atau passing grade. Setiap baris capaian yang disetujui Admin langsung menambah skor. Sistem menghitung ulang otomatis
              dan mengurutkan peringkat.
            </p>

            {/* formula card */}
            <div className="mt-8 rounded-[20px] border-2 border-zinc-200 bg-white overflow-hidden shadow-card">
              <div className="px-6 py-5">
                <div className="text-[11px] font-black tracking-wide text-faded uppercase">Formula</div>
                <div className="mt-2 flex flex-wrap items-center gap-2 font-display font-black text-[20px] lg:text-[22px] leading-none text-charcoal">
                  <span className="inline-flex h-9 px-3 rounded-full bg-story border-2 border-[#b8eb8a] items-center">Skor</span>
                  <span className="text-faded">=</span>
                  <span className="inline-flex items-center gap-1">
                    Σ <span className="text-[13px] font-bold text-pencil leading-none">capaian disetujui</span>
                  </span>
                  <span className="text-eager">×</span>
                  <span className="inline-flex h-9 px-3 rounded-full bg-eager text-white border-2 border-eager-dark items-center shadow-sticker">bobot</span>
                </div>
                <div className="mt-3 text-[13px] leading-[1.5] text-pencil font-medium">
                  Diakumulasi per indikator, lalu dijumlah untuk total skor dalam 6 kelompok madrasah. Tie breaker deterministik memastikan ranking unik.
                </div>
              </div>
              <div className="grid grid-cols-3 divide-x-2 divide-zinc-100 border-t-2 border-zinc-100 bg-zinc-50/60">
                <div className="p-4 text-center">
                  <div className="text-[12px] font-black text-charcoal">per capaian</div>
                  <div className="text-[11px] font-bold text-pencil mt-1">Diklat, penghargaan individu, giat inovatif</div>
                </div>
                <div className="p-4 text-center">
                  <div className="text-[12px] font-black text-charcoal">per tingkat</div>
                  <div className="text-[11px] font-bold text-pencil mt-1">Institusi dan prestasi siswa</div>
                </div>
                <div className="p-4 text-center">
                  <div className="text-[12px] font-black text-charcoal">persentase</div>
                  <div className="text-[11px] font-bold text-pencil mt-1">Rapor dan rasio penerimaan</div>
                </div>
              </div>
            </div>

            {/* langkah */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-4 flex gap-3">
                <div className="w-9 h-9 rounded-full bg-eager border-2 border-eager-dark text-white flex items-center justify-center font-black text-[13px] shrink-0">1</div>
                <div>
                  <div className="text-[14px] font-black text-charcoal leading-tight">Input Operator</div>
                  <div className="text-[13px] leading-[1.4] text-pencil font-medium mt-1">Isi capaian per indikator, simpan draft, kirim saat siap. Link bukti fisik wajib.</div>
                </div>
              </div>
              <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-4 flex gap-3">
                <div className="w-9 h-9 rounded-full bg-spark border-2 border-spark-dark text-white flex items-center justify-center font-black text-[13px] shrink-0">2</div>
                <div>
                  <div className="text-[14px] font-black text-charcoal leading-tight">Validasi Admin</div>
                  <div className="text-[13px] leading-[1.4] text-pencil font-medium mt-1">Admin cek bukti, setujui atau tolak dengan alasan. Revoke jika perlu koreksi.</div>
                </div>
              </div>
              <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-4 flex gap-3">
                <div className="w-9 h-9 rounded-full bg-ink border-2 border-black text-white flex items-center justify-center font-black text-[13px] shrink-0">3</div>
                <div>
                  <div className="text-[14px] font-black text-charcoal leading-tight">Hitung Ulang Skor</div>
                  <div className="text-[13px] leading-[1.4] text-pencil font-medium mt-1">Backend hitung skor per indikator dan total skor otomatis. Real time.</div>
                </div>
              </div>
              <div className="rounded-[16px] border-2 border-eager bg-story p-4 flex gap-3">
                <div className="w-9 h-9 rounded-full bg-eager border-2 border-eager-dark text-white flex items-center justify-center font-black text-[13px] shrink-0">
                  <Trophy size={14} weight="fill" color="white" />
                </div>
                <div>
                  <div className="text-[14px] font-black text-charcoal leading-tight">Leaderboard Publik</div>
                  <div className="text-[13px] leading-[1.4] text-charcoal/70 font-medium mt-1">Publik lihat peringkat tanpa login. Podium, tabel, dan grafik Top 10.</div>
                </div>
              </div>
            </div>
          </div>

          {/* right visual: mini leaderboard preview */}
          <div className="relative lg:sticky lg:top-[88px]">
            <div className="rounded-[20px] border-2 border-zinc-200 bg-white overflow-hidden shadow-float">
              <div className="h-12 px-5 flex items-center justify-between bg-charcoal text-white">
                <span className="text-[13px] font-black flex items-center gap-2">
                  <ChartBar size={16} weight="regular" color="#a5ed6e" />
                  Simulasi skor
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white/10 border border-white/20 text-[11px] font-black text-white/70">
                  <Eye size={12} weight="regular" />
                  PREVIEW
                </span>
              </div>
              <div className="p-5 space-y-3">
                {/* row 1 */}
                <div className="flex items-center gap-3 p-3 rounded-[12px] bg-zinc-50 border-2 border-zinc-200">
                  <span className="w-7 h-7 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center text-zinc-400">
                    <Trophy size={12} weight="regular" />
                  </span>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="w-32 h-2.5 rounded-full bg-zinc-200" />
                    <div className="w-40 h-2 rounded-full bg-zinc-100" />
                  </div>
                  <span className="w-10 h-7 rounded-full bg-zinc-100 border-2 border-zinc-200 shrink-0" />
                </div>
                {/* row 2 */}
                <div className="flex items-center gap-3 p-3 rounded-[12px] bg-white border-2 border-zinc-200">
                  <span className="w-7 h-7 rounded-full bg-zinc-50 border-2 border-zinc-200 flex items-center justify-center text-zinc-400">
                    <Medal size={12} weight="regular" />
                  </span>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="w-28 h-2.5 rounded-full bg-zinc-200" />
                    <div className="w-36 h-2 rounded-full bg-zinc-100" />
                  </div>
                  <span className="w-10 h-7 rounded-full bg-white border-2 border-zinc-200 shrink-0" />
                </div>
                {/* row 3 */}
                <div className="flex items-center gap-3 p-3 rounded-[12px] bg-white border-2 border-zinc-200">
                  <span className="w-7 h-7 rounded-full bg-zinc-50 border-2 border-zinc-200 flex items-center justify-center text-zinc-400">
                    <Medal size={12} weight="regular" />
                  </span>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="w-24 h-2.5 rounded-full bg-zinc-200" />
                    <div className="w-28 h-2 rounded-full bg-zinc-100" />
                  </div>
                  <span className="w-10 h-7 rounded-full bg-white border-2 border-zinc-200 shrink-0" />
                </div>
                {/* note skeleton */}
                <div className="rounded-[12px] bg-zinc-50 border-2 border-dashed border-zinc-200 p-3 flex flex-col items-center gap-1.5">
                  <span className="w-14 h-2 rounded-full bg-zinc-200" />
                  <span className="w-40 h-2 rounded-full bg-zinc-100" />
                  <span className="w-32 h-1.5 rounded-full bg-zinc-100" />
                </div>
              </div>
              <div className="px-5 py-3 bg-zinc-50 border-t-2 border-zinc-100 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center">
                    <Stack size={12} weight="regular" color="#a1a1aa" />
                  </span>
                  <span className="w-20 h-2 rounded-full bg-zinc-200" />
                </span>
                <span className="w-16 h-2 rounded-full bg-zinc-200" />
              </div>
            </div>
            {/* floating badge */}
            <div
              className="hidden lg:flex absolute -right-3 -bottom-3 items-center gap-2 bg-white border-2 border-zinc-200 rounded-full px-3 py-2 shadow-float text-[12px] font-black"
              style={{ animation: 'floatC 4s ease-in-out infinite' }}
            >
              <span className="w-6 h-6 rounded-full bg-eager flex items-center justify-center">
                <Check size={12} weight="bold" color="white" />
              </span>
              Skor transparan & audit trail
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

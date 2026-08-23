import {
  GraduationCap,
  Medal,
  Buildings,
  Trophy,
  Student,
  ChartLineUp,
  PaperPlaneTilt,
  Lightbulb,
  UsersThree,
  Calculator,
  Stack,
  Info,
} from 'phosphor-react';

/**
 * IndikatorSection — persis dari _backup/index.html #indikator
 * 9 kartu, grid 1 / md:2 / lg:3, stagger reveal, copy & badge persis
 */
export default function IndikatorSection() {
  return (
    <section id="indikator" className="py-14 lg:py-20 bg-white border-t-2 border-zinc-100 scroll-mt-[76px]">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-6">
        <div className="max-w-[760px]">
          <div className="inline-flex items-center gap-2 h-7 px-3 rounded-full bg-story border-2 border-[#b8eb8a] text-[12px] font-black text-eager-dark">
            <Stack size={14} weight="fill" color="#4caf00" />
            Kriteria Penilaian
          </div>
          <h2 className="font-display font-black tracking-[-0.02em] text-[32px] lg:text-[42px] leading-[0.95] text-charcoal mt-4">
            9 indikator mutu yang dinilai
          </h2>
          <p className="text-[16px] leading-[1.5] text-pencil font-medium mt-3 max-w-[60ch]">
            Setiap capaian diinput per indikator, dilengkapi bukti fisik, dan dihitung dengan bobot yang dikonfigurasi per periode. Tidak ada batas jumlah
            input.
          </p>
        </div>

        <div className="mt-8 lg:mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 stagger" id="indikatorGrid">
          {/* 1 Diklat — lg:col-span-2 */}
          <article className="group relative rounded-[16px] border-2 border-zinc-200 bg-white p-5 hover:border-eager/30 hover:shadow-card transition-all lg:col-span-2">
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-story border-2 border-[#b8eb8a] flex items-center justify-center text-[11px] font-black text-eager-dark">
              01
            </div>
            <div className="w-11 h-11 rounded-[12px] bg-eager border-2 border-eager-dark flex items-center justify-center shadow-sticker group-hover:rotate-3 transition-transform">
              <GraduationCap size={20} weight="fill" color="white" />
            </div>
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight pr-8">Diklat Tenaga Pendidik</h3>
            <p className="text-[13px] leading-[1.5] text-pencil font-medium mt-1.5">Keikutsertaan diklat bersertifikat oleh institusi penerbit terverifikasi.</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-zinc-50 border-2 border-zinc-200 text-[11px] font-black text-charcoal">
                <Calculator size={12} weight="regular" color="#777777" />
                per capaian x bobot
              </span>
              <span className="inline-flex h-7 px-2.5 rounded-full bg-eager text-white border-2 border-eager-dark text-[11px] font-black">Bobot dinamis</span>
            </div>
          </article>

          {/* 2 Penghargaan Individu */}
          <article className="group rounded-[16px] border-2 border-zinc-200 bg-white p-5 hover:border-zinc-300 hover:shadow-card transition-all">
            <div className="w-11 h-11 rounded-[12px] bg-spark border-2 border-spark-dark flex items-center justify-center shadow-sticker-blue group-hover:rotate-3 transition-transform">
              <Medal size={20} weight="fill" color="white" />
            </div>
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight">Penghargaan Individu Tenaga Pendidik</h3>
            <p className="text-[13px] leading-[1.5] text-pencil font-medium mt-1.5">Penghargaan tenaga pendidik tingkat institusi dengan bukti sah.</p>
            <div className="mt-4 inline-flex h-7 px-2.5 rounded-full bg-zinc-50 border-2 border-zinc-200 text-[11px] font-black text-charcoal">
              per capaian x bobot
            </div>
          </article>

          {/* 3 Penghargaan Institusi */}
          <article className="group rounded-[16px] border-2 border-zinc-200 bg-[#f0f9ff] p-5 hover:shadow-card transition-all">
            <div className="w-11 h-11 rounded-[12px] bg-white border-2 border-zinc-200 flex items-center justify-center group-hover:rotate-3 transition-transform">
              <Buildings size={20} weight="fill" color="#1cb0f6" />
            </div>
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight">Penghargaan Institusi</h3>
            <p className="text-[13px] leading-[1.5] text-pencil font-medium mt-1.5">Prestasi lembaga dengan bobot berjenjang wilayah.</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="h-6 px-2 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black">Kab 1x</span>
              <span className="h-6 px-2 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black">Prov 2x</span>
              <span className="h-6 px-2 rounded-full bg-eager text-white border-2 border-eager-dark text-[11px] font-black">Nasional 3x</span>
            </div>
          </article>

          {/* 4 Prestasi Siswa */}
          <article className="group rounded-[16px] border-2 border-zinc-200 bg-white p-5 hover:shadow-card transition-all">
            <div className="w-11 h-11 rounded-[12px] bg-[#ffb800] border-2 border-[#e6a600] flex items-center justify-center shadow-[0_4px_0_0_#e6a600] group-hover:rotate-3 transition-transform">
              <Trophy size={20} weight="fill" color="white" />
            </div>
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight">Prestasi Siswa</h3>
            <p className="text-[13px] leading-[1.5] text-pencil font-medium mt-1.5">Capaian siswa di kompetisi resmi dengan tingkat wilayah.</p>
            <div className="mt-4 inline-flex h-7 px-2.5 rounded-full bg-zinc-50 border-2 border-zinc-200 text-[11px] font-black text-charcoal">
              per tingkat x bobot
            </div>
          </article>

          {/* 5 Lulus Jenjang */}
          <article className="group rounded-[16px] border-2 border-zinc-200 bg-story p-5 hover:shadow-card transition-all">
            <div className="w-11 h-11 rounded-[12px] bg-white border-2 border-[#b8eb8a] flex items-center justify-center group-hover:rotate-3 transition-transform">
              <Student size={20} weight="fill" color="#58cc02" />
            </div>
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight">Jumlah Tenaga Pendidik Lulus Jenjang Lanjutan</h3>
            <p className="text-[13px] leading-[1.5] text-charcoal/70 font-medium mt-1.5">Jumlah guru lulus S1 S2 S3 dengan bobot berbeda per jenjang.</p>
            <div className="mt-4 flex gap-1.5">
              <span className="flex-1 h-7 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center text-[11px] font-black">S1</span>
              <span className="flex-1 h-7 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center text-[11px] font-black">S2 x1.5</span>
              <span className="flex-1 h-7 rounded-full bg-eager text-white border-2 border-eager-dark flex items-center justify-center text-[11px] font-black">S3 x2</span>
            </div>
          </article>

          {/* 6 Rapor */}
          <article className="group rounded-[16px] border-2 border-zinc-200 bg-white p-5 hover:shadow-card transition-all">
            <div className="w-11 h-11 rounded-[12px] bg-ink border-2 border-black flex items-center justify-center group-hover:rotate-3 transition-transform">
              <ChartLineUp size={20} weight="fill" color="white" />
            </div>
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight">Rapor Rata-rata Murid &gt;85</h3>
            <p className="text-[13px] leading-[1.5] text-pencil font-medium mt-1.5">Persentase siswa dengan nilai rapor rata-rata di atas 85.</p>
            <div className="mt-4 inline-flex h-7 px-2.5 rounded-full bg-ink text-white border-2 border-black text-[11px] font-black">persentase x bobot</div>
          </article>

          {/* 7 Siswa Lanjutan Unggulan */}
          <article className="group rounded-[16px] border-2 border-zinc-200 bg-white p-5 hover:shadow-card transition-all lg:col-span-1">
            <div className="w-11 h-11 rounded-[12px] bg-[#ffe4e6] border-2 border-[#fecdd3] flex items-center justify-center group-hover:rotate-3 transition-transform">
              <PaperPlaneTilt size={20} weight="fill" color="#e11d48" />
            </div>
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight">Siswa Lanjutan Unggulan</h3>
            <p className="text-[13px] leading-[1.5] text-pencil font-medium mt-1.5">Lulusan diterima di universitas atau sekolah unggulan.</p>
            <div className="mt-4 inline-flex h-7 px-2.5 rounded-full bg-zinc-50 border-2 border-zinc-200 text-[11px] font-black">per capaian x bobot</div>
          </article>

          {/* 8 Giat Inovatif */}
          <article className="group rounded-[16px] border-2 border-zinc-200 bg-white p-5 hover:shadow-card transition-all">
            <div className="w-11 h-11 rounded-[12px] bg-[#fef9c3] border-2 border-[#fde68a] flex items-center justify-center group-hover:rotate-3 transition-transform">
              <Lightbulb size={20} weight="fill" color="#ca8a04" />
            </div>
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight">Giat Inovatif</h3>
            <p className="text-[13px] leading-[1.5] text-pencil font-medium mt-1.5">Kegiatan inovatif madrasah yang terdokumentasi dan berdampak.</p>
            <div className="mt-4 inline-flex h-7 px-2.5 rounded-full bg-zinc-50 border-2 border-zinc-200 text-[11px] font-black">per giat x bobot</div>
          </article>

          {/* 9 Rasio Penerimaan */}
          <article className="group rounded-[16px] border-2 border-zinc-200 bg-white p-5 hover:shadow-card transition-all">
            <div className="w-11 h-11 rounded-[12px] bg-[#e0e7ff] border-2 border-[#c7d2fe] flex items-center justify-center group-hover:rotate-3 transition-transform">
              <UsersThree size={20} weight="fill" color="#4f46e5" />
            </div>
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight">Rasio Penerimaan</h3>
            <p className="text-[13px] leading-[1.5] text-pencil font-medium mt-1.5">Daya tarik madrasah dari pendaftar dibanding daya tampung.</p>
            <div className="mt-4 inline-flex h-7 px-2.5 rounded-full bg-[#e0e7ff] border-2 border-[#c7d2fe] text-[11px] font-black text-[#4f46e5]">persentase x bobot</div>
          </article>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 text-[12px] font-bold text-pencil">
          <span className="inline-flex items-center gap-1.5">
            <Info size={16} weight="regular" color="#1cb0f6" />
            Bobot dikonfigurasi Admin per periode dan terkunci saat finalisasi.
          </span>
          <span className="hidden sm:inline w-1 h-1 rounded-full bg-faded" />
          <a href="#" className="text-spark hover:underline font-black">
            Lihat detail indikator -&gt;
          </a>
        </div>
      </div>
    </section>
  );
}

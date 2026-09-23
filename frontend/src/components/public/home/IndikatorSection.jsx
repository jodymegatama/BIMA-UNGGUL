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
import { INDIKATORS } from '../../../constants/indikator';

/**
 * IndikatorSection — persis dari _backup/index.html #indikator
 * 9 kartu, grid 1 / md:2 / lg:3, stagger reveal, copy & badge persis.
 * Revisi 2026-09-14: nama indikator + deskripsi + istilah "Murid" mengikuti spesifikasi baru.
 * Badge tingkat/jenjang TIDAK lagi menampilkan angka pengali — bobot riil dikonfigurasi per periode
 * (lihat halaman Bobot Penilaian admin).
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
            {INDIKATORS.length} indikator mutu yang dinilai
          </h2>
          <p className="text-[16px] leading-[1.5] text-pencil font-medium mt-3 max-w-[60ch]">
            Setiap capaian diinput per indikator, dilengkapi bukti fisik tahun berjalan, dan dihitung dengan bobot yang dikonfigurasi per periode. Tidak ada
            batas jumlah input.
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
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight pr-8">Diklat Pendidik dan Tenaga Kependidikan</h3>
            <p className="text-[13px] leading-[1.5] text-pencil font-medium mt-1.5">Keikutsertaan diklat oleh institusi penyelenggara, dengan bukti diklat tahun berjalan.</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-zinc-50 border-2 border-zinc-200 text-[11px] font-black text-charcoal">
                <Calculator size={14} weight="fill" color="#525252" />
                per capaian x bobot
              </span>
              <span className="inline-flex items-center justify-center h-7 px-2.5 rounded-full bg-eager text-white border-2 border-eager-dark text-[11px] font-black">Bobot dinamis</span>
            </div>
          </article>

          {/* 2 Penghargaan Individu */}
          <article className="group rounded-[16px] border-2 border-zinc-200 bg-white p-5 hover:border-zinc-300 hover:shadow-card transition-all">
            <div className="w-11 h-11 rounded-[12px] bg-spark border-2 border-spark-dark flex items-center justify-center shadow-sticker-blue group-hover:rotate-3 transition-transform">
              <Medal size={20} weight="fill" color="white" />
            </div>
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight">Penghargaan Individu Pendidik dan Tenaga Kependidikan</h3>
            <p className="text-[13px] leading-[1.5] text-pencil font-medium mt-1.5">Penghargaan yang diterima pendidik/tenaga kependidikan, dengan bukti tahun berjalan.</p>
            <div className="mt-4 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-zinc-50 border-2 border-zinc-200 text-[11px] font-black text-charcoal">
              <Calculator size={14} weight="fill" color="#525252" />
              per capaian x bobot
            </div>
          </article>

          {/* 3 Penghargaan Institusi */}
          <article className="group rounded-[16px] border-2 border-zinc-200 bg-[#f0f9ff] p-5 hover:shadow-card transition-all">
            <div className="w-11 h-11 rounded-[12px] bg-white border-2 border-zinc-200 flex items-center justify-center group-hover:rotate-3 transition-transform">
              <Buildings size={20} weight="fill" color="#1cb0f6" />
            </div>
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight">Penghargaan Institusi</h3>
            <p className="text-[13px] leading-[1.5] text-pencil font-medium mt-1.5">Penghargaan madrasah dengan bobot berjenjang wilayah dan bukti fisik tahun berjalan.</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="h-6 px-2 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black">Kabupaten</span>
              <span className="h-6 px-2 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black">Provinsi</span>
              <span className="h-6 px-2 rounded-full bg-eager text-white border-2 border-eager-dark text-[11px] font-black">Nasional</span>
            </div>
          </article>

          {/* 4 Prestasi Siswa */}
          <article className="group rounded-[16px] border-2 border-zinc-200 bg-white p-5 hover:shadow-card transition-all">
            <div className="w-11 h-11 rounded-[12px] bg-[#ffb800] border-2 border-[#e6a600] flex items-center justify-center shadow-[0_4px_0_0_#e6a600] group-hover:rotate-3 transition-transform">
              <Trophy size={20} weight="fill" color="white" />
            </div>
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight">Prestasi Siswa</h3>
            <p className="text-[13px] leading-[1.5] text-pencil font-medium mt-1.5">Capaian murid di kompetisi resmi dengan tingkat wilayah (bukti tahun berjalan).</p>
            <div className="mt-4 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-zinc-50 border-2 border-zinc-200 text-[11px] font-black text-charcoal">
              <Calculator size={14} weight="fill" color="#525252" />
              per tingkat x bobot
            </div>
          </article>

          {/* 5 Lulus Jenjang */}
          <article className="group rounded-[16px] border-2 border-zinc-200 bg-story p-5 hover:shadow-card transition-all">
            <div className="w-11 h-11 rounded-[12px] bg-white border-2 border-[#b8eb8a] flex items-center justify-center group-hover:rotate-3 transition-transform">
              <Student size={20} weight="fill" color="#58cc02" />
            </div>
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight">Jumlah Pendidik dan Tenaga Kependidikan Lulus Jenjang Lanjutan</h3>
            <p className="text-[13px] leading-[1.5] text-charcoal/70 font-medium mt-1.5">Jumlah pendidik &amp; tenaga kependidikan lulus S1/S2/S3 — bukti ijazah tahun berjalan.</p>
            <div className="mt-4 flex gap-1.5">
              <span className="flex-1 h-7 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center text-[11px] font-black">S1</span>
              <span className="flex-1 h-7 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center text-[11px] font-black">S2</span>
              <span className="flex-1 h-7 rounded-full bg-eager text-white border-2 border-eager-dark flex items-center justify-center text-[11px] font-black">S3</span>
            </div>
          </article>

          {/* 6 Nilai rata-rata TKA/ANBK */}
          <article className="group rounded-[16px] border-2 border-zinc-200 bg-white p-5 hover:shadow-card transition-all">
            <div className="w-11 h-11 rounded-[12px] bg-ink border-2 border-black flex items-center justify-center group-hover:rotate-3 transition-transform">
              <ChartLineUp size={20} weight="fill" color="white" />
            </div>
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight">Nilai Rata-rata Murid &gt; 85</h3>
            <p className="text-[13px] leading-[1.5] text-pencil font-medium mt-1.5">Persentase murid dengan nilai TKA/ANBK di atas 85 (bukti tahun berjalan).</p>
            <div className="mt-4 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-ink text-white border-2 border-black text-[11px] font-black">
              <Calculator size={14} weight="fill" color="#ffffff" />
              persentase x bobot
            </div>
          </article>

          {/* 7 Murid Lanjutan Unggulan */}
          <article className="group rounded-[16px] border-2 border-zinc-200 bg-white p-5 hover:shadow-card transition-all lg:col-span-1">
            <div className="w-11 h-11 rounded-[12px] bg-[#ffe4e6] border-2 border-[#fecdd3] flex items-center justify-center group-hover:rotate-3 transition-transform">
              <PaperPlaneTilt size={20} weight="fill" color="#e11d48" />
            </div>
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight">Murid Lanjutan Unggulan</h3>
            <p className="text-[13px] leading-[1.5] text-pencil font-medium mt-1.5">Murid lulus yang diterima di universitas atau sekolah unggulan (bukti kelulusan).</p>
            <div className="mt-4 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-zinc-50 border-2 border-zinc-200 text-[11px] font-black">
              <Calculator size={14} weight="fill" color="#525252" />
              per capaian x bobot
            </div>
          </article>

          {/* 8 Giat Inovatif */}
          <article className="group rounded-[16px] border-2 border-zinc-200 bg-white p-5 hover:shadow-card transition-all">
            <div className="w-11 h-11 rounded-[12px] bg-[#fef9c3] border-2 border-[#fde68a] flex items-center justify-center group-hover:rotate-3 transition-transform">
              <Lightbulb size={20} weight="fill" color="#ca8a04" />
            </div>
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight">Giat Inovatif dalam Pengembangan Mutu Madrasah</h3>
            <p className="text-[13px] leading-[1.5] text-pencil font-medium mt-1.5">Kegiatan inovatif pengembangan mutu madrasah dengan laporan kegiatan.</p>
            <div className="mt-4 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-zinc-50 border-2 border-zinc-200 text-[11px] font-black">
              <Calculator size={14} weight="fill" color="#525252" />
              per giat x bobot
            </div>
          </article>

          {/* 9 Rasio Penerimaan */}
          <article className="group rounded-[16px] border-2 border-zinc-200 bg-white p-5 hover:shadow-card transition-all">
            <div className="w-11 h-11 rounded-[12px] bg-[#e0e7ff] border-2 border-[#c7d2fe] flex items-center justify-center group-hover:rotate-3 transition-transform">
              <UsersThree size={20} weight="fill" color="#4f46e5" />
            </div>
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight">Rasio Penerimaan Murid Baru</h3>
            <p className="text-[13px] leading-[1.5] text-pencil font-medium mt-1.5">Murid diterima dari jumlah pendaftar tahun berjalan (bukti tahun berjalan).</p>
            <div className="mt-4 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-[#e0e7ff] border-2 border-[#c7d2fe] text-[11px] font-black text-[#4f46e5]">
              <Calculator size={14} weight="fill" color="#4f46e5" />
              persentase x bobot
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

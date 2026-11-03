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
  Paperclip,
  Stack,
} from 'phosphor-react';
import { INDIKATORS } from '../../../constants/indikator';

/**
 * IndikatorSection — persis dari _backup/index.html #indikator
 * 9 kartu, grid 1 / md:2 / lg:3, stagger reveal, copy & badge persis.
 * Revisi 2026-09-14: nama indikator + deskripsi + istilah "Murid" mengikuti spesifikasi baru.
 * Revisi 2026-09-25 (SEO + info bukti): tiap kartu memuat deskripsi yang menjelaskan bukti
 * wajib tahun berjalan + chip nama field lampiran persis dari spesifikasi input Operator.
 * H3 indikator 06 memakai kata "Lebih dari 85" (bukan simbol ">") agar ramah snippet SERP.
 * Badge tingkat/jenjang TIDAK menampilkan angka pengali — bobot riil dikonfigurasi per periode.
 */

/** Blok lampiran wajib: label + chip nama field yang dilampirkan Operator. */
function LampiranWajib({ fields }) {
  return (
    <div className="mt-4 rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3">
      <div className="text-[10px] font-black tracking-wide text-faded uppercase flex items-center gap-1">
        <Paperclip size={12} weight="fill" color="#afafaf" />
        Lampiran wajib — bukti tahun berjalan
      </div>
      <ul className="mt-1.5 flex flex-wrap gap-1">
        {fields.map((f) => (
          <li key={f} className="text-[11px] font-bold bg-white border border-zinc-200 rounded-full px-2.5 py-0.5 text-charcoal">
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

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
            <p className="text-[13px] leading-[1.5] text-pencil font-medium mt-1.5">
              Bukti diklat yang dilaksanakan pada tahun berjalan wajib dilampirkan: nama diklat, nama institusi penyelenggara, nama pelaksana ASN atau non-ASN,
              dan status kepegawaian.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-zinc-50 border-2 border-zinc-200 text-[11px] font-black text-charcoal">
                <Calculator size={14} weight="fill" color="#525252" />
                per capaian x bobot
              </span>
              <span className="inline-flex items-center justify-center h-7 px-2.5 rounded-full bg-eager text-white border-2 border-eager-dark text-[11px] font-black">Bobot dinamis</span>
            </div>
            <LampiranWajib
              fields={[
                'Nama Diklat',
                'Nama Institusi Penyelenggara Diklat',
                'Nama Pelaksana ASN/Non-ASN',
                'Status Pegawai (ASN/Non-ASN)',
              ]}
            />
          </article>

          {/* 2 Penghargaan Individu */}
          <article className="group rounded-[16px] border-2 border-zinc-200 bg-white p-5 hover:border-zinc-300 hover:shadow-card transition-all">
            <div className="w-11 h-11 rounded-[12px] bg-spark border-2 border-spark-dark flex items-center justify-center shadow-sticker-blue group-hover:rotate-3 transition-transform">
              <Medal size={20} weight="fill" color="white" />
            </div>
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight">Penghargaan Individu Pendidik dan Tenaga Kependidikan</h3>
            <p className="text-[13px] leading-[1.5] text-pencil font-medium mt-1.5">
              Bukti penghargaan yang diterima pada tahun berjalan wajib dilampirkan: nama penghargaan, nama institusi penyelenggara, nama penerima ASN atau
              non-ASN, dan status kepegawaian.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-zinc-50 border-2 border-zinc-200 text-[11px] font-black text-charcoal">
              <Calculator size={14} weight="fill" color="#525252" />
              per capaian x bobot
            </div>
            <LampiranWajib
              fields={[
                'Nama Penghargaan',
                'Nama Institusi Penyelenggara Penghargaan',
                'Nama Penerima ASN/Non-ASN',
                'Status Pegawai (ASN/Non-ASN)',
              ]}
            />
          </article>

          {/* 3 Penghargaan Institusi */}
          <article className="group rounded-[16px] border-2 border-zinc-200 bg-[#f0f9ff] p-5 hover:shadow-card transition-all">
            <div className="w-11 h-11 rounded-[12px] bg-white border-2 border-zinc-200 flex items-center justify-center group-hover:rotate-3 transition-transform">
              <Buildings size={20} weight="fill" color="#1cb0f6" />
            </div>
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight">Penghargaan Institusi</h3>
            <p className="text-[13px] leading-[1.5] text-pencil font-medium mt-1.5">
              Bukti fisik penghargaan pada tahun berjalan wajib dilampirkan: nama penghargaan, institusi penerbit, dan tingkat wilayah prestasi — kabupaten,
              provinsi, nasional, atau internasional.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="h-6 px-2 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black">Kabupaten</span>
              <span className="h-6 px-2 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black">Provinsi</span>
              <span className="h-6 px-2 rounded-full bg-eager text-white border-2 border-eager-dark text-[11px] font-black">Nasional</span>
            </div>
            <LampiranWajib
              fields={[
                'Nama Penghargaan',
                'Institusi Penerbit Penghargaan',
                'Tingkat Wilayah Prestasi (Kabupaten/Provinsi/Nasional/Internasional)',
              ]}
            />
          </article>

          {/* 4 Prestasi Siswa */}
          <article className="group rounded-[16px] border-2 border-zinc-200 bg-white p-5 hover:shadow-card transition-all">
            <div className="w-11 h-11 rounded-[12px] bg-[#ffb800] border-2 border-[#e6a600] flex items-center justify-center shadow-[0_4px_0_0_#e6a600] group-hover:rotate-3 transition-transform">
              <Trophy size={20} weight="fill" color="white" />
            </div>
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight">Prestasi Siswa</h3>
            <p className="text-[13px] leading-[1.5] text-pencil font-medium mt-1.5">
              Bukti prestasi yang diterima pada tahun berjalan wajib dilampirkan: nama penghargaan atau prestasi, institusi penerbit, nama murid, dan tingkat
              wilayah prestasi (kabupaten, provinsi, nasional, internasional).
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-zinc-50 border-2 border-zinc-200 text-[11px] font-black text-charcoal">
              <Calculator size={14} weight="fill" color="#525252" />
              per tingkat x bobot
            </div>
            <LampiranWajib
              fields={[
                'Nama Penghargaan atau Prestasi',
                'Institusi Penerbit Penghargaan',
                'Nama Murid',
                'Tingkat Wilayah Prestasi (Kab/Prov/Nas/Internasional)',
              ]}
            />
          </article>

          {/* 5 Lulus Jenjang */}
          <article className="group rounded-[16px] border-2 border-zinc-200 bg-story p-5 hover:shadow-card transition-all">
            <div className="w-11 h-11 rounded-[12px] bg-white border-2 border-[#b8eb8a] flex items-center justify-center group-hover:rotate-3 transition-transform">
              <Student size={20} weight="fill" color="#58cc02" />
            </div>
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight">Jumlah Pendidik dan Tenaga Kependidikan Lulus Jenjang Lanjutan</h3>
            <p className="text-[13px] leading-[1.5] text-charcoal/70 font-medium mt-1.5">
              Bukti ijazah jenjang lanjutan pendidik dan tenaga kependidikan pada tahun berjalan wajib dilampirkan: jenjang pendidikan S1, S2, atau S3 beserta
              jumlah ASN.
            </p>
            <div className="mt-4 flex gap-1.5">
              <span className="flex-1 h-7 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center text-[11px] font-black">S1</span>
              <span className="flex-1 h-7 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center text-[11px] font-black">S2</span>
              <span className="flex-1 h-7 rounded-full bg-eager text-white border-2 border-eager-dark flex items-center justify-center text-[11px] font-black">S3</span>
            </div>
            <LampiranWajib
              fields={[
                'Jenjang Pendidikan (S1/S2/S3)',
                'Jumlah ASN',
              ]}
            />
          </article>

          {/* 6 Nilai rata-rata TKA/ANBK */}
          <article className="group rounded-[16px] border-2 border-zinc-200 bg-white p-5 hover:shadow-card transition-all">
            <div className="w-11 h-11 rounded-[12px] bg-ink border-2 border-black flex items-center justify-center group-hover:rotate-3 transition-transform">
              <ChartLineUp size={20} weight="fill" color="white" />
            </div>
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight">Nilai Rata-rata Murid Lebih dari 85</h3>
            <p className="text-[13px] leading-[1.5] text-pencil font-medium mt-1.5">
              Bukti hasil TKA atau ANBK tahun berjalan wajib dilampirkan, berupa perhitungan murid dengan nilai lebih dari 85 terhadap total murid (format X
              dari Y = Z persen).
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-ink text-white border-2 border-black text-[11px] font-black">
              <Calculator size={14} weight="fill" color="#ffffff" />
              persentase x bobot
            </div>
            <LampiranWajib fields={['Hasil TKA/ANBK Murid > 85 (0 dari 0 = 0%)']} />
          </article>

          {/* 7 Murid Lanjutan Unggulan */}
          <article className="group rounded-[16px] border-2 border-zinc-200 bg-white p-5 hover:shadow-card transition-all lg:col-span-1">
            <div className="w-11 h-11 rounded-[12px] bg-[#ffe4e6] border-2 border-[#fecdd3] flex items-center justify-center group-hover:rotate-3 transition-transform">
              <PaperPlaneTilt size={20} weight="fill" color="#e11d48" />
            </div>
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight">Murid Lanjutan Unggulan</h3>
            <p className="text-[13px] leading-[1.5] text-pencil font-medium mt-1.5">
              Bukti kelulusan tahun berjalan wajib dilampirkan: nama universitas atau sekolah unggulan tujuan dan nama murid yang diterima.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-zinc-50 border-2 border-zinc-200 text-[11px] font-black text-charcoal">
              <Calculator size={14} weight="fill" color="#525252" />
              per capaian x bobot
            </div>
            <LampiranWajib
              fields={[
                'Nama Universitas atau Sekolah Unggulan',
                'Nama Murid',
              ]}
            />
          </article>

          {/* 8 Giat Inovatif */}
          <article className="group rounded-[16px] border-2 border-zinc-200 bg-white p-5 hover:shadow-card transition-all">
            <div className="w-11 h-11 rounded-[12px] bg-[#fef9c3] border-2 border-[#fde68a] flex items-center justify-center group-hover:rotate-3 transition-transform">
              <Lightbulb size={20} weight="fill" color="#ca8a04" />
            </div>
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight">Giat Inovatif dalam Pengembangan Mutu Madrasah</h3>
            <p className="text-[13px] leading-[1.5] text-pencil font-medium mt-1.5">
              Bukti laporan kegiatan tahun berjalan wajib dilampirkan, memuat nama giat inovatif pengembangan mutu madrasah.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-zinc-50 border-2 border-zinc-200 text-[11px] font-black text-charcoal">
              <Calculator size={14} weight="fill" color="#525252" />
              per giat x bobot
            </div>
            <LampiranWajib fields={['Nama Giat Inovatif']} />
          </article>

          {/* 9 Rasio Penerimaan */}
          <article className="group rounded-[16px] border-2 border-zinc-200 bg-white p-5 hover:shadow-card transition-all">
            <div className="w-11 h-11 rounded-[12px] bg-[#e0e7ff] border-2 border-[#c7d2fe] flex items-center justify-center group-hover:rotate-3 transition-transform">
              <UsersThree size={20} weight="fill" color="#4f46e5" />
            </div>
            <h3 className="font-display font-black text-[16px] text-charcoal mt-4 leading-tight">Rasio Penerimaan Murid Baru</h3>
            <p className="text-[13px] leading-[1.5] text-pencil font-medium mt-1.5">
              Bukti penerimaan murid baru tahun berjalan wajib dilampirkan: jumlah murid diterima dari total pendaftar (format X dari Y = Z persen).
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-[#e0e7ff] border-2 border-[#c7d2fe] text-[11px] font-black text-[#4f46e5]">
              <Calculator size={14} weight="fill" color="#4f46e5" />
              persentase x bobot
            </div>
            <LampiranWajib fields={['Murid diterima dari jumlah pendaftar tahun berjalan (0 dari 0 = 0%)']} />
          </article>
        </div>
      </div>
    </section>
  );
}

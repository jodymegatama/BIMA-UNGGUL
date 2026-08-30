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
 * IndikatorDetailSection — 9 indikator versi LENGKAP (PRD §11)
 * Reuse card style dari Home IndikatorSection, ditambah: daftar field input + cara hitung per tipe formula
 * Catatan: PRD hanya merinci field input & tipe formula, tidak ada definisi narasi panjang per indikator — maka kita pakai
 * deskripsi ringkas dari Home + tambahan "Cara hitung" sesuai tipe formula PRD.
 */

const DETAILS = [
  {
    no: '01',
    icon: GraduationCap,
    iconBg: 'bg-eager border-eager-dark shadow-sticker',
    iconColor: 'white',
    nama: 'Diklat Tenaga Pendidik',
    kode: 'diklat',
    desc: 'Keikutsertaan diklat bersertifikat oleh institusi penerbit terverifikasi.',
    fields: ['Nama Diklat', 'Nama Institusi Penerbit', 'Nama ASN/non-ASN Pelaksana', 'Status Pegawai (ASN/non-ASN)', 'Link Bukti Fisik', 'Catatan Tambahan'],
    hitung: 'Jumlah Approved × Bobot',
    badge: 'per capaian x bobot',
    tone: 'Bobot dinamis',
  },
  {
    no: '02',
    icon: Medal,
    iconBg: 'bg-spark border-spark-dark shadow-sticker-blue',
    iconColor: 'white',
    nama: 'Penghargaan Individu Tenaga Pendidik',
    kode: 'penghargaan_individu',
    desc: 'Penghargaan tenaga pendidik tingkat institusi dengan bukti sah.',
    fields: ['Nama Penghargaan', 'Nama Institusi Penerbit', 'Nama ASN/non-ASN Penerima', 'Status Pegawai', 'Link Bukti Fisik', 'Catatan Tambahan'],
    hitung: 'Jumlah Approved × Bobot',
    badge: 'per capaian x bobot',
  },
  {
    no: '03',
    icon: Buildings,
    iconBg: 'bg-white border-zinc-200',
    iconColor: '#1cb0f6',
    nama: 'Penghargaan Institusi',
    kode: 'penghargaan_institusi',
    desc: 'Prestasi lembaga dengan bobot berjenjang wilayah.',
    fields: ['Nama Penghargaan', 'Institusi Penerbit', 'Tingkat Wilayah (Kab/Prov/Nas/Inter)', 'Link Bukti Fisik', 'Catatan Tambahan'],
    hitung: 'Σ(Jumlah per tingkat × Bobot tingkat)',
    badges: ['Kab 1x', 'Prov 2x', 'Nasional 3x'],
    cardBg: 'bg-[#f0f9ff]',
  },
  {
    no: '04',
    icon: Trophy,
    iconBg: 'bg-[#ffb800] border-[#e6a600] shadow-[0_4px_0_0_#e6a600]',
    iconColor: 'white',
    nama: 'Prestasi Siswa',
    kode: 'prestasi_siswa',
    desc: 'Capaian siswa di kompetisi resmi dengan tingkat wilayah.',
    fields: ['Nama Penghargaan/Prestasi', 'Nama Institusi Penerbit', 'Nama Siswa', 'Tingkat Wilayah', 'Link Bukti Fisik', 'Catatan Tambahan'],
    hitung: 'Σ(Jumlah per tingkat × Bobot tingkat)',
    badge: 'per tingkat x bobot',
  },
  {
    no: '05',
    icon: Student,
    iconBg: 'bg-white border-[#b8eb8a]',
    iconColor: '#58cc02',
    nama: 'Jumlah Tenaga Pendidik Lulus Jenjang Lanjutan',
    kode: 'lulus_jenjang_lanjutan',
    desc: 'Jumlah guru lulus S1/S2/S3 dengan bobot berbeda per jenjang.',
    fields: ['Jenjang Pendidikan (S1/S2/S3)', 'Jumlah ASN', 'Link Bukti Fisik', 'Catatan Tambahan'],
    hitung: 'Σ(Jumlah × Bobot per jenjang)',
    jenjang: ['S1', 'S2 x1.5', 'S3 x2'],
    cardBg: 'bg-story',
  },
  {
    no: '06',
    icon: ChartLineUp,
    iconBg: 'bg-ink border-black',
    iconColor: 'white',
    nama: 'Rapor Rata-rata Murid >85',
    kode: 'rapor_rata_rata',
    desc: 'Persentase siswa dengan nilai rapor rata-rata di atas 85.',
    fields: ['Jumlah Siswa >85 (format X dari Y = Z%)', 'Link Bukti Fisik', 'Catatan Tambahan'],
    hitung: 'Persentase × Bobot',
    badge: 'persentase x bobot',
  },
  {
    no: '07',
    icon: PaperPlaneTilt,
    iconBg: 'bg-[#ffe4e6] border-[#fecdd3]',
    iconColor: '#e11d48',
    nama: 'Siswa Lanjutan Unggulan',
    kode: 'siswa_lanjutan_unggulan',
    desc: 'Lulusan diterima di universitas/sekolah unggulan.',
    fields: ['Nama Universitas/Sekolah Unggulan', 'Nama Siswa', 'Link Bukti Fisik', 'Catatan Tambahan'],
    hitung: 'Jumlah Approved × Bobot',
    badge: 'per capaian x bobot',
  },
  {
    no: '08',
    icon: Lightbulb,
    iconBg: 'bg-[#fef9c3] border-[#fde68a]',
    iconColor: '#ca8a04',
    nama: 'Giat Inovatif',
    kode: 'giat_inovatif',
    desc: 'Kegiatan inovatif madrasah yang terdokumentasi dan berdampak.',
    fields: ['Nama Giat Inovatif', 'Link Bukti Fisik', 'Catatan Tambahan'],
    hitung: 'Jumlah Approved × Bobot',
    badge: 'per giat x bobot',
  },
  {
    no: '09',
    icon: UsersThree,
    iconBg: 'bg-[#e0e7ff] border-[#c7d2fe]',
    iconColor: '#4f46e5',
    nama: 'Rasio Penerimaan',
    kode: 'rasio_penerimaan',
    desc: 'Daya tarik madrasah dari pendaftar dibanding daya tampung.',
    fields: ['Siswa Diterima dari Pendaftar (X dari Y = Z%)', 'Link Bukti Fisik', 'Catatan Tambahan'],
    hitung: 'Persentase × Bobot',
    badge: 'persentase x bobot',
    badgeTone: 'bg-[#e0e7ff] border-[#c7d2fe] text-[#4f46e5]',
  },
];

export default function IndikatorDetailSection() {
  return (
    <section className="py-10 lg:py-14 bg-transparent border-y-2 border-zinc-100">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-6">
        <div className="max-w-[760px]">
          <div className="inline-flex items-center gap-2 h-7 px-3 rounded-full bg-story border-2 border-[#b8eb8a] text-[11px] font-black text-eager-dark">
            <Stack size={14} weight="fill" color="#4caf00" /> {INDIKATORS.length} Indikator Mutu — versi lengkap
          </div>
          <h2 className="font-display font-black tracking-[-0.02em] text-[28px] lg:text-[36px] leading-none text-charcoal mt-4">Apa yang dinilai & bagaimana skor dihitung</h2>
          <p className="text-[13px] leading-6 text-pencil font-medium mt-3 max-w-[68ch]">
            Di bawah ini daftar lengkap {INDIKATORS.length} indikator (PRD §11). Tiap baris capaian diinput per indikator dengan field sesuai tabel, dilengkapi link bukti, dan
            dihitung <b>tanpa batas jumlah</b>. Bobot dikonfigurasi Admin per periode dan terkunci saat finalisasi.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 stagger">
          {DETAILS.map((it) => {
            const Icon = it.icon;
            return (
              <article key={it.kode} className={`group relative rounded-[16px] border-2 border-zinc-200 p-5 hover:shadow-card transition ${it.cardBg || 'bg-white'} ${it.kode === 'diklat' ? 'lg:col-span-2' : ''}`}>
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-story border-2 border-[#b8eb8a] flex items-center justify-center text-[11px] font-black text-eager-dark">
                  {it.no}
                </div>
                <div className={`w-11 h-11 rounded-[12px] border-2 flex items-center justify-center group-hover:rotate-3 transition ${it.iconBg}`}>
                  <Icon size={20} weight="fill" color={it.iconColor} />
                </div>
                <h3 className="font-display font-black text-[15px] text-charcoal mt-4 leading-tight pr-8">{it.nama}</h3>
                <div className="text-[11px] font-bold text-pencil mt-1 font-mono">{it.kode}</div>
                <p className="text-[12px] leading-5 text-pencil font-medium mt-2">{it.desc}</p>

                {/* field list */}
                <div className="mt-3">
                  <div className="text-[11px] font-black tracking-wide text-faded uppercase">Field input</div>
                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {it.fields.map((f) => (
                      <li key={f} className="text-[11px] font-bold bg-white border border-zinc-200 rounded-full px-2.5 py-1">
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* cara hitung */}
                <div className="mt-4 rounded-[12px] bg-white border-2 border-zinc-100 p-3">
                  <div className="text-[11px] font-black tracking-wide text-faded uppercase flex items-center gap-1">
                    <Calculator size={12} weight="regular" color="#afafaf" /> Cara hitung
                  </div>
                  <div className="text-[12px] font-black text-charcoal mt-1">{it.hitung}</div>
                  {it.badge && (
                    <span className={`mt-2 inline-flex h-6 px-2.5 rounded-full border-2 text-[11px] font-black ${it.badgeTone || 'bg-zinc-50 border-zinc-200 text-charcoal'}`}>
                      {it.badge}
                    </span>
                  )}
                  {it.badges && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {it.badges.map((b, idx) => (
                        <span key={b} className={`h-6 px-2 rounded-full border-2 text-[11px] font-black ${idx === 2 ? 'bg-eager text-white border-eager-dark' : 'bg-white border-zinc-200'}`}>
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                  {it.jenjang && (
                    <div className="mt-2 flex gap-1.5">
                      {it.jenjang.map((j, idx) => (
                        <span key={j} className={`flex-1 h-7 rounded-full border-2 flex items-center justify-center text-[11px] font-black ${idx === 2 ? 'bg-eager text-white border-eager-dark' : 'bg-white border-zinc-200'}`}>
                          {j}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-6 rounded-[12px] bg-zinc-50 border-2 border-zinc-200 p-4 flex items-start gap-2">
          <Info size={16} weight="regular" color="#1cb0f6" className="mt-0.5 shrink-0" />
          <p className="text-[12px] leading-5 font-medium text-pencil">
            <b className="text-charcoal">Catatan PRD:</b> Tidak ada skor maksimum. Semua indikator diakumulasi, lalu dijumlah menjadi total skor. Bobot memiliki histori per
            periode dan terkunci setelah finalisasi. Untuk detail bobot per periode, lihat halaman Bobot Penilaian (admin).
          </p>
        </div>
      </div>
    </section>
  );
}

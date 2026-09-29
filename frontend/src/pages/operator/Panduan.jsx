import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UserPlus, ShieldCheck, SignIn, FolderOpen, Table, PaperPlaneTilt, Trophy, PlusCircle,
  CaretDown, CaretRight, Info, Question, CheckCircle, Lightbulb, ArrowRight, DownloadSimple,
} from 'phosphor-react';
import StatusBadge from '../../components/shared/StatusBadge';
import PeriodeCutoffChip from '../../components/operator/PeriodeCutoffChip';
import { INDIKATORS, INDIKATOR_FIELDS } from '../../constants/indikator';
import { useOperator } from '../../context/OperatorContext';
import { deriveStatusClient, formatTanggal, countdownText } from '../../lib/periode';

/**
 * Panduan — halaman statis (tanpa API) berisi alur pengisian data lengkap
 * bagi Operator Madrasah, mulai dari pendaftaran akun hingga pemantauan ranking.
 * Ringkasan indikator dirender dari INDIKATORS + INDIKATOR_FIELDS (satu sumber kebenaran).
 */

const STEPS = [
  {
    icon: UserPlus,
    title: 'Daftar akun Operator',
    link: { to: '/daftar', label: 'Buka halaman pendaftaran' },
    body: (
      <>
        <p>
          Buka halaman <b>Pendaftaran</b> dan lengkapi dua bagian berikut:
        </p>
        <ul className="mt-2 space-y-1 list-disc pl-5">
          <li><b>Data Akun</b> — email (dipakai sebagai identitas login), nama lengkap, No. Telepon/WhatsApp, password minimal 8 karakter beserta konfirmasinya.</li>
          <li><b>Data Madrasah</b> — nama madrasah, alamat, jumlah siswa, jenjang (MI/MTs/MA), dan status (Negeri/Swasta).</li>
        </ul>
        <p className="mt-2">
          Centang pernyataan persetujuan, lalu klik tombol <b>Daftar</b>.
        </p>
      </>
    ),
  },
  {
    icon: ShieldCheck,
    title: 'Tunggu persetujuan Admin',
    body: (
      <>
        <p>
          Akun baru berstatus <b>menunggu_persetujuan</b> dan belum bisa login. Admin Kemenag akan memverifikasi data madrasah Anda.
        </p>
        <p className="mt-2">
          Setelah disetujui, muncul notifikasi <b>&ldquo;Akun disetujui&rdquo;</b> dan madrasah Anda mendapat <b>BMU ID</b> yang aktif.
        </p>
      </>
    ),
  },
  {
    icon: SignIn,
    title: 'Login & cek profil madrasah',
    link: { to: '/login', label: 'Login dengan email & password' },
    body: (
      <>
        <p>
          Login dengan email dan password Anda, lalu periksa halaman <b>Profil Madrasah</b>.
        </p>
        <ul className="mt-2 space-y-1 list-disc pl-5">
          <li>Yang bisa diedit: <b>nama madrasah</b>, <b>alamat</b>, dan <b>jumlah siswa</b>.</li>
          <li><b>Kelompok</b> (mis. MI Negeri) dan <b>status</b> madrasah terkunci — mengikuti data pendaftaran.</li>
        </ul>
      </>
    ),
  },
  {
    icon: FolderOpen,
    title: 'Siapkan bukti fisik tahun berjalan',
    body: (
      <>
        <p>
          Setiap capaian wajib punya <b>link bukti fisik tahun berjalan</b> yang bisa diakses Admin.
        </p>
        <ul className="mt-2 space-y-1 list-disc pl-5">
          <li>Simpan file (sertifikat, sk, screenshot, laporan) di Google Drive/cloud lain.</li>
          <li>Setel izin akses <b>&ldquo;Anyone with the link&rdquo;</b> — link privat akan ditolak.</li>
          <li>Link harus berformat <b>http(s)</b>, contoh: <span className="font-mono">https://drive.google.com/...</span></li>
        </ul>
      </>
    ),
  },
  {
    icon: Table,
    title: 'Input capaian per indikator',
    link: { to: '/operator/input', label: 'Menuju halaman Input Capaian' },
    body: (
      <>
        <p>
          Di halaman <b>Input Capaian</b> tersedia <b>9 tab indikator</b>. Untuk tiap indikator:
        </p>
        <ul className="mt-2 space-y-1 list-disc pl-5">
          <li>Klik <b>Tambah Baris Baru</b>, lalu isi semua field wajib (bertanda *).</li>
          <li>Tidak ada batas jumlah baris — isi sebanyak kegiatan nyata madrasah.</li>
          <li>Klik <b>Simpan Draft</b> untuk menyimpan sementara, atau langsung <b>Kirim untuk Validasi</b>.</li>
        </ul>
        <p className="mt-2">
          Rincian field setiap indikator ada di bagian <a href="#ringkasan-indikator" className="font-black text-spark hover:underline">Ringkasan 9 Indikator</a> di bawah.
        </p>
      </>
    ),
  },
  {
    icon: PaperPlaneTilt,
    title: 'Kirim & validasi Admin',
    link: { to: '/operator/riwayat', label: 'Pantau status di Riwayat' },
    body: (
      <>
        <p>
          Data yang dikirim masuk antrian validasi Admin dengan status <b>Menunggu</b>, lalu menjadi:
        </p>
        <ul className="mt-2 space-y-1 list-disc pl-5">
          <li><b>Disetujui</b> — skor langsung masuk perhitungan ranking.</li>
          <li><b>Ditolak</b> — Admin wajib memberi alasan. Buka halaman <b>Riwayat</b>, edit baris tersebut, lalu <b>Simpan &amp; Kirim Ulang</b> (ID baris tetap sama).</li>
        </ul>
      </>
    ),
  },
  {
    icon: Trophy,
    title: 'Pantau skor & ranking',
    link: { to: '/operator', label: 'Lihat Dashboard Operator' },
    body: (
      <>
        <p>
          Dashboard Operator menampilkan <b>skor dan ranking real-time</b> sesuai kelompok madrasah. Papan peringkat publik bisa dilihat semua orang di halaman <Link to="/leaderboard" className="font-black text-spark hover:underline">Leaderboard</Link>.
        </p>
        <p className="mt-2">
          Ada data <b>Disetujui</b> yang keliru? Ajukan penghapusan lewat halaman <Link to="/operator/hapus-data" className="font-black text-spark hover:underline">Hapus Data</Link> — menunggu persetujuan Admin, dan skor dihitung ulang otomatis.
        </p>
      </>
    ),
  },
];

const STATUS_LEGEND = [
  { status: 'Draft', desc: 'Tersimpan tapi belum dikirim. Tidak masuk skor dan masih bisa diedit/dihapus sendiri kapan saja.' },
  { status: 'Menunggu', desc: 'Sudah dikirim dan masuk antrian validasi Admin. Belum bisa diedit sampai ada keputusan.' },
  { status: 'Disetujui', desc: 'Tervalidasi Admin — masuk perhitungan skor & ranking. Hanya bisa dihapus melalui permintaan hapus yang disetujui Admin.' },
  { status: 'Ditolak', desc: 'Ditolak Admin dengan alasan yang wajib dicantumkan. Perbaiki datanya di halaman Riwayat, lalu kirim ulang.' },
];

const FAQS = [
  {
    q: 'Apakah ada batas jumlah data yang bisa diinput?',
    a: 'Tidak ada. Tambah baris sebanyak kegiatan nyata madrasah Anda — setiap baris memiliki link bukti fisiknya sendiri. Semakin banyak capaian valid, semakin besar peluang skor.',
  },
  {
    q: 'Bukti saya ditolak, biasanya kenapa?',
    a: 'Penyebab paling umum: link belum publik (belum "Anyone with the link"), bukti bukan dari tahun berjalan, isi bukti tidak sesuai indikator, atau file tidak bisa dibuka Admin. Perbaiki lalu kirim ulang dari halaman Riwayat — ID baris tetap sama.',
  },
  {
    q: 'Apakah skor saya bisa turun setelah Disetujui?',
    a: 'Bisa. Admin dapat mencabut persetujuan (revoke) jika bukti terbukti tidak valid, dan data Disetujui bisa dihapus melalui permintaan hapus yang disetujui Admin. Skor dan ranking dihitung ulang otomatis.',
  },
  {
    q: 'Kapan batas waktu (cut-off) input capaian? Kenapa saya tidak bisa submit atau edit data?',
    // DINAMIS — dihitung dari periode aktif via OperatorContext (faqCutoffAnswer di bawah)
    a: faqCutoffAnswer,
  },
  {
    q: 'Lapor ke siapa jika mengalami kendala?',
    a: 'Hubungi Seksi Pembinaan Madrasah (Pendma) Kemenag Kab. Pasuruan — kontak tersedia di footer halaman. Sertakan BMU ID madrasah dan tangkapan layar kendala agar lebih cepat ditangani.',
  },
];

/**
 * Jawaban FAQ cut-off — DINAMIS dari periode aktif (OperatorContext, single-flight).
 * Deklarasi function di-hoist sehingga aman direferensikan array FAQS di atas.
 */
function faqCutoffAnswer(periode) {
  const st = deriveStatusClient(periode);
  const tgl = periode?.tanggalCutoff ? formatTanggal(periode.tanggalCutoff) : null;
  const sisa = st === 'aktif' && periode?.tanggalCutoff ? countdownText(periode.tanggalCutoff) : null;
  if (!periode || !st) {
    return 'Saat ini belum ada periode penilaian aktif, sehingga input belum bisa dilakukan. Pantau notifikasi atau hubungi Seksi Pendma untuk informasi pembukaan periode baru.';
  }
  if (st === 'aktif') {
    return `Periode ${periode.namaPeriode || '-'} sedang berjalan dan ditutup pada ${tgl || '-'}${sisa ? ` (${sisa})` : ''}. Setelah cut-off, input, edit, dan kirim ulang otomatis terkunci — pastikan semua capaian dikirim sebelum tanggal tersebut.`;
  }
  if (st === 'belum_dimulai') {
    return `Periode ${periode.namaPeriode || '-'} akan dimulai ${periode.tanggalMulai ? formatTanggal(periode.tanggalMulai) : '-'} dan ditutup ${tgl || '-'}. Input capaian bisa dilakukan setelah periode dimulai.`;
  }
  return `Periode penilaian sudah ditutup${tgl ? ` (cut-off ${tgl})` : ''}${st === 'finalisasi' ? ' dan difinalisasi' : ''} oleh Admin. Setelah periode dikunci, data tidak bisa diubah sampai periode baru dibuka.`;
}

/** Hint singkat tipe field untuk ringkasan indikator. */
function fieldHint(f) {
  if (f.type === 'ratio') return `${f.pembilangLabel} ÷ ${penyebutLabelSafe(f)} (%)`;
  if (f.type === 'select') return (f.options || []).map((o) => o.label).join(' / ');
  if (f.type === 'textarea') return 'teks panjang';
  if (f.type === 'number') return 'angka';
  return 'teks';
}

function penyebutLabelSafe(f) {
  return f.penyebutLabel || 'Penyebut';
}

/**
 * Accordion sederhana — satu item terbuka pada satu waktu.
 * Konten SELALU ada di DOM (hidden di layar, print:block saat cetak)
 * agar jawaban ikut tercetak saat "Unduh PDF" meski accordion tertutup.
 */
function AccordionItem({ open, onToggle, header, children }) {
  return (
    <div className="rounded-[12px] border-2 border-zinc-200 bg-white overflow-hidden print:break-inside-avoid">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 transition"
        aria-expanded={open}
      >
        <span className="flex-1 min-w-0">{header}</span>
        <CaretDown size={16} weight="bold" color="#afafaf" className={`shrink-0 transition-transform print:hidden ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`px-4 pb-4 pt-0 border-t-2 border-zinc-100 ${open ? '' : 'hidden print:block'}`}>{children}</div>
    </div>
  );
}

export default function Panduan() {
  const [openIndikator, setOpenIndikator] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  // Periode aktif dari OperatorContext — single-flight GET /api/operator/indikator
  const { periode } = useOperator();
  const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  /** Unduh PDF → dialog cetak browser (pilih "Save as PDF"). Judul dokumen diset sementara agar nama file PDF bawaan rapi. */
  const handleUnduhPdf = () => {
    const prevTitle = document.title;
    document.title = 'Panduan Pengisian BIMA UNGGUL — Operator Madrasah';
    try {
      window.print();
    } finally {
      document.title = prevTitle;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black text-charcoal print:hidden">
            <Question size={14} weight="bold" /> Panduan
          </div>
          <button
            onClick={handleUnduhPdf}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-white border-2 border-zinc-200 text-[12px] font-black text-charcoal hover:border-charcoal transition print:hidden"
          >
            <DownloadSimple size={14} weight="bold" /> Unduh PDF
          </button>
        </div>
        <h1 className="font-display font-black tracking-[-0.02em] text-[20px] lg:text-[24px] leading-none text-charcoal mt-3">
          Panduan Pengisian BIMA UNGGUL
        </h1>
        <p className="text-[12px] leading-5 font-medium text-pencil mt-2 max-w-[68ch]">
          Alur pengisian data bagi <b>Operator Madrasah</b> — mulai dari pendaftaran akun hingga pemantauan skor dan ranking madrasah Anda.
        </p>
        <p className="hidden print:block text-[11px] font-bold text-faded mt-1.5">
          Kementerian Agama Kabupaten Pasuruan • Periode {periode?.namaPeriode || '2026/2027'} • Dicetak {printDate}
        </p>
      </div>

      {/* Stepper 7 langkah */}
      <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-5 shadow-card">
        <h2 className="font-display font-black text-[14px] text-charcoal flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-eager border-2 border-eager-dark shadow-sticker flex items-center justify-center text-white">
            <CheckCircle size={14} weight="fill" color="white" />
          </span>
          Alur Pengisian — 7 Langkah
        </h2>
        <div className="mt-5">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-eager border-2 border-eager-dark shadow-sticker flex items-center justify-center text-white font-black text-[14px] shrink-0">
                    {i + 1}
                  </div>
                  {i < STEPS.length - 1 && <div className="w-0.5 flex-1 bg-zinc-200 my-1" />}
                </div>
                <div className="pb-6 flex-1 min-w-0">
                  <div className="rounded-[12px] border-2 border-zinc-200 bg-white p-4 print:break-inside-avoid">
                    <div className="flex items-center gap-2">
                      <Icon size={16} weight="regular" color="#1cb0f6" className="shrink-0" />
                      <h3 className="text-[14px] font-black text-charcoal leading-tight">{s.title}</h3>
                    </div>
                    <div className="mt-2 text-[12px] leading-5 font-medium text-pencil [&_b]:text-charcoal [&_b]:font-black">{s.body}</div>
                    {s.link && (
                      <Link
                        to={s.link.to}
                        className="mt-3 inline-flex items-center gap-1 h-7 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black text-charcoal hover:border-charcoal transition print:hidden"
                      >
                        {s.link.label} <CaretRight size={10} weight="bold" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ringkasan 9 indikator */}
      <div id="ringkasan-indikator" className="rounded-[16px] border-2 border-zinc-200 bg-white p-5 shadow-card scroll-mt-4">
        <h2 className="font-display font-black text-[14px] text-charcoal flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center">
            <Table size={16} weight="regular" color="#777777" />
          </span>
          Ringkasan 9 Indikator &amp; Field Lampiran
        </h2>
        <p className="text-[12px] font-medium text-pencil mt-1.5">
          Klik indikator untuk melihat field yang harus diisi. Tanda <span className="text-red-500 font-black">*</span> berarti wajib diisi.
        </p>
        <div className="mt-4 space-y-2">
          {INDIKATORS.map((ind, i) => {
            const fields = INDIKATOR_FIELDS[ind.kode] || [];
            const open = openIndikator === ind.kode;
            return (
              <AccordionItem
                key={ind.kode}
                open={open}
                onToggle={() => setOpenIndikator(open ? null : ind.kode)}
                header={
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-zinc-50 border-2 border-zinc-200 flex items-center justify-center text-[10px] font-black text-charcoal shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-[13px] font-black text-charcoal leading-tight">{ind.nama}</span>
                  </span>
                }
              >
                <ul className="mt-3 space-y-2">
                  {fields.map((f) => (
                    <li key={f.key} className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-[12px] font-black text-charcoal">
                        {f.label}
                        {f.required && <span className="text-red-500"> *</span>}
                      </span>
                      <span className="text-[11px] font-bold text-faded">({fieldHint(f)})</span>
                      {f.help && <span className="w-full text-[11px] font-medium text-pencil">{f.help}</span>}
                    </li>
                  ))}
                </ul>
              </AccordionItem>
            );
          })}
        </div>
      </div>

      {/* Legenda status */}
      <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-5 shadow-card">
        <h2 className="font-display font-black text-[14px] text-charcoal flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center">
            <Info size={16} weight="regular" color="#777777" />
          </span>
          Status Capaian &amp; Artinya
        </h2>
        <div className="mt-4 space-y-2">
          {STATUS_LEGEND.map((row) => (
            <div key={row.status} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3 print:break-inside-avoid">
              <StatusBadge status={row.status} size="sm" className="shrink-0 w-fit" />
              <p className="text-[12px] leading-5 font-medium text-pencil flex-1">{row.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-5 shadow-card">
        <h2 className="font-display font-black text-[14px] text-charcoal flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center">
            <Question size={16} weight="regular" color="#777777" />
          </span>
          Pertanyaan yang Sering Diajukan
        </h2>

        {/* Info periode aktif & cut-off — LIVE dari OperatorContext (ikut tercetak di PDF) */}
        {periode && (
          <div className="mt-4 rounded-[12px] bg-zinc-50 border-2 border-zinc-100 px-4 py-3 flex flex-wrap items-center gap-2 print:break-inside-avoid">
            <span className="text-[12px] font-bold text-pencil">Batas akhir input capaian:</span>
            <PeriodeCutoffChip periode={periode} />
          </div>
        )}

        <div className="mt-4 space-y-2">
          {FAQS.map((f) => {
            const open = openFaq === f.q;
            const jawaban = typeof f.a === 'function' ? f.a(periode) : f.a;
            return (
              <AccordionItem
                key={f.q}
                open={open}
                onToggle={() => setOpenFaq(open ? null : f.q)}
                header={<span className="text-[13px] font-black text-charcoal leading-tight">{f.q}</span>}
              >
                <p className="mt-3 text-[12px] leading-5 font-medium text-pencil">{jawaban}</p>
              </AccordionItem>
            );
          })}
        </div>
      </div>

      {/* CTA penutup — disembunyikan saat cetak, diganti baris kontak di bawah */}
      <div className="rounded-[16px] border-2 border-eager-dark bg-story p-5 shadow-card flex flex-col sm:flex-row sm:items-center gap-4 print:hidden">
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-black text-[16px] text-charcoal flex items-center gap-2">
            <Lightbulb size={18} weight="fill" color="#58cc02" />
            Siap mengisi capaian madrasah Anda?
          </h2>
          <p className="text-[12px] leading-5 font-medium text-pencil mt-1.5">
            Butuh bantuan? Hubungi <b>Seksi Pendma Kemenag Kab. Pasuruan</b> — kontak tersedia di footer halaman.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/operator/input"
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[12px] bg-eager border-2 border-eager-dark text-white font-black text-[13px] shadow-sticker hover:brightness-[1.03] active:translate-y-[2px] active:shadow-none transition"
          >
            <PlusCircle size={16} weight="bold" color="white" /> Mulai Input Capaian <ArrowRight size={14} weight="bold" color="white" />
          </Link>
        </div>
      </div>

      {/* Baris kontak khusus versi cetak (pengganti CTA) */}
      <div className="hidden print:block pt-3 border-t-2 border-zinc-200 text-[11px] font-medium text-pencil">
        Butuh bantuan? Hubungi <b>Seksi Pendma Kemenag Kabupaten Pasuruan</b> — sertakan BMU ID madrasah Anda.
      </div>
    </div>
  );
}

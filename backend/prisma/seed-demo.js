/**
 * Seed Data Demo — BIMA UNGGUL (roadmap catatan.md #5)
 * Isi: 39 madrasah KAB. PASURUAN (data riil nama/lokasi dari daftarsekolah.net,
 * annibuku.com, kemenag jatim — 2026-08-30), 6 kelompok, bobot bervariasi,
 * submission + validasi + skor live-compute — SEMUA di periode target
 * yang SUDAH ADA (TARGET_PERIODE, default '2026/2027').
 *
 * Penting (keputusan user 2026-08-30): seed TIDAK membuat periode baru —
 * periode target harus sudah dibuat via UI (atau migration). Dengan begitu
 * guard "satu periode aktif" tidak pernah dilanggar oleh seed.
 *
 * Cakupan per jenjang (min. 10 peringkat):
 *   MI: 2 negeri + 10 swasta = 12 · MTs: 4 negeri + 10 swasta = 14
 *   MA: 3 negeri + 10 swasta = 13
 *  grup negeri se-realita Kab. Pasuruan (MIN 2, MTsN 4, MAN 3).
 *
 * Idempoten: upsert by nomorMadrasah; submission hanya dibuat bila periode
 * target belum punya submission; bobot di-upsert ke nilai varian demo
 * (nilai di periode target adalah data demo dev — bukan set riil admin).
 * Run: node prisma/seed-demo.js | JANGAN di produksi.
 */
import { PrismaClient } from '@prisma/client';
import { recordAuditLog } from '../src/services/auditService.js';

const prisma = new PrismaClient();

// Periode target — periode RIIL aktif di DB dev (user sengaja menghapus DEMO/2026).
const TARGET_PERIODE = '2026/2027';

const MADRASAH_DEMO = [
  // ===================== MI NEGERI (2) =====================
  { nomorMadrasah: 'BMU-950101', namaMadrasah: 'MIN 1 Pasuruan', jenjang: 'MI', statusKepemilikan: 'Negeri', jumlahSiswa: 240, alamat: 'Jl. Hasan Munadi Banggle Gunung Gangsir, Kec. Beji' },
  { nomorMadrasah: 'BMU-950102', namaMadrasah: 'MIN 2 Pasuruan', jenjang: 'MI', statusKepemilikan: 'Negeri', jumlahSiswa: 320, alamat: 'Jl. Perempatan 19 Bulusari, Kec. Gempol' },
  // ===================== MI SWASTA (10) =====================
  { nomorMadrasah: 'BMU-950111', namaMadrasah: 'MIS Persis Bangil', jenjang: 'MI', statusKepemilikan: 'Swasta', jumlahSiswa: 180, alamat: 'Jl. Pattimura 183 Pogar, Kec. Bangil' },
  { nomorMadrasah: 'BMU-950112', namaMadrasah: 'MIS Abdussalam', jenjang: 'MI', statusKepemilikan: 'Swasta', jumlahSiswa: 150, alamat: 'Jl. Kalisari 3 Bekacak, Kec. Bangil' },
  { nomorMadrasah: 'BMU-950113', namaMadrasah: 'MIS Darullughah Wadda\'wah', jenjang: 'MI', statusKepemilikan: 'Swasta', jumlahSiswa: 220, alamat: 'Jl. Raya Raci 51 Raci, Kec. Bangil' },
  { nomorMadrasah: 'BMU-950114', namaMadrasah: 'MIS Miftahul Anwar', jenjang: 'MI', statusKepemilikan: 'Swasta', jumlahSiswa: 130, alamat: 'Jl. Bader 15 Kalianyar, Kec. Bangil' },
  { nomorMadrasah: 'BMU-950115', namaMadrasah: 'MIS Riyadlul Ulum', jenjang: 'MI', statusKepemilikan: 'Swasta', jumlahSiswa: 120, alamat: 'Jl. Salak 405 Kidul Dalem, Kec. Bangil' },
  { nomorMadrasah: 'BMU-950116', namaMadrasah: 'MIS NU Miftahul Ulum Tunggulwulung', jenjang: 'MI', statusKepemilikan: 'Swasta', jumlahSiswa: 160, alamat: 'Dusun Rejoso Tunggul Wulung, Kec. Pandaan' },
  { nomorMadrasah: 'BMU-950117', namaMadrasah: 'MIS Maarif NU Durensewu', jenjang: 'MI', statusKepemilikan: 'Swasta', jumlahSiswa: 140, alamat: 'Jl. Mendalan Durensewu, Kec. Pandaan' },
  { nomorMadrasah: 'BMU-950118', namaMadrasah: 'MIS NU Thohiriyah Wedoro', jenjang: 'MI', statusKepemilikan: 'Swasta', jumlahSiswa: 110, alamat: 'Dusun Wedoro, Kec. Pandaan' },
  { nomorMadrasah: 'BMU-950119', namaMadrasah: 'MIS Darul Ulum II', jenjang: 'MI', statusKepemilikan: 'Swasta', jumlahSiswa: 95, alamat: 'Jl. Barat Sungai 39 Kalisat, Kec. Rembang' },
  { nomorMadrasah: 'BMU-950120', namaMadrasah: 'MIS Ma\'arif Kraton', jenjang: 'MI', statusKepemilikan: 'Swasta', jumlahSiswa: 105, alamat: 'Kec. Kraton' },
  // ===================== MTS NEGERI (4) =====================
  { nomorMadrasah: 'BMU-950201', namaMadrasah: 'MTsN 1 Pasuruan', jenjang: 'MTs', statusKepemilikan: 'Negeri', jumlahSiswa: 520, alamat: 'Jl. Bader No.1 Kalirejo, Kec. Bangil' },
  { nomorMadrasah: 'BMU-950202', namaMadrasah: 'MTsN 2 Pasuruan', jenjang: 'MTs', statusKepemilikan: 'Negeri', jumlahSiswa: 480, alamat: 'Jl. Urip Sumoharjo, Kec. Pandaan' },
  { nomorMadrasah: 'BMU-950203', namaMadrasah: 'MTsN 3 Pasuruan', jenjang: 'MTs', statusKepemilikan: 'Negeri', jumlahSiswa: 300, alamat: 'Jl. Trawas Lumbangrejo, Kec. Prigen' },
  { nomorMadrasah: 'BMU-950204', namaMadrasah: 'MTsN Pohjentrek', jenjang: 'MTs', statusKepemilikan: 'Negeri', jumlahSiswa: 260, alamat: 'Kec. Pohjentrek' },
  // ===================== MTS SWASTA (10) =====================
  { nomorMadrasah: 'BMU-950211', namaMadrasah: 'MTsS Al Hikmah Bangil', jenjang: 'MTs', statusKepemilikan: 'Swasta', jumlahSiswa: 210, alamat: 'Jl. Plaosan 725 Kersikan, Kec. Bangil' },
  { nomorMadrasah: 'BMU-950212', namaMadrasah: 'MTS Assa Diyah Bangil', jenjang: 'MTs', statusKepemilikan: 'Swasta', jumlahSiswa: 190, alamat: 'Jl. Supriyadi 173 Pogar, Kec. Bangil' },
  { nomorMadrasah: 'BMU-950213', namaMadrasah: 'MTsS Ma\'arif Bangil', jenjang: 'MTs', statusKepemilikan: 'Swasta', jumlahSiswa: 170, alamat: 'Jl. Jeruk 578 Kidul Dalem, Kec. Bangil' },
  { nomorMadrasah: 'BMU-950214', namaMadrasah: 'MTS Salafiyah 2', jenjang: 'MTs', statusKepemilikan: 'Swasta', jumlahSiswa: 160, alamat: 'Jl. Musing 637A Kauman, Kec. Bangil' },
  { nomorMadrasah: 'BMU-950215', namaMadrasah: 'MTsS Persis 1', jenjang: 'MTs', statusKepemilikan: 'Swasta', jumlahSiswa: 230, alamat: 'Jl. Jaksa Agung Suprapto 223 Gempeng, Kec. Bangil' },
  { nomorMadrasah: 'BMU-950216', namaMadrasah: 'MTsS Persis 2', jenjang: 'MTs', statusKepemilikan: 'Swasta', jumlahSiswa: 200, alamat: 'Jl. Pattimura 185 Pogar, Kec. Bangil' },
  { nomorMadrasah: 'BMU-950217', namaMadrasah: 'MTsS KH. A. Wahid Hasyim', jenjang: 'MTs', statusKepemilikan: 'Swasta', jumlahSiswa: 150, alamat: 'Jl. Tongkol 32B, Kec. Bangil' },
  { nomorMadrasah: 'BMU-950218', namaMadrasah: 'MTsS NU At-Thohiriyah', jenjang: 'MTs', statusKepemilikan: 'Swasta', jumlahSiswa: 140, alamat: 'Ketanen, Kec. Bangil' },
  { nomorMadrasah: 'BMU-950219', namaMadrasah: 'MTsS Darul Ulum', jenjang: 'MTs', statusKepemilikan: 'Swasta', jumlahSiswa: 180, alamat: 'Jl. Cucut 145 Bendo Mungal, Kec. Bangil' },
  { nomorMadrasah: 'BMU-950220', namaMadrasah: 'MTsS Salafiyah', jenjang: 'MTs', statusKepemilikan: 'Swasta', jumlahSiswa: 170, alamat: 'Jl. Kauman 274 Kauman, Kec. Bangil' },
  // ===================== MA NEGERI (3) =====================
  { nomorMadrasah: 'BMU-950301', namaMadrasah: 'MAN 1 Pasuruan', jenjang: 'MA', statusKepemilikan: 'Negeri', jumlahSiswa: 620, alamat: 'Kec. Beji' },
  { nomorMadrasah: 'BMU-950302', namaMadrasah: 'MAN 2 Pasuruan', jenjang: 'MA', statusKepemilikan: 'Negeri', jumlahSiswa: 580, alamat: 'Jl. Ponpes Al-Yasini Ngabar, Kec. Kraton' },
  { nomorMadrasah: 'BMU-950303', namaMadrasah: 'MAN Insan Cendekia Pasuruan', jenjang: 'MA', statusKepemilikan: 'Negeri', jumlahSiswa: 420, alamat: 'Kec. Grati' },
  // ===================== MA SWASTA (10) =====================
  { nomorMadrasah: 'BMU-950311', namaMadrasah: 'MAS Yayasan Tarbiyah Islam Nguling', jenjang: 'MA', statusKepemilikan: 'Swasta', jumlahSiswa: 190, alamat: 'Kec. Nguling' },
  { nomorMadrasah: 'BMU-950312', namaMadrasah: 'MAS Sunan Giri', jenjang: 'MA', statusKepemilikan: 'Swasta', jumlahSiswa: 160, alamat: 'Kec. Lekok' },
  { nomorMadrasah: 'BMU-950313', namaMadrasah: 'MAS Nahdlatul Ulama Lekok', jenjang: 'MA', statusKepemilikan: 'Swasta', jumlahSiswa: 150, alamat: 'Kec. Lekok' },
  { nomorMadrasah: 'BMU-950314', namaMadrasah: 'MAS MINU', jenjang: 'MA', statusKepemilikan: 'Swasta', jumlahSiswa: 170, alamat: 'Kec. Bangil' },
  { nomorMadrasah: 'BMU-950315', namaMadrasah: 'MAS Darul Hikmah', jenjang: 'MA', statusKepemilikan: 'Swasta', jumlahSiswa: 140, alamat: 'Kabupaten Pasuruan' },
  { nomorMadrasah: 'BMU-950316', namaMadrasah: 'MAS Nurul Badri', jenjang: 'MA', statusKepemilikan: 'Swasta', jumlahSiswa: 130, alamat: 'Kabupaten Pasuruan' },
  { nomorMadrasah: 'BMU-950317', namaMadrasah: 'MAS Almasa', jenjang: 'MA', statusKepemilikan: 'Swasta', jumlahSiswa: 165, alamat: 'Kabupaten Pasuruan' },
  { nomorMadrasah: 'BMU-950318', namaMadrasah: 'MAS Ma\'arif An-Nur', jenjang: 'MA', statusKepemilikan: 'Swasta', jumlahSiswa: 145, alamat: 'Kabupaten Pasuruan' },
  { nomorMadrasah: 'BMU-950319', namaMadrasah: 'MAS Ma\'arif Rejoso', jenjang: 'MA', statusKepemilikan: 'Swasta', jumlahSiswa: 155, alamat: 'Kec. Rejoso' },
  { nomorMadrasah: 'BMU-950320', namaMadrasah: 'MAS Asadiyah Kraton', jenjang: 'MA', statusKepemilikan: 'Swasta', jumlahSiswa: 185, alamat: 'Kec. Kraton' },
];

// Bobot bervariasi per indikator (mirip testScoring) — skor demo jadi
// berbeda-beda antar madrasah, leaderboard terasa hidup.
const BOBOT_DEMO = [
  { slug: 'diklat', nilaiBobot: 10 },
  { slug: 'penghargaan_individu', nilaiBobot: 15 },
  { slug: 'penghargaan_institusi', tingkat: { kabupaten: 5, provinsi: 8, nasional: 12, internasional: 20 } },
  { slug: 'prestasi_siswa', tingkat: { kabupaten: 3, provinsi: 6, nasional: 10, internasional: 15 } },
  { slug: 'lulus_jenjang_lanjutan', jenjang: { s1: 2, s2: 4, s3: 8 } },
  { slug: 'rapor_rata_rata', nilaiBobot: 25 },
  { slug: 'siswa_lanjutan_unggulan', nilaiBobot: 20 },
  { slug: 'giat_inovatif', nilaiBobot: 12 },
  { slug: 'rasio_penerimaan', nilaiBobot: 30 },
];

function slugify(nama) {
  return nama.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function resolveTargetPeriode() {
  // Seed TIDAK membuat periode (guard satu-periode-aktif dijaga) — periode
  // target harus sudah dibuat via UI/migration. Cari & pul.
  const periode = await prisma.periodePenilaian.findFirst({ where: { namaPeriode: TARGET_PERIODE } });
  if (!periode) {
    throw new Error(`Periode target '${TARGET_PERIODE}' tidak ditemukan — buat dulu via UI Admin (Manajemen Periode).`);
  }
  return periode;
}

async function main() {
  console.log('🌱 Seed data demo (39 madrasah Kab. Pasuruan)...');

  // 1. Indikator (idempoten — dari seed.js asli)
  const indikators = [
    { kode: '1', slug: 'diklat', nama: 'Diklat Tenaga Pendidik', tipeFormula: 'per_capaian' },
    { kode: '2', slug: 'penghargaan_individu', nama: 'Penghargaan Individu Tenaga Pendidik', tipeFormula: 'per_capaian' },
    { kode: '3', slug: 'penghargaan_institusi', nama: 'Penghargaan Institusi', tipeFormula: 'per_tingkat_wilayah' },
    { kode: '4', slug: 'prestasi_siswa', nama: 'Prestasi Siswa', tipeFormula: 'per_tingkat_wilayah' },
    { kode: '5', slug: 'lulus_jenjang_lanjutan', nama: 'Jumlah Tenaga Pendidik Lulus Jenjang Lanjutan', tipeFormula: 'per_jenjang' },
    { kode: '6', slug: 'rapor_rata_rata', nama: 'Rapor Rata-rata Murid >85', tipeFormula: 'persentase' },
    { kode: '7', slug: 'siswa_lanjutan_unggulan', nama: 'Siswa Lanjutan Unggulan', tipeFormula: 'per_capaian' },
    { kode: '8', slug: 'giat_inovatif', nama: 'Giat Inovatif', tipeFormula: 'per_capaian' },
    { kode: '9', slug: 'rasio_penerimaan', nama: 'Rasio Penerimaan', tipeFormula: 'persentase' },
  ];
  for (const i of indikators) {
    await prisma.indikator.upsert({ where: { slug: i.slug }, update: {}, create: i });
  }
  console.log(`✓ ${indikators.length} indikator siap`);

  // 2. Periode target (existing — seed TIDAK membuat periode)
  const periode = await resolveTargetPeriode();
  console.log(`✓ Periode target ${periode.namaPeriode} (namaPeriode=${periode.namaPeriode})`);

  // 3. Bobot varian demo — upsert per (indikatorId, periodeId); nilai demo dev
  //    menggantikan sisa bobot default lama di periode target (bukan set riil admin).
  const indikatorRows = await prisma.indikator.findMany();
  const bySlug = new Map(indikatorRows.map((i) => [i.slug, i]));
  for (const b of BOBOT_DEMO) {
    const ind = bySlug.get(b.slug);
    if (!ind) continue;
    await prisma.bobotIndikator.upsert({
      where: { indikatorId_periodeId: { indikatorId: ind.id, periodeId: periode.id } },
      update: {
        nilaiBobot: b.nilaiBobot ?? null,
        bobotTingkatWilayah: b.tingkat || null,
        bobotJenjang: b.jenjang || null,
        terkunci: false,
      },
      create: {
        indikatorId: ind.id,
        periodeId: periode.id,
        nilaiBobot: b.nilaiBobot ?? null,
        bobotTingkatWilayah: b.tingkat || null,
        bobotJenjang: b.jenjang || null,
        terkunci: false,
      },
    });
  }
  console.log(`✓ Bobot varian demo di-upsert (${BOBOT_DEMO.length} indikator)`);

  // 4. Madrasah demo (upsert by nomorMadrasah)
  const madrasahList = [];
  for (const m of MADRASAH_DEMO) {
    const row = await prisma.madrasah.upsert({
      where: { nomorMadrasah: m.nomorMadrasah },
      update: {},
      create: {
        ...m,
        slug: `${slugify(m.namaMadrasah)}-${m.nomorMadrasah.slice(-3)}`,
        kelompok: `${m.jenjang} ${m.statusKepemilikan}`,
      },
    });
    madrasahList.push(row);
  }
  console.log(`✓ ${madrasahList.length} madrasah (per jenjang: MI ${madrasahList.filter((x) => x.jenjang === 'MI').length}, MTs ${madrasahList.filter((x) => x.jenjang === 'MTs').length}, MA ${madrasahList.filter((x) => x.jenjang === 'MA').length})`);

  // 5. Submission + validasi + skor (hanya bila periode belum punya submission)
  const sudahAda = await prisma.submissionItem.count({ where: { periodeId: periode.id } });
  if (sudahAda > 0) {
    console.log(`⏭ Submission periode ini sudah ada (${sudahAda}) — lewati pembuatan capaian.`);
  } else {
    const admin = await getAdmin();
    const TINGKAT = ['kabupaten', 'provinsi', 'nasional', 'internasional'];
    const JENJANG = ['s1', 's2', 's3'];
    let n = 0;
    for (const [idx, m] of madrasahList.entries()) {
      const kegajian = 3 + (idx % 4); // 3..6 kegiatan per madrasah
      for (let k = 0; k < kegajian; k++) {
        const ind = indikatorRows[(idx + k) % indikatorRows.length];
        const tahun = periode.tahunCapaian;
        // isi field sesuai tipe formula — supaya skor bervariasi & realistik
        let extra = {};
        if (ind.tipeFormula === 'per_tingkat_wilayah') {
          extra.tingkatWilayah = TINGKAT[(idx + k) % TINGKAT.length];
        } else if (ind.tipeFormula === 'per_jenjang') {
          extra.jenjangPendidikan = JENJANG[(idx + k) % JENJANG.length];
          extra.jumlah = 2 + ((idx + k) % 6);
        } else if (ind.tipeFormula === 'persentase') {
          const pembilang = 3 + ((idx * 7 + k * 11) % 15);
          extra.pembilang = pembilang;
          extra.penyebut = pembilang + (k % 3);
        }

        const item = await prisma.submissionItem.create({
          data: {
            madrasah: { connect: { id: m.id } },
            indikator: { connect: { id: ind.id } },
            periode: { connect: { id: periode.id } },
            createdBy: { connect: { id: admin.id } },
            namaKegiatan: `Kegiatan demo ${k + 1} — ${ind.nama}`,
            linkBukti: 'https://demo.example.com/bukti',
            tahun,
            catatan: 'Data demo otomatis',
            status: 'menunggu',
            ...extra,
          },
        });

        // setengah disetujui langsung biar leaderboard terisi
        if (n % 2 === 0) {
          await prisma.validation.create({
            data: { submissionItemId: item.id, aksi: 'approve', validatorId: admin.id, alasan: null },
          });
          await prisma.submissionItem.update({ where: { id: item.id }, data: { status: 'disetujui' } });
          // Audit konsisten dgn real flow (validationService.approveSubmission) — seed juga tercatat.
          await recordAuditLog(
            {
              userId: admin.id,
              action: 'approve_submission',
              entity: 'SubmissionItem',
              entityId: item.id,
              dataSesudah: { status: 'disetujui' },
              ipAddress: 'seed-demo',
            },
            prisma,
          );
        }
        n++;
      }
    }
    console.log(`✓ ${n} submission demo (${Math.ceil(n / 2)} disetujui)`);
  }

  console.log('🎉 Seed demo selesai. Leaderboard siap.');
}

async function getAdmin() {
  // Deterministik: admin terlama (createdAt asc, tiebreak id) — dulu findFirst tanpa orderBy
  // bisa memilih admin acak bila >1 admin → audit misattribution antar-run.
  const admin = await prisma.user.findFirst({ where: { role: 'admin' }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
  if (!admin) throw new Error('Tidak ada user admin — jalankan scripts/create-dummy-accounts.mjs dulu.');
  return admin;
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

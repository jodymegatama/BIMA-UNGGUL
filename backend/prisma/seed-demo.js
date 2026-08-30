/**
 * Seed Data Demo — BIMA UNGGUL (roadmap catatan.md #5)
 * Isi: 12 madrasah demo (6 kelompok × 2), periode aktif, bobot indikator,
 * submission capaian + validasi + skor — cukup utk leaderboard bergerak.
 *
 * Idempoten: upsert by slug/nomorMadrasah; submission hanya dibuat bila kosong.
 * Run: npm run db:seed   (atau: node prisma/seed-demo.js)
 */
import { PrismaClient } from '@prisma/client';
import { createPeriode } from '../src/services/periodService.js';
import { recordAuditLog } from '../src/services/auditService.js';

const prisma = new PrismaClient();

const MADRASAH_DEMO = [
  { nomorMadrasah: 'BMU-900101', namaMadrasah: 'MIN 1 Pasuruan', jenjang: 'MI', statusKepemilikan: 'Negeri', jumlahSiswa: 240 },
  { nomorMadrasah: 'BMU-900102', namaMadrasah: 'MI Nurul Huda', jenjang: 'MI', statusKepemilikan: 'Swasta', jumlahSiswa: 180 },
  { nomorMadrasah: 'BMU-900201', namaMadrasah: 'MTsN 1 Pasuruan', jenjang: 'MTs', statusKepemilikan: 'Negeri', jumlahSiswa: 320 },
  { nomorMadrasah: 'BMU-900202', namaMadrasah: 'MTs Al-Hikmah', jenjang: 'MTs', statusKepemilikan: 'Swasta', jumlahSiswa: 210 },
  { nomorMadrasah: 'BMU-900301', namaMadrasah: 'MAN 1 Pasuruan', jenjang: 'MA', statusKepemilikan: 'Negeri', jumlahSiswa: 290 },
  { nomorMadrasah: 'BMU-900302', namaMadrasah: 'MA Miftahul Ulum', jenjang: 'MA', statusKepemilikan: 'Swasta', jumlahSiswa: 195 },
];

function slugify(nama) {
  return nama.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function seedPeriode() {
  const tahun = new Date().getFullYear();
  const existing = await prisma.periodePenilaian.findFirst({ where: { namaPeriode: `DEMO/${tahun}` } });
  if (existing) return existing;
  const now = new Date();
  // Route melalui service — agar guard assertNoOverlap (satu periode aktif) tetap berlaku.
  // Kalau window DEMO overlap periode lain, 409 -> seed log & skip (jangan rusak invariant).
  try {
    const admin = await getAdmin();
    return await createPeriode(
      {
        namaPeriode: `DEMO/${tahun}`,
        tanggalMulai: new Date(now.getTime() - 7 * 86400000).toISOString(), // mulai seminggu lalu
        tanggalCutoff: new Date(now.getTime() + 90 * 86400000).toISOString(), // cutoff 90 hari lagi
      },
      // ipAddress 'seed-demo' = marker asal-seed (bukan IP asli) — konsisten dgn convention
      // marker audit di test ('127.0.0.1-e2e'). Audit seed tetap bisa difilter via ipAddress.
      { userId: admin.id, ip: 'seed-demo' },
    );
  } catch (err) {
    if (err?.status === 409) {
      console.log(`⏭  Skipped DEMO/${tahun} — guard overlap: ${err.message}`);
      return existing;
    }
    throw err;
  }
}

async function main() {
  console.log('🌱 Seed data demo...');

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

  // 2. Periode demo aktif
  const periode = await seedPeriode();
  console.log(`✓ Periode ${periode.namaPeriode} (aktif)`);

  // 3. Bobot default per indikator (bila belum ada)
  for (const i of indikators) {
    const ind = await prisma.indikator.findUnique({ where: { slug: i.slug } });
    const ada = await prisma.bobotIndikator.findFirst({ where: { indikatorId: ind.id, periodeId: periode.id } });
    if (!ada) {
      await prisma.bobotIndikator.create({
        data: { indikatorId: ind.id, periodeId: periode.id, nilaiBobot: i.tipeFormula === 'persentase' ? 10 : 10 },
      });
    }
  }
  console.log('✓ Bobot default (10/indikator)');

  // 4. Madrasah demo
  const madrasahList = [];
  for (const m of MADRASAH_DEMO) {
    const row = await prisma.madrasah.upsert({
      where: { nomorMadrasah: m.nomorMadrasah },
      update: {},
      create: {
        ...m,
        alamat: `Jl. Demo No. ${m.nomorMadrasah.slice(-2)}, Pasuruan`,
        slug: `${slugify(m.namaMadrasah)}-${m.nomorMadrasah.slice(-3)}`,
        kelompok: `${m.jenjang} ${m.statusKepemilikan}`,
      },
    });
    madrasahList.push(row);
  }
  console.log(`✓ ${madrasahList.length} madrasah demo`);

  // 5. Submission + validasi + skor (hanya bila periode masih tanpa submission)
  const sudahAda = await prisma.submissionItem.count({ where: { periodeId: periode.id } });
  if (sudahAda > 0) {
    console.log('⏭ Submission periode ini sudah ada — lewati pembuatan capaian.');
  } else {
    const indikatorRows = await prisma.indikator.findMany();
    const admin = await getAdmin();
    let n = 0;
    for (const [idx, m] of madrasahList.entries()) {
      // variasikan kerajinan tiap madrasah supaya skor leaderboard beda-beda
      const kegajian = 2 + (idx % 4); // 2..5 kegiatan per madrasah
      for (let k = 0; k < kegajian; k++) {
        const ind = indikatorRows[(idx + k) % indikatorRows.length];
        const pembilang = 3 + ((idx * 7 + k * 11) % 15);
        const penyebut = pembilang + (k % 3);
        const tahunInt = parseInt(periode.tahunCapaian, 10);
        const item = await prisma.submissionItem.create({
          data: {
            madrasah: { connect: { id: m.id } },
            indikator: { connect: { id: ind.id } },
            periode: { connect: { id: periode.id } },
            createdBy: { connect: { id: admin.id } },
            namaKegiatan: `Kegiatan demo ${k + 1} — ${ind.nama}`,
            jumlah: pembilang,
            pembilang,
            penyebut,
            tahun: tahunInt,
            linkBukti: 'https://demo.example.com/bukti',
            catatan: 'Data demo otomatis',
            status: 'menunggu',
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

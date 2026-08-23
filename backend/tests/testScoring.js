/**
 * Test Scoring Service — BIMA UNGGUL Phase 3
 * Test manual dengan skenario dummy data
 * 
 * Skenario test:
 * 1. Kasus skor "842" (tie dari mock frontend)
 * 2. Tie-breaker 4 level:
 *    - Level 1: Total skor (desc)
 *    - Level 2: Jumlah submission Approved (desc)
 *    - Level 3: Waktu pencapaian (asc) — MAX(Validation.createdAt)
 *    - Level 4: BMU ID (asc)
 * 
 * Run: node tests/testScoring.js
 */

import { prisma } from '../src/db/prisma.js';
import {
  calculateSkorMadrasah,
  calculateRanking,
  recalculateAfterAction,
} from '../src/services/scoringService.js';

// ============================================================================
// HELPER — Cleanup & Setup Dummy Data
// ============================================================================

async function cleanupTestData() {
  // Hapus data test sebelumnya (cascade akan handle relasi)
  await prisma.madrasahScore.deleteMany({});
  await prisma.validation.deleteMany({});
  await prisma.submissionItem.deleteMany({});
  await prisma.bobotIndikator.deleteMany({});
  await prisma.madrasah.deleteMany({ where: { nomorMadrasah: { startsWith: 'BMU-TEST' } } });
  await prisma.periodePenilaian.deleteMany({ where: { namaPeriode: 'TEST/2026' } });
}

async function setupDummyData() {
  console.log('📦 Setting up dummy data...');

  // 1. Create periode
  const periode = await prisma.periodePenilaian.create({
    data: {
      namaPeriode: 'TEST/2026',
      tahunCapaian: 2026,
      tanggalMulai: new Date('2026-01-01'),
      tanggalCutoff: new Date('2026-06-30'),
      status: 'aktif',
    },
  });

  // 2. Ambil indikator yang sudah di-seed
  const indikators = await prisma.indikator.findMany();
  const indikatorMap = new Map();
  for (const i of indikators) {
    indikatorMap.set(i.slug, i);
  }

  // 3. Create bobot per periode
  const bobotData = [
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

  for (const b of bobotData) {
    const indikator = indikatorMap.get(b.slug);
    if (!indikator) continue;

    await prisma.bobotIndikator.create({
      data: {
        indikatorId: indikator.id,
        periodeId: periode.id,
        nilaiBobot: b.nilaiBobot || null,
        bobotTingkatWilayah: b.tingkat || null,
        bobotJenjang: b.jenjang || null,
        terkunci: false,
      },
    });
  }

  // 4. Create admin user (validator)
  const admin = await prisma.user.upsert({
    where: { nip: '19700101199203001' },
    update: {},
    create: {
      nip: '19700101199203001',
      password: '$2b$10$placeholderhashplaceholderhashplaceholder',
      name: 'Test Admin',
      email: 'admin@test.com',
      role: 'admin',
      status: 'aktif',
    },
  });

  return { periode, admin, indikatorMap };
}

/**
 * Create madrasah + submissions + validations untuk skenario tertentu
 */
async function createMadrasahWithSubmissions(config) {
  const {
    nomorMadrasah, nama, kelompok, periodeId, adminId, indikatorMap,
    submissions, // Array of { indikatorSlug, tingkatWilayah?, jenjangPendidikan?, jumlah?, pembilang?, penyebut?, approvedAt }
  } = config;

  const madrasah = await prisma.madrasah.create({
    data: {
      nomorMadrasah,
      namaMadrasah: nama,
      jenjang: kelompok.split(' ')[0],
      statusKepemilikan: kelompok.split(' ')[1],
      jumlahSiswa: 100,
      alamat: 'Alamat Test',
      slug: nama.toLowerCase().replace(/\s+/g, '-'),
      kelompok,
    },
  });

  for (const sub of submissions) {
    const indikator = indikatorMap.get(sub.indikatorSlug);
    if (!indikator) continue;

    const item = await prisma.submissionItem.create({
      data: {
        madrasahId: madrasah.id,
        indikatorId: indikator.id,
        periodeId,
        createdById: adminId, // pakai admin sebagai creator untuk test
        namaKegiatan: `Kegiatan ${sub.indikatorSlug}`,
        linkBukti: 'https://example.com/bukti.pdf',
        statusPegawai: null,
        tingkatWilayah: sub.tingkatWilayah || null,
        jenjangPendidikan: sub.jenjangPendidikan || null,
        jumlah: sub.jumlah || null,
        pembilang: sub.pembilang || null,
        penyebut: sub.penyebut || null,
        status: 'disetujui',
        createdAt: sub.approvedAt || new Date(),
      },
    });

    // Create Validation record untuk timestamp tie-breaker
    await prisma.validation.create({
      data: {
        submissionItemId: item.id,
        validatorId: adminId,
        aksi: 'approve',
        createdAt: sub.approvedAt || new Date(),
      },
    });
  }

  return madrasah;
}

// ============================================================================
// TEST SCENARIOS
// ============================================================================

async function test1_SkorPerCapaian(periode, admin, indikatorMap) {
  console.log('\n🧪 TEST 1: Formula per_capaian (diklat)');
  console.log('   Expected: Jumlah Approved × Bobot');

  const diklat = indikatorMap.get('diklat');
  
  // Buat madrasah dengan 3 submission diklat approved
  const m = await createMadrasahWithSubmissions({
    nomorMadrasah: 'BMU-TEST-001',
    nama: 'MI Test PerCapaian',
    kelompok: 'MI Negeri',
    periodeId: periode.id,
    adminId: admin.id,
    indikatorMap,
    submissions: [
      { indikatorSlug: 'diklat', approvedAt: new Date('2026-02-01') },
      { indikatorSlug: 'diklat', approvedAt: new Date('2026-02-05') },
      { indikatorSlug: 'diklat', approvedAt: new Date('2026-02-10') },
    ],
  });

  const result = await calculateSkorMadrasah(m.id, periode.id);

  // Expected: 3 items × bobot 10 = 30
  const expected = 30;
  const passed = Math.abs(result.totalScore - expected) < 0.0001;

  console.log(`   Got: ${result.totalScore}, Expected: ${expected}`);
  console.log(`   Breakdown: ${JSON.stringify(result.breakdown)}`);
  console.log(passed ? '   ✅ PASS' : '   ❌ FAIL');

  return passed;
}

async function test2_Persentase(periode, admin, indikatorMap) {
  console.log('\n🧪 TEST 2: Formula persentase (rapor_rata_rata)');
  console.log('   Expected: Persentase × Bobot');

  // Madrasah dengan rapor: pembilang=80 dari penyebut=100 → 80% × 25 = 20
  const m = await createMadrasahWithSubmissions({
    nomorMadrasah: 'BMU-TEST-002',
    nama: 'MI Test Persentase',
    kelompok: 'MI Negeri',
    periodeId: periode.id,
    adminId: admin.id,
    indikatorMap,
    submissions: [
      { indikatorSlug: 'rapor_rata_rata', pembilang: 80, penyebut: 100, approvedAt: new Date('2026-03-01') },
    ],
  });

  const result = await calculateSkorMadrasah(m.id, periode.id);

  const expected = 0.8 * 25; // 80% × 25 bobot = 20
  const passed = Math.abs(result.totalScore - expected) < 0.0001;

  console.log(`   Got: ${result.totalScore}, Expected: ${expected}`);
  console.log(`   Breakdown: ${JSON.stringify(result.breakdown)}`);
  console.log(passed ? '   ✅ PASS' : '   ❌ FAIL');

  return passed;
}

async function test3_TieBreaker(periode, admin, indikatorMap) {
  console.log('\n🧪 TEST 3: Tie-breaker 4 level (kasus "842")');
  console.log('   Simulasi: 3 madrasah sama-sama skor 842');

  // Kasus "842" dari mock frontend:
  // 3 madrasah dengan total skor IDENTIK (842), beda di tie-breaker
  
  // M1: 842 poin via 10 submission, approve terakhir 2026-04-15
  const subsM1 = [];
  for (let i = 0; i < 10; i++) {
    subsM1.push({ indikatorSlug: 'giat_inovatif', approvedAt: new Date(`2026-04-${String(i + 1).padStart(2, '0')}`) });
  }

  // M2: 842 poin via 5 submission, approve terakhir 2026-04-20 (lebih lambat dari M1)
  const subsM2 = [];
  for (let i = 0; i < 5; i++) {
    subsM2.push({ indikatorSlug: 'penghargaan_individu', approvedAt: new Date(`2026-04-${String(i + 16).padStart(2, '0')}`) });
  }
  subsM2.push({ indikatorSlug: 'diklat', approvedAt: new Date('2026-04-20') });

  // M3: 842 poin via 10 submission, approve terakhir 2026-04-10 (lebih cepat dari M1 & M2)
  const subsM3 = [];
  for (let i = 0; i < 9; i++) {
    subsM3.push({ indikatorSlug: 'siswa_lanjutan_unggulan', approvedAt: new Date(`2026-04-${String(i + 1).padStart(2, '0')}`) });
  }
  subsM3.push({ indikatorSlug: 'diklat', approvedAt: new Date('2026-04-10') });

  const m1 = await createMadrasahWithSubmissions({
    nomorMadrasah: 'BMU-TEST-010',
    nama: 'MI Test Tie A',
    kelompok: 'MTs Negeri',
    periodeId: periode.id, adminId: admin.id, indikatorMap, submissions: subsM1,
  });

  const m2 = await createMadrasahWithSubmissions({
    nomorMadrasah: 'BMU-TEST-011',
    nama: 'MI Test Tie B',
    kelompok: 'MTs Negeri',
    periodeId: periode.id, adminId: admin.id, indikatorMap, submissions: subsM2,
  });

  const m3 = await createMadrasahWithSubmissions({
    nomorMadrasah: 'BMU-TEST-012',
    nama: 'MI Test Tie C',
    kelompok: 'MTs Negeri',
    periodeId: periode.id, adminId: admin.id, indikatorMap, submissions: subsM3,
  });

  const ranking = await calculateRanking('MTs Negeri', periode.id);

  console.log('   Hasil Ranking:');
  ranking.forEach(r => {
    console.log(`   #${r.ranking}: ${r.madrasah.namaMadrasah}`);
    console.log(`     Skor=${r.totalScore.toFixed(2)}, Subs=${r.submissionCount}, LastApproved=${r.lastApprovedAt?.toISOString().split('T')[0]}`);
  });

  // Expected order berdasarkan tie-breaker:
  // Semua punya skor sama → cek jumlah submission:
  // M1 = 10, M2 = 6, M3 = 10
  // Level 2: M1 & M3 (10) > M2 (6) → M2 rank #3
  // Level 3 antara M1 vs M3 (keduanya 10 subs):
  //   M3 lastApproved = 2026-04-10 (lebih awal), M1 lastApproved = 2026-04-15
  //   Ascending: M3 menang → M3 rank #1, M1 rank #2
  const expectedOrder = ['BMU-TEST-012', 'BMU-TEST-010', 'BMU-TEST-011'];
  const actualOrder = ranking.map(r => r.madrasah.nomorMadrasah);
  const passed = JSON.stringify(actualOrder) === JSON.stringify(expectedOrder);

  console.log(`   Expected order: ${expectedOrder.join(' > ')}`);
  console.log(`   Actual order:   ${actualOrder.join(' > ')}`);
  console.log(passed ? '   ✅ PASS' : '   ❌ FAIL');

  return passed;
}

async function test4_RecalculateAfterAction(periode, admin, indikatorMap) {
  console.log('\n🧪 TEST 4: recalculateAfterAction menyimpan ke cache table');

  const diklat = indikatorMap.get('diklat');
  const m = await createMadrasahWithSubmissions({
    nomorMadrasah: 'BMU-TEST-020',
    nama: 'MI Test Cache',
    kelompok: 'MA Swasta',
    periodeId: periode.id,
    adminId: admin.id,
    indikatorMap,
    submissions: [
      { indikatorSlug: 'diklat', approvedAt: new Date('2026-05-01') },
      { indikatorSlug: 'diklat', approvedAt: new Date('2026-05-02') },
    ],
  });

  // Recalculate & simpan cache
  const result = await recalculateAfterAction(m.id, periode.id);

  // Cek cache tersimpan di MadrasahScore
  const cached = await prisma.madrasahScore.findUnique({
    where: {
      madrasahId_periodeId: {
        madrasahId: m.id,
        periodeId: periode.id,
      },
    },
  });

  const expected = 2 * 10; // 2 items × bobot 10 = 20
  const passed = cached && cached.totalScore === result.totalScore && Math.abs(result.totalScore - expected) < 0.0001;

  console.log(`   Calculated: ${result.totalScore}, Expected: ${expected}`);
  console.log(`   Cached in MadrasahScore: ${cached?.totalScore ?? 'NOT FOUND'}`);
  console.log(passed ? '   ✅ PASS' : '   ❌ FAIL');

  return passed;
}

async function test5_BMUFallbackTieBreaker(periode, admin, indikatorMap) {
  console.log('\n🧪 TEST 5: Tie-breaker Level 4 — BMU ID fallback');
  console.log('   Simulasi: 2 madrasah identik di semua level kecuali BMU');

  // Kedua madrasah: 1 submission giat_inovatif, approve bersamaan
  const sameTime = new Date('2026-05-10T10:00:00Z');
  const subs = [{ indikatorSlug: 'giat_inovatif', approvedAt: sameTime }];

  const mA = await createMadrasahWithSubmissions({
    nomorMadrasah: 'BMU-TEST-030',
    nama: 'MI Test BMU A',
    kelompok: 'MA Negeri',
    periodeId: periode.id, adminId: admin.id, indikatorMap, submissions: subs,
  });

  const mB = await createMadrasahWithSubmissions({
    nomorMadrasah: 'BMU-TEST-031',
    nama: 'MI Test BMU B',
    kelompok: 'MA Negeri',
    periodeId: periode.id, adminId: admin.id, indikatorMap, submissions: subs.slice(),
  });

  const ranking = await calculateRanking('MA Negeri', periode.id);

  console.log('   Hasil:');
  ranking.forEach(r => {
    console.log(`   #${r.ranking}: ${r.madrasah.nomorMadrasah} (${r.madrasah.namaMadrasah})`);
  });

  // Expected: BMU-TEST-030 lebih dulu (ascending lexicographic)
  const passed = ranking[0]?.madrasah?.nomorMadrasah === 'BMU-TEST-030';

  console.log(passed ? '   ✅ PASS (BMU lebih kecil menang)' : '   ❌ FAIL');

  return passed;
}

// ============================================================================
// MAIN RUNNER
// ============================================================================

async function runAllTests() {
  let allPassed = true;
  const results = [];

  try {
    await cleanupTestData();
    const { periode, admin, indikatorMap } = await setupDummyData();

    results.push(['per_capaian formula', await test1_SkorPerCapaian(periode, admin, indikatorMap)]);
    results.push(['persentase formula', await test2_Persentase(periode, admin, indikatorMap)]);
    results.push(['Tie-breaker 4 level', await test3_TieBreaker(periode, admin, indikatorMap)]);
    results.push(['Cache MadrasahScore', await test4_RecalculateAfterAction(periode, admin, indikatorMap)]);
    results.push(['BMU fallback', await test5_BMUFallbackTieBreaker(periode, admin, indikatorMap)]);

    console.log('\n' + '='.repeat(50));
    console.log('📊 HASIL AKHIR:');
    console.log('='.repeat(50));
    
    for (const [name, passed] of results) {
      console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${name}`);
      if (!passed) allPassed = false;
    }

    console.log('='.repeat(50));
    console.log(allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED!');
    
    process.exit(allPassed ? 0 : 1);
  } catch (err) {
    console.error('❌ Test runner error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAllTests();

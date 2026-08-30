/**
 * Scoring Integration Test — BIMA UNGGUL (port dari legacy tests/testScoring.js,
 * 2026-08-30: live-compute tanpa cache, opsi B).
 *
 * Cakupan (paritas 5 skenario legacy):
 *  1. formula per_capaian — jumlah Approved × bobot
 *  2. formula persentase — (pembilang/penyebut) × bobot
 *  3. tie-breaker 4 level — kasus "842" (skor identik, beda subs/time/BMU)
 *  4. live-compute tanpa cache — skor dihitung saat dibaca (tabel MadrasahScore sudah dihapus)
 *  5. tie-breaker level 4 — BMU ID asc fallback
 *
 * Data fixture dibuat & dihancurkan SELURUHNYA oleh suite ini (prefix BMU-TEST
 * + periode TEST/2026). Cleanup disegmentasi per-fixture — TIDAK deleteMany global
 * seperti legacy (yang menghapus validasi/submission seluruh dev DB).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/db/prisma.js';
import { calculateSkorMadrasah, calculateRanking } from '../src/services/scoringService.js';

const NAMA_PERIODE = 'TEST/2026';
const ADMIN_NIP = '19700101199203001'; // fixture admin (reuse dari legacy)

// ============================================================================
// Helpers — fixture-scoped cleanup & setup
// ============================================================================

async function cleanupScoringFixtures() {
  await prisma.validation.deleteMany({
    where: { submissionItem: { madrasah: { nomorMadrasah: { startsWith: 'BMU-TEST' } } } },
  });
  await prisma.submissionItem.deleteMany({
    where: { madrasah: { nomorMadrasah: { startsWith: 'BMU-TEST' } } },
  });
  await prisma.bobotIndikator.deleteMany({ where: { periode: { namaPeriode: NAMA_PERIODE } } });
  await prisma.madrasah.deleteMany({ where: { nomorMadrasah: { startsWith: 'BMU-TEST' } } });
  await prisma.periodePenilaian.deleteMany({ where: { namaPeriode: NAMA_PERIODE } });
  await prisma.user.deleteMany({ where: { nip: ADMIN_NIP } });
}

async function setupDummyData() {
  const periode = await prisma.periodePenilaian.create({
    data: {
      namaPeriode: NAMA_PERIODE,
      tahunCapaian: 2026,
      tanggalMulai: new Date('2026-01-01'),
      tanggalCutoff: new Date('2026-06-30'),
      status: 'aktif',
    },
  });

  const indikators = await prisma.indikator.findMany();
  if (!indikators.length) {
    throw new Error('Indikator belum di-seed — jalankan prisma/seed.js dulu');
  }
  const indikatorMap = new Map(indikators.map((i) => [i.slug, i]));

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
        nilaiBobot: b.nilaiBobot ?? null,
        bobotTingkatWilayah: b.tingkat || null,
        bobotJenjang: b.jenjang || null,
        terkunci: false,
      },
    });
  }

  const admin = await prisma.user.create({
    data: {
      nip: ADMIN_NIP,
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
 * Madrasah + submission disetujui + validation (timestamp tie-breaker).
 * submissions: Array of { indikatorSlug, tingkatWilayah?, jenjangPendidikan?,
 *               jumlah?, pembilang?, penyebut?, approvedAt? }
 */
async function createMadrasahWithSubmissions(config) {
  const { nomorMadrasah, nama, kelompok, periodeId, adminId, indikatorMap, submissions } = config;

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
        createdById: adminId, // fixture admin sebagai creator
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

/** Saring ranking kelompok agar hanya madrasah fixture test (demo data riil tidak mengganggu asersi). */
function rankingFixtureOnly(ranking) {
  return ranking.filter((r) => r.madrasah.nomorMadrasah.startsWith('BMU-TEST'));
}

// ============================================================================
// Suite
// ============================================================================

describe('Scoring — formula', () => {
  let ctx;

  beforeAll(async () => {
    await cleanupScoringFixtures();
    ctx = await setupDummyData();
  });

  afterAll(async () => {
    await cleanupScoringFixtures();
  });

  it('formula per_capaian — jumlah Approved × bobot (diklat 3×10 = 30)', async () => {
    const m = await createMadrasahWithSubmissions({
      nomorMadrasah: 'BMU-TEST-001',
      nama: 'MI Test PerCapaian',
      kelompok: 'MI Negeri',
      periodeId: ctx.periode.id,
      adminId: ctx.admin.id,
      indikatorMap: ctx.indikatorMap,
      submissions: [
        { indikatorSlug: 'diklat', approvedAt: new Date('2026-02-01') },
        { indikatorSlug: 'diklat', approvedAt: new Date('2026-02-05') },
        { indikatorSlug: 'diklat', approvedAt: new Date('2026-02-10') },
      ],
    });

    const result = await calculateSkorMadrasah(m.id, ctx.periode.id);
    expect(result.totalScore).toBeCloseTo(30, 4);
    expect(result.breakdown.diklat).toBeCloseTo(30, 4);
    expect(result.indikatorCount).toBe(1);
  });

  it('formula persentase — pembilang/penyebut × bobot (80/100 × 25 = 20)', async () => {
    const m = await createMadrasahWithSubmissions({
      nomorMadrasah: 'BMU-TEST-002',
      nama: 'MI Test Persentase',
      kelompok: 'MI Negeri',
      periodeId: ctx.periode.id,
      adminId: ctx.admin.id,
      indikatorMap: ctx.indikatorMap,
      submissions: [
        { indikatorSlug: 'rapor_rata_rata', pembilang: 80, penyebut: 100, approvedAt: new Date('2026-03-01') },
      ],
    });

    const result = await calculateSkorMadrasah(m.id, ctx.periode.id);
    expect(result.totalScore).toBeCloseTo(20, 4);
    expect(result.breakdown.rapor_rata_rata).toBeCloseTo(20, 4);
  });

  it('live-compute tanpa cache — skor selalu dihitung saat dibaca (2×10 = 20)', async () => {
    const m = await createMadrasahWithSubmissions({
      nomorMadrasah: 'BMU-TEST-020',
      nama: 'MI Test LiveCompute',
      kelompok: 'MA Swasta',
      periodeId: ctx.periode.id,
      adminId: ctx.admin.id,
      indikatorMap: ctx.indikatorMap,
      submissions: [
        { indikatorSlug: 'diklat', approvedAt: new Date('2026-05-01') },
        { indikatorSlug: 'diklat', approvedAt: new Date('2026-05-02') },
      ],
    });

    const result = await calculateSkorMadrasah(m.id, ctx.periode.id);
    expect(result.totalScore).toBeCloseTo(20, 4);
  });

  it('tie-breaker 4 level — skor identik: subs count → waktu → BMU', async () => {
    // Tie NYATA (legacy testScoring.js punya bug: bobot set menghasilkan 120/85/190,
    // bukan 842 — order hampir lolos karena skor desc kebetulan searah).
    // Skor identik = 120 semua:
    //   M1: 12 × diklat (bobot 10) = 120, approve terakhir 2026-04-12
    //   M2: 10 × giat_inovatif (bobot 12) = 120, approve terakhir 2026-04-20
    //   M3: 12 × diklat (bobot 10) = 120, approve terakhir 2026-04-10
    const subsDiklat = (lastDay) =>
      Array.from({ length: 12 }, (_, i) => ({
        indikatorSlug: 'diklat',
        approvedAt: new Date(`2026-04-${String(Math.min(i + 1, lastDay)).padStart(2, '0')}`),
      }));
    const subsM1 = subsDiklat(15);
    const subsM2 = Array.from({ length: 10 }, (_, i) => ({
      indikatorSlug: 'giat_inovatif',
      approvedAt: new Date(`2026-04-${String(i + 11).padStart(2, '0')}`),
    }));
    const subsM3 = subsDiklat(10);

    const [m1, m2, m3] = await Promise.all([
      createMadrasahWithSubmissions({ nomorMadrasah: 'BMU-TEST-010', nama: 'MI Test Tie A', kelompok: 'MTs Negeri', periodeId: ctx.periode.id, adminId: ctx.admin.id, indikatorMap: ctx.indikatorMap, submissions: subsM1 }),
      createMadrasahWithSubmissions({ nomorMadrasah: 'BMU-TEST-011', nama: 'MI Test Tie B', kelompok: 'MTs Negeri', periodeId: ctx.periode.id, adminId: ctx.admin.id, indikatorMap: ctx.indikatorMap, submissions: subsM2 }),
      createMadrasahWithSubmissions({ nomorMadrasah: 'BMU-TEST-012', nama: 'MI Test Tie C', kelompok: 'MTs Negeri', periodeId: ctx.periode.id, adminId: ctx.admin.id, indikatorMap: ctx.indikatorMap, submissions: subsM3 }),
    ]);

    // Invariant: semua skor identik (tie sungguhan) — kalau tidak, test ini tidak menguji tie-breaker
    for (const m of [m1, m2, m3]) {
      const s = await calculateSkorMadrasah(m.id, ctx.periode.id);
      expect(s.totalScore).toBeCloseTo(120, 4);
    }

    const ranking = await calculateRanking('MTs Negeri', ctx.periode.id);
    const order = rankingFixtureOnly(ranking).map((r) => r.madrasah.nomorMadrasah);
    // Level 2: M1 & M3 (12 subs) > M2 (10 subs) → M2 #3
    // Level 3: M3 approve terakhir 04-10 (lebih awal) vs M1 04-12 → M3 #1, M1 #2
    expect(order).toEqual(['BMU-TEST-012', 'BMU-TEST-010', 'BMU-TEST-011']);
  });

  it('tie-breaker level 4 — BMU ID ascending sebagai fallback unik', async () => {
    const sameTime = new Date('2026-05-10T10:00:00Z');
    const subs = [{ indikatorSlug: 'giat_inovatif', approvedAt: sameTime }];

    await Promise.all([
      createMadrasahWithSubmissions({ nomorMadrasah: 'BMU-TEST-030', nama: 'MI Test BMU A', kelompok: 'MA Negeri', periodeId: ctx.periode.id, adminId: ctx.admin.id, indikatorMap: ctx.indikatorMap, submissions: subs }),
      createMadrasahWithSubmissions({ nomorMadrasah: 'BMU-TEST-031', nama: 'MI Test BMU B', kelompok: 'MA Negeri', periodeId: ctx.periode.id, adminId: ctx.admin.id, indikatorMap: ctx.indikatorMap, submissions: [...subs] }),
    ]);

    const ranking = await calculateRanking('MA Negeri', ctx.periode.id);
    const fixture = rankingFixtureOnly(ranking);
    expect(fixture[0]?.madrasah?.nomorMadrasah).toBe('BMU-TEST-030');
    expect(fixture[1]?.madrasah?.nomorMadrasah).toBe('BMU-TEST-031');
  });
});

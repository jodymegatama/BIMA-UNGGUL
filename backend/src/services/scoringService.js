/**
 * Scoring Service — BIMA UNGGUL Phase 3
 * Hitung skor per madrasah dan ranking dengan tie-breaker 4 level
 * Reference: PRD Section 11 (Formula skor per indikator), Section 17 (tie-breaker)
 * 
 * Tipe Formula:
 * - per_capaian: diklat, penghargaan_individu, siswa_lanjutan_unggulan, giat_inovatif
 *   → Jumlah Approved × Bobot
 * - per_tingkat_wilayah: penghargaan_institusi, prestasi_siswa
 *   → Σ(Jumlah per tingkat × Bobot tingkat)
 * - per_jenjang: lulus_jenjang_lanjutan
 *   → Σ(Jumlah × Bobot per jenjang S1/S2/S3)
 * - persentase: rapor_rata_rata, rasio_penerimaan
 *   → Persentase × Bobot
 *
 * Arsitektur (2026-08-30, keputusan live-compute):
 * Skor SELALU dihitung dari submissionItem saat dibaca — TIDAK ada cache.
 * Leaderboard pakai batch query (bobot 1x per periode, items 1x per kelompok)
 * — ~20 query/kelompok, bukan 1+4N. Cache MadrasahScore dihapus (tak pernah
 * dibaca; risiko stale; PRD §13 realtime).
 */
import { prisma } from '../db/prisma.js';
import { KELOMPOKS_LIST } from '../constants/periode.constants.js';

/**
 * Hitung skor dari data yang sudah dimuat — murni JS (tanpa query).
 * @param {Array} items - SubmissionItem[] status disetujui (include indikator)
 * @param {Array} bobots - BobotIndikator[] periode tsb
 * @returns {{totalScore: number, breakdown: Object, indikatorCount: number}}
 */
export function computeSkorBreakdown(items, bobots) {
  const bobotMap = new Map();
  for (const bobot of bobots) bobotMap.set(bobot.indikatorId, bobot);

  // Group items by indikatorId
  const itemsByIndikator = {};
  for (const item of items) {
    if (!itemsByIndikator[item.indikatorId]) itemsByIndikator[item.indikatorId] = [];
    itemsByIndikator[item.indikatorId].push(item);
  }

  const breakdown = {};
  let totalScore = 0;

  for (const [indikatorId, indikatorItems] of Object.entries(itemsByIndikator)) {
    const indikatorIdNum = parseInt(indikatorId, 10);
    const indikator = indikatorItems[0].indikator;
    const bobot = bobotMap.get(indikatorIdNum);

    let skorIndikator = 0;
    if (bobot) {
      if (indikator.tipeFormula === 'per_capaian') {
        skorIndikator = indikatorItems.length * bobot.nilaiBobot;
      } else if (indikator.tipeFormula === 'per_tingkat_wilayah') {
        const tingkatMap = {};
        for (const item of indikatorItems) {
          if (item.tingkatWilayah) {
            tingkatMap[item.tingkatWilayah] = (tingkatMap[item.tingkatWilayah] || 0) + 1;
          }
        }
        skorIndikator = Object.entries(tingkatMap).reduce((sum, [tingkat, count]) => {
          const bobotTingkat = bobot.bobotTingkatWilayah?.[tingkat] || 0;
          return sum + (count * bobotTingkat);
        }, 0);
      } else if (indikator.tipeFormula === 'per_jenjang') {
        const jenjangMap = {};
        for (const item of indikatorItems) {
          if (item.jenjangPendidikan && item.jumlah) {
            jenjangMap[item.jenjangPendidikan] = (jenjangMap[item.jenjangPendidikan] || 0) + item.jumlah;
          }
        }
        skorIndikator = Object.entries(jenjangMap).reduce((sum, [jenjang, jumlah]) => {
          const bobotJenjang = bobot.bobotJenjang?.[jenjang] || 0;
          return sum + (jumlah * bobotJenjang);
        }, 0);
      } else if (indikator.tipeFormula === 'persentase') {
        const totalPembilang = indikatorItems.reduce((sum, item) => sum + (item.pembilang || 0), 0);
        const totalPenyebut = indikatorItems.reduce((sum, item) => sum + (item.penyebut || 0), 0);
        const persentase = totalPenyebut > 0 ? (totalPembilang / totalPenyebut) * 100 : 0;
        skorIndikator = (persentase / 100) * bobot.nilaiBobot;
      }
    }

    breakdown[indikator.slug] = skorIndikator;
    totalScore += skorIndikator;
  }

  return {
    totalScore,
    breakdown,
    indikatorCount: Object.keys(itemsByIndikator).length,
  };
}

/**
 * Calculate total skor 1 madrasah untuk 1 periode (public detail / operator)
 * @param {number} madrasahId - ID Madrasah
 * @param {number} periodeId - ID PeriodePenilaian
 * @param {object} client - Prisma client / transaction client (default: prisma global)
 * @returns {Promise<{totalScore: number, breakdown: Object}>}
 */
export async function calculateSkorMadrasah(madrasahId, periodeId, client = prisma) {
  const [items, bobots] = await Promise.all([
    client.submissionItem.findMany({
      where: { madrasahId, periodeId, status: 'disetujui', deletedAt: null },
      include: { indikator: true },
    }),
    client.bobotIndikator.findMany({
      where: { periodeId },
      include: { indikator: true },
    }),
  ]);

  return computeSkorBreakdown(items, bobots);
}

/**
 * Calculate ranking semua madrasah dalam 1 kelompok untuk 1 periode
 * Tie-breaker (PRD Section 17 US8):
 * 1. Total skor (descending)
 * 2. Jumlah submission Approved (descending)
 * 3. Waktu pencapaian skor tertinggi terakhir (ascending) — MAX(Validation.createdAt)
 * 4. BMU ID (ascending) — untuk memastikan ranking unik
 *
 * Batch query: bobots 1x/kelompok, items 1x/kelompok, validations 1x/kelompok
 * @param {string} kelompok - "MI Negeri" | "MTs Negeri" | etc.
 * @param {number} periodeId - ID PeriodePenilaian
 * @returns {Promise<Array>} - Array of { madrasah, totalScore, submissionCount, lastApprovedAt, ranking }
 */
export async function calculateRanking(kelompok, periodeId) {
  const madrasahList = await prisma.madrasah.findMany({
    where: { kelompok, deletedAt: null }, // soft-deleted (nonaktif) tidak tampil di leaderboard
  });
  if (!madrasahList.length) return [];

  const madrasahIds = madrasahList.map((m) => m.id);

  // Batch: bobot selurah periode 1x, submission approved 1x, validasi 1x
  const [items, bobots, validationRows] = await Promise.all([
    prisma.submissionItem.findMany({
      where: { madrasahId: { in: madrasahIds }, periodeId, status: 'disetujui', deletedAt: null },
      include: { indikator: true },
    }),
    prisma.bobotIndikator.findMany({ where: { periodeId }, include: { indikator: true } }),
    prisma.validation.findMany({
      where: { submissionItem: { madrasahId: { in: madrasahIds }, periodeId, status: 'disetujui', deletedAt: null } },
      orderBy: { createdAt: 'desc' }, // pertam = MAX per submission item
      select: { submissionItemId: true, createdAt: true },
    }),
  ]);

  // Max validation createdAt per submission item (rows sudah desc → ambil pertama)
  const lastApprovedPerItem = new Map();
  for (const v of validationRows) {
    if (!lastApprovedPerItem.has(v.submissionItemId)) lastApprovedPerItem.set(v.submissionItemId, v.createdAt);
  }

  // Group items per madrasah
  const itemsByMadrasah = new Map();
  for (const item of items) {
    if (!itemsByMadrasah.has(item.madrasahId)) itemsByMadrasah.set(item.madrasahId, []);
    itemsByMadrasah.get(item.madrasahId).push(item);
  }

  const results = [];
  for (const madrasah of madrasahList) {
    const madrasahItems = itemsByMadrasah.get(madrasah.id) || [];
    const scoreData = computeSkorBreakdown(madrasahItems, bobots);

    let lastApprovedAt = null;
    for (const item of madrasahItems) {
      const t = lastApprovedPerItem.get(item.id);
      if (t && (!lastApprovedAt || t > lastApprovedAt)) lastApprovedAt = t;
    }

    results.push({
      madrasah,
      totalScore: scoreData.totalScore,
      submissionCount: madrasahItems.length,
      lastApprovedAt,
    });
  }

  // Sort dengan tie-breaker 4 level
  results.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.submissionCount !== a.submissionCount) return b.submissionCount - a.submissionCount;
    const aTime = a.lastApprovedAt?.getTime() || 0;
    const bTime = b.lastApprovedAt?.getTime() || 0;
    if (aTime !== bTime) return aTime - bTime;
    return a.madrasah.nomorMadrasah.localeCompare(b.madrasah.nomorMadrasah);
  });

  return results.map((item, index) => ({ ...item, ranking: index + 1 }));
}

/**
 * Hitung ranking semua kelompok (utk export PDF/Excel).
 * @param {number} periodeId - ID PeriodePenilaian
 * @returns {Promise<Object>} - { "MI Negeri": [...], ... }
 */
export async function calculateRankingAllGroups(periodeId) {
  const entries = await Promise.all(
    KELOMPOKS_LIST.map(async (k) => [k, await calculateRanking(k, periodeId)]),
  );
  return Object.fromEntries(entries);
}

export default {
  calculateSkorMadrasah,
  calculateRanking,
  calculateRankingAllGroups,
  computeSkorBreakdown,
};

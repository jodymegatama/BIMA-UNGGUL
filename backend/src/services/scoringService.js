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
 */

import { prisma } from '../db/prisma.js';

/**
 * Calculate total skor 1 madrasah untuk 1 periode
 * @param {number} madrasahId - ID Madrasah
 * @param {number} periodeId - ID PeriodePenilaian
 * @param {object} client - Prisma client / transaction client (default: prisma global)
 * @returns {Promise<{totalScore: number, breakdown: Object}>}
 */
export async function calculateSkorMadrasah(madrasahId, periodeId, client = prisma) {
  // 1. Ambil semua SubmissionItem approved untuk madrasah+periode
  const items = await client.submissionItem.findMany({
    where: {
      madrasahId,
      periodeId,
      status: 'disetujui',
      deletedAt: null,
    },
    include: {
      indikator: true,
    },
  });

  // 2. Ambil BobotIndikator untuk periode ini
  const bobots = await client.bobotIndikator.findMany({
    where: { periodeId },
    include: { indikator: true },
  });

  const bobotMap = new Map();
  for (const bobot of bobots) {
    bobotMap.set(bobot.indikatorId, bobot);
  }

  // 3. Group items by indikatorId
  const itemsByIndikator = {};
  for (const item of items) {
    const indikatorId = item.indikatorId;
    if (!itemsByIndikator[indikatorId]) {
      itemsByIndikator[indikatorId] = [];
    }
    itemsByIndikator[indikatorId].push(item);
  }

  // 4. Hitung skor per indikator
  const breakdown = {};
  let totalScore = 0;

  for (const [indikatorId, indikatorItems] of Object.entries(itemsByIndikator)) {
    const indikatorIdNum = parseInt(indikatorId, 10);
    const indikator = indikatorItems[0].indikator;
    const bobot = bobotMap.get(indikatorIdNum);

    let skorIndikator = 0;

    if (bobot) {
      if (indikator.tipeFormula === 'per_capaian') {
        // diklat, penghargaan_individu, siswa_lanjutan_unggulan, giat_inovatif
        // Rumus: Jumlah Approved × Bobot
        skorIndikator = indikatorItems.length * bobot.nilaiBobot;
      } else if (indikator.tipeFormula === 'per_tingkat_wilayah') {
        // penghargaan_institusi, prestasi_siswa
        // Rumus: Σ(Jumlah per tingkat × Bobot tingkat)
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
        // lulus_jenjang_lanjutan
        // Rumus: Σ(Jumlah × Bobot per jenjang S1/S2/S3)
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
        // rapor_rata_rata, rasio_penerimaan
        // Rumus: Persentase × Bobot
        // Hitung persentase dari semua submission
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
 * Calculate ranking semua madrasah dalam 1 kelompok untuk 1 periode
 * Tie-breaker (PRD Section 17 US8):
 * 1. Total skor (descending)
 * 2. Jumlah submission Approved (descending)
 * 3. Waktu pencapaian skor tertinggi terakhir (ascending) — MAX(Validation.createdAt)
 * 4. BMU ID (ascending) — untuk memastikan ranking unik
 * 
 * @param {string} kelompok - "MI Negeri" | "MTs Negeri" | etc.
 * @param {number} periodeId - ID PeriodePenilaian
 * @returns {Promise<Array>} - Array of { madrasah, totalScore, submissionCount, lastApprovedAt, ranking }
 */
export async function calculateRanking(kelompok, periodeId) {
  // 1. Ambil semua madrasah di kelompok ini
  const madrasahList = await prisma.madrasah.findMany({
    where: { kelompok, deletedAt: null }, // soft-deleted (nonaktif) tidak tampil di leaderboard
  });

  // 2. Hitung skor per madrasah
  const results = [];
  for (const madrasah of madrasahList) {
    const scoreData = await calculateSkorMadrasah(madrasah.id, periodeId);
    
    // Hitung jumlah submission Approved (non-deleted)
    const submissionCount = await prisma.submissionItem.count({
      where: {
        madrasahId: madrasah.id,
        periodeId,
        status: 'disetujui',
        deletedAt: null,
      },
    });

    // Get MAX(Validation.createdAt) untuk tie-breaker timestamp
    const lastApproved = await prisma.validation.findFirst({
      where: {
        submissionItem: {
          madrasahId: madrasah.id,
          periodeId,
          status: 'disetujui',
          deletedAt: null,
        },
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    results.push({
      madrasah,
      totalScore: scoreData.totalScore,
      submissionCount,
      lastApprovedAt: lastApproved?.createdAt,
    });
  }

  // 3. Sort dengan tie-breaker 4 level
  results.sort((a, b) => {
    // 1. Total score (descending)
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }

    // 2. Jumlah submission Approved (descending)
    if (b.submissionCount !== a.submissionCount) {
      return b.submissionCount - a.submissionCount;
    }

    // 3. Waktu pencapaian skor tertinggi terakhir (ascending)
    // Lebih dulu mencapai skor tinggi = lebih tinggi ranking
    const aTime = a.lastApprovedAt?.getTime() || 0;
    const bTime = b.lastApprovedAt?.getTime() || 0;
    if (aTime !== bTime) {
      return aTime - bTime;
    }

    // 4. BMU ID (ascending) — fallback untuk ranking unik
    return a.madrasah.nomorMadrasah.localeCompare(b.madrasah.nomorMadrasah);
  });

  // 4. Add ranking number
  return results.map((item, index) => ({
    ...item,
    ranking: index + 1,
  }));
}

/**
 * Upsert skor ke cache table MadrasahScore (dipakai di dalam transaksi atomic)
 * @param {number} madrasahId
 * @param {number} periodeId
 * @param {number} totalScore
 * @param {object} client - Prisma client / transaction client
 */
export async function upsertScoreCache(madrasahId, periodeId, totalScore, client = prisma) {
  await client.madrasahScore.upsert({
    where: {
      madrasahId_periodeId: {
        madrasahId,
        periodeId,
      },
    },
    update: {
      totalScore,
      lastRecalc: new Date(),
    },
    create: {
      madrasahId,
      periodeId,
      totalScore,
    },
  });
}

/**
 * Trigger untuk recalculate skor setelah aksi yang mengubah skor
 * @param {number} madrasahId - ID Madrasah
 * @param {number} periodeId - ID PeriodePenilaian
 * @param {object} client - Prisma client / transaction client (default: prisma global)
 * @returns {Promise<object>} - calculateSkorMadrasah result
 */
export async function recalculateAfterAction(madrasahId, periodeId, client = prisma) {
  try {
    const scoreData = await calculateSkorMadrasah(madrasahId, periodeId, client);

    // Simpan ke cache table MadrasahScore
    await upsertScoreCache(madrasahId, periodeId, scoreData.totalScore, client);

    return scoreData;
  } catch (err) {
    console.error(`[ScoringService] Recalculate failed for madrasah ${madrasahId}:`, err);
    throw err;
  }
}

/**
 * Trigger untuk recalculate ranking seluruh kelompok setelah aksi
 * @param {number} periodeId - ID PeriodePenilaian
 * @returns {Promise<Array>} - Array of rankings per kelompok
 */
export async function recalculateRankingAllGroups(periodeId) {
  const kelompokList = [
    'MI Negeri', 'MI Swasta',
    'MTs Negeri', 'MTs Swasta',
    'MA Negeri', 'MA Swasta',
  ];

  const rankings = {};
  for (const kelompok of kelompokList) {
    try {
      const rankData = await calculateRanking(kelompok, periodeId);
      rankings[kelompok] = rankData;
    } catch (err) {
      console.error(`[ScoringService] Ranking failed for kelompok ${kelompok}:`, err);
      rankings[kelompok] = [];
    }
  }

  return rankings;
}

export default {
  calculateSkorMadrasah,
  calculateRanking,
  recalculateAfterAction,
  recalculateRankingAllGroups,
  upsertScoreCache,
};

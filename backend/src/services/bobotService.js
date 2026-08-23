/**
 * Bobot Service — BIMA UNGGUL Phase 3 Final
 * GET/PATCH bobot per periode — lock jika periode finalisasi, recalc skor, audit
 */
import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';
import { recordAuditLog } from './auditService.js';
import { recalculateAfterAction } from './scoringService.js';

const TX_OPTS = { timeout: 20000, maxWait: 5000 };

export async function listBobot({ periodeId }) {
  if (!periodeId) throw new HttpError(400, 'MISSING_PERIODE', 'periodeId wajib');
  const pid = parseInt(periodeId, 10);
  if (!Number.isFinite(pid)) throw new HttpError(400, 'INVALID_ID', 'periodeId tidak valid');
  const periode = await prisma.periodePenilaian.findUnique({ where: { id: pid } });
  if (!periode) throw new HttpError(404, 'PERIODE_NOT_FOUND', 'Periode tidak ditemukan');

  // Merge left-join: SELALU kembalikan 9 indikator master, dimerge dengan bobot eksisting
  // sehingga frontend mendapat id + tipeFormula otoritatif walau belum ada config bobot.
  const [indikators, rows] = await Promise.all([
    prisma.indikator.findMany({ orderBy: { kode: 'asc' } }),
    prisma.bobotIndikator.findMany({ where: { periodeId: pid } }),
  ]);
  const byIndikator = new Map(rows.map((r) => [r.indikatorId, r]));
  const data = indikators.map((ind) => {
    const b = byIndikator.get(ind.id) || null;
    return {
      indikatorId: ind.id,
      kode: ind.kode,
      slug: ind.slug,
      nama: ind.nama,
      tipeFormula: ind.tipeFormula,
      nilaiBobot: b?.nilaiBobot ?? null,
      bobotTingkatWilayah: b?.bobotTingkatWilayah ?? null,
      bobotJenjang: b?.bobotJenjang ?? null,
      terkunci: b?.terkunci ?? false,
      adaBobot: Boolean(b),
    };
  });
  return { periode, data };
}

export async function updateBobot({ periodeId, bobots }, { userId, ip }) {
  const pid = parseInt(periodeId, 10);
  if (!Number.isFinite(pid)) throw new HttpError(400, 'INVALID_ID', 'periodeId tidak valid');
  if (!Array.isArray(bobots) || bobots.length === 0) throw new HttpError(400, 'MISSING_BOBOT', 'bobots array wajib');

  return prisma.$transaction(async (tx) => {
    const periode = await tx.periodePenilaian.findUnique({ where: { id: pid } });
    if (!periode) throw new HttpError(404, 'PERIODE_NOT_FOUND', 'Periode tidak ditemukan');
    if (periode.status === 'finalisasi' || periode.status === 'arsip') throw new HttpError(423, 'PERIOD_LOCKED', 'Periode sudah finalisasi/arsip, bobot terkunci');
    // also check if any bobot terkunci
    const lockedCount = await tx.bobotIndikator.count({ where: { periodeId: pid, terkunci: true } });
    if (lockedCount > 0) throw new HttpError(423, 'BOBOT_LOCKED', 'Bobot terkunci karena periode difinalisasi');

    const updated = [];
    for (const b of bobots) {
      const indikatorId = parseInt(b.indikatorId, 10);
      if (!Number.isFinite(indikatorId)) throw new HttpError(400, 'INVALID_INDIKATOR', 'indikatorId tidak valid');
      // fetch before for audit
      const before = await tx.bobotIndikator.findUnique({ where: { indikatorId_periodeId: { indikatorId, periodeId: pid } } });
      const data = {};
      if (b.nilaiBobot !== undefined) {
        if (b.nilaiBobot !== null && (typeof b.nilaiBobot !== 'number' || b.nilaiBobot < 0)) throw new HttpError(400, 'INVALID_NILAI', 'nilaiBobot harus number >=0 atau null');
        data.nilaiBobot = b.nilaiBobot;
      }
      if (b.bobotTingkatWilayah !== undefined) {
        if (b.bobotTingkatWilayah !== null) {
          for (const k of ['kabupaten','provinsi','nasional','internasional']) {
            if (b.bobotTingkatWilayah[k] !== undefined && (typeof b.bobotTingkatWilayah[k] !== 'number' || b.bobotTingkatWilayah[k] < 0)) throw new HttpError(400, 'INVALID_BOBOT_WILAYAH', `bobotTingkatWilayah.${k} harus number >=0`);
          }
        }
        data.bobotTingkatWilayah = b.bobotTingkatWilayah;
      }
      if (b.bobotJenjang !== undefined) {
        if (b.bobotJenjang !== null) {
          for (const k of ['s1','s2','s3']) if (b.bobotJenjang[k] !== undefined && (typeof b.bobotJenjang[k] !== 'number' || b.bobotJenjang[k] < 0)) throw new HttpError(400, 'INVALID_BOBOT_JENJANG', `bobotJenjang.${k} harus number >=0`);
        }
        data.bobotJenjang = b.bobotJenjang;
      }
      const up = await tx.bobotIndikator.upsert({
        where: { indikatorId_periodeId: { indikatorId, periodeId: pid } },
        update: data,
        create: { indikatorId, periodeId: pid, ...data },
      });
      updated.push(up);
      await recordAuditLog({ userId, action: 'update_bobot', entity: 'BobotIndikator', entityId: up.id, dataSebelum: before, dataSesudah: up, ipAddress: ip }, tx);
    }

    // recalc all madrasah that have submissions in this periode
    const distinct = await tx.submissionItem.findMany({
      where: { periodeId: pid, status: 'disetujui', deletedAt: null },
      select: { madrasahId: true },
      distinct: ['madrasahId'],
    });
    for (const { madrasahId } of distinct) {
      await recalculateAfterAction(madrasahId, pid, tx);
    }

    return updated;
  }, TX_OPTS);
}

export default { listBobot, updateBobot };

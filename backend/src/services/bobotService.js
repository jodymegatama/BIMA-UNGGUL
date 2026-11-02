/**
 * Bobot Service — BIMA UNGGUL Phase 3 Final
 * GET/PATCH bobot per periode — lock jika periode finalisasi, recalc skor, audit
 */
import { prisma } from '../db/prisma.js';
import { TX_OPTS } from '../config/transaction.js';
import { HttpError } from '../utils/httpError.js';
import { parseId, listPeriod, updatePeriod, lockPeriod, snapshot } from './indikatorService.js';
import { recordAuditLog } from './auditService.js';

import { deriveStatus } from './periodService.js';

export async function listBobot({ periodeId }) {
  const pid = parseId(periodeId);
  const raw = await prisma.periodePenilaian.findUnique({ where: { id: pid } });
  if (!raw) throw new HttpError(404, 'PERIODE_NOT_FOUND', 'Periode tidak ditemukan');
  const data = await listPeriod(pid);
  return { periode: { ...raw, status: deriveStatus(raw) }, data: data.map((r) => ({ ...r, adaBobot: r.nilaiBobot !== null || r.bobotTingkatWilayah !== null || r.bobotJenjang !== null })) };
}
export async function updateBobot({ periodeId, bobots }, actor) {
  const pid = parseId(periodeId);
  if (!Array.isArray(bobots) || !bobots.length || bobots.length > 200) throw new HttpError(400, 'MISSING_BOBOT', 'Masukkan 1–200 konfigurasi bobot');
  return prisma.$transaction(async (tx) => {
    await lockPeriod(tx, pid);
    const result = [];
    for (const b of bobots) {
      if (!/^\d+$/.test(String(b.indikatorId))) throw new HttpError(400, 'INVALID_INDIKATOR', 'ID indikator tidak valid');
      const iid = parseId(b.indikatorId);
      const row = await tx.bobotIndikator.findUnique({ where: { indikatorId_periodeId: { indikatorId: iid, periodeId: pid } } });
      // Compatibility for existing bulk-weight clients: adding a weight also attaches the master.
      if (!row) {
        const ind = await tx.indikator.findUnique({ where: { id: iid } });
        if (!ind) throw new HttpError(404, 'INDIKATOR_NOT_FOUND', 'Indikator tidak ditemukan');
        await tx.bobotIndikator.create({ data: { indikatorId: iid, periodeId: pid, ...snapshot(ind), menerimaInput: false } });
      }
      const updated = await updatePeriod(tx, pid, iid, b, actor, b.revision !== undefined);
      result.push(updated);
      await recordAuditLog({ userId: actor.userId, ipAddress: actor.ip, action: 'update_bobot', entity: 'BobotIndikator', entityId: updated.id, dataSesudah: updated }, tx);
    }
    const after = await tx.bobotIndikator.findMany({ where: { periodeId: pid } });
    const total = after.reduce((sum, b) => sum + (b.nilaiBobot || 0) + Object.values(b.bobotTingkatWilayah || {}).reduce((a, v) => a + v, 0) + Object.values(b.bobotJenjang || {}).reduce((a, v) => a + v, 0), 0);
    if (total <= 0) throw new HttpError(400, 'ALL_BOBOT_ZERO', 'Minimal satu indikator harus punya bobot lebih dari 0');
    return result;
  }, TX_OPTS);
}
export default { listBobot, updateBobot };

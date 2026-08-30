/**
 * Period Service — BIMA UNGGUL Phase 3 Final
 * CRUD PeriodePenilaian + finalisasi/reopen dengan AuditLog
 * Prisma 5.18: prisma.$transaction(async (tx)=>{})
 */
import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';
import { recordAuditLog } from './auditService.js';

const TX_OPTS = { timeout: 15000, maxWait: 5000 };

function parseTahun(namaPeriode) {
  const m = String(namaPeriode).match(/^(\d{4})\//);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Derive status efektif dari tanggal untuk fase awal lifecycle.
 * Fase manual (penyelesaian_validasi, finalisasi, arsip) TIDAK dioverride.
 * belum_dimulai : now < tanggalMulai
 * aktif         : tanggalMulai <= now <= tanggalCutoff
 * cutoff        : now > tanggalCutoff (input ditutup, menunggu penyelesaian/finalisasi)
 */
export function deriveStatus(p) {
  if (!p) return null;
  if (['penyelesaian_validasi', 'finalisasi', 'arsip'].includes(p.status)) return p.status;
  const now = new Date();
  const mulai = new Date(p.tanggalMulai);
  const cutoff = new Date(p.tanggalCutoff);
  if (now < mulai) return 'belum_dimulai';
  if (now <= cutoff) return 'aktif';
  return 'cutoff';
}

/**
 * Guard: hanya SATU periode yang boleh "jalan" (menjangkau now) bersamaan.
 * Interval detect (context7 /prisma/orm range query): dua interval overlap
 * jika dan hanya jika a.mulai <= b.cutoff AND a.cutoff >= b.mulai.
 * Histori (finalisasi/arsip/penyelesaian_validasi) dikecualikan — boleh overlap.
 */
async function assertNoOverlap({ excludeId, mulai, cutoff }) {
  const baseWhere = {
    status: { notIn: ['finalisasi', 'arsip', 'penyelesaian_validasi'] },
    tanggalMulai: { lte: cutoff },
    tanggalCutoff: { gte: mulai },
  };
  // Prisma tidak menerima NOT: { id: null } — bangun where conditional
  const where = excludeId ? { ...baseWhere, NOT: { id: excludeId } } : baseWhere;
  const conflict = await prisma.periodePenilaian.findFirst({
    where,
    select: { id: true, namaPeriode: true, tanggalMulai: true, tanggalCutoff: true },
  });
  if (conflict) {
    const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '?');
    throw new HttpError(409, 'PERIOD_OVERLAP',
      `Tidak boleh ada 2 periode jalan bersamaan — periode "${conflict.namaPeriode}" (${fmt(conflict.tanggalMulai)} s/d ${fmt(conflict.tanggalCutoff)}) masih berjalan pada rentang waktu ini. Selesaikan (finalisasi) terlebih dahulu.`);
  }
  return conflict;
}

/**
 * Resolve periode efektif yang sedang berjalan (untuk leaderboard & detail publik).
 * 1) jendela tanggal mencakup now & belum dikunci manual
 * 2) fallback kompatibel: eksplisit berstatus 'aktif' (mis. data uji)
 */
export async function resolveAktifPeriode() {
  const now = new Date();
  const byWindow = await prisma.periodePenilaian.findFirst({
    where: {
      status: { notIn: ['finalisasi', 'arsip', 'penyelesaian_validasi'] },
      tanggalMulai: { lte: now },
      tanggalCutoff: { gte: now },
    },
    orderBy: { tanggalMulai: 'desc' },
  });
  if (byWindow) return byWindow;
  return prisma.periodePenilaian.findFirst({ where: { status: 'aktif' }, orderBy: { tanggalMulai: 'desc' } });
}

export async function listPeriode({ status, q } = {}) {
  const where = {};
  if (status) where.status = status;
  if (q) where.namaPeriode = { contains: q };
  const rows = await prisma.periodePenilaian.findMany({
    where,
    orderBy: { tanggalMulai: 'desc' },
    // _count untuk modal konfirmasi hapus (submission/skor/bobot yang akan ikut terhapus)
    include: { _count: { select: { submissions: true, scores: true, bobots: true } } },
  });
  // status fase awal diturunkan dari tanggal saat dibaca (DB tidak diubah)
  return rows.map((r) => ({ ...r, status: deriveStatus(r) }));
}

export async function createPeriode({ namaPeriode, tanggalMulai, tanggalCutoff }, { userId, ip }) {
  if (!namaPeriode || !tanggalMulai || !tanggalCutoff) throw new HttpError(400, 'MISSING_FIELDS', 'namaPeriode, tanggalMulai, tanggalCutoff wajib');
  const tahunCapaian = parseTahun(namaPeriode);
  if (!tahunCapaian) throw new HttpError(400, 'INVALID_NAMA', 'Format namaPeriode harus YYYY/YYYY, contoh 2026/2027');
  const mulai = new Date(tanggalMulai);
  const cutoff = new Date(tanggalCutoff);
  if (isNaN(mulai) || isNaN(cutoff)) throw new HttpError(400, 'INVALID_DATE', 'Tanggal tidak valid');
  if (mulai >= cutoff) throw new HttpError(400, 'INVALID_RANGE', 'tanggalMulai harus sebelum tanggalCutoff');

  // Guard anti-overlap: tidak boleh ada 2 periode jalan bersamaan
  await assertNoOverlap({ excludeId: null, mulai, cutoff });

  // status awal mengikuti posisi now terhadap jendela tanggal
  const initialStatus = deriveStatus({ status: null, tanggalMulai: mulai, tanggalCutoff: cutoff });

  const created = await prisma.periodePenilaian.create({
    data: { namaPeriode, tahunCapaian, tanggalMulai: mulai, tanggalCutoff: cutoff, status: initialStatus },
  });
  await recordAuditLog({ userId, action: 'create_periode', entity: 'PeriodePenilaian', entityId: created.id, dataSesudah: created, ipAddress: ip });
  return created;
}

export async function updatePeriode(id, patch, { userId, ip }) {
  const pid = parseInt(id, 10);
  if (!Number.isFinite(pid)) throw new HttpError(400, 'INVALID_ID', 'ID tidak valid');
  const existing = await prisma.periodePenilaian.findUnique({ where: { id: pid } });
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Periode tidak ditemukan');
  if (existing.status === 'finalisasi' || existing.status === 'arsip') throw new HttpError(423, 'PERIOD_LOCKED', 'Periode sudah finalisasi/arsip, tidak bisa diedit');
  // allow patch tanggalMulai/tanggalCutoff/status/namaPeriode
  const data = {};
  if (patch.namaPeriode !== undefined) {
    const t = parseTahun(patch.namaPeriode);
    if (!t) throw new HttpError(400, 'INVALID_NAMA', 'Format namaPeriode harus YYYY/YYYY');
    data.namaPeriode = patch.namaPeriode;
    data.tahunCapaian = t;
  }
  if (patch.tanggalMulai !== undefined) data.tanggalMulai = new Date(patch.tanggalMulai);
  if (patch.tanggalCutoff !== undefined) data.tanggalCutoff = new Date(patch.tanggalCutoff);
  if (patch.status !== undefined) data.status = patch.status;
  if (data.tanggalMulai && data.tanggalCutoff && data.tanggalMulai >= data.tanggalCutoff) throw new HttpError(400, 'INVALID_RANGE', 'tanggalMulai harus sebelum tanggalCutoff');

  // Guard anti-overlap: hanya berlaku utk periode yang masih jalan
  // (finalisasi/arsip dikecualikan — histori boleh overlap)
  if (existing.status !== 'finalisasi' && existing.status !== 'arsip') {
    const effMulai = data.tanggalMulai || existing.tanggalMulai;
    const effCutoff = data.tanggalCutoff || existing.tanggalCutoff;
    await assertNoOverlap({ excludeId: pid, mulai: effMulai, cutoff: effCutoff });
  }

  const before = { ...existing };
  const updated = await prisma.periodePenilaian.update({ where: { id: pid }, data });
  await recordAuditLog({ userId, action: 'update_periode', entity: 'PeriodePenilaian', entityId: pid, dataSebelum: before, dataSesudah: updated, ipAddress: ip });
  // konsisten dengan listPeriode: status efektif di-derive dari tanggal, bukan raw DB
  return { ...updated, status: deriveStatus(updated) };
}

export async function finalizePeriode(id, { userId, ip }) {
  const pid = parseInt(id, 10);
  if (!Number.isFinite(pid)) throw new HttpError(400, 'INVALID_ID', 'ID tidak valid');
  return prisma.$transaction(async (tx) => {
    const p = await tx.periodePenilaian.findUnique({ where: { id: pid } });
    if (!p) throw new HttpError(404, 'NOT_FOUND', 'Periode tidak ditemukan');
    if (p.status === 'finalisasi') throw new HttpError(400, 'ALREADY_FINALIZED', 'Periode sudah finalisasi');
    if (p.status === 'arsip') throw new HttpError(400, 'ARCHIVED', 'Periode sudah diarsip');
    const before = { status: p.status };
    const updated = await tx.periodePenilaian.update({ where: { id: pid }, data: { status: 'finalisasi' } });
    await tx.bobotIndikator.updateMany({ where: { periodeId: pid }, data: { terkunci: true } });
    await recordAuditLog({ userId, action: 'finalize_period', entity: 'PeriodePenilaian', entityId: pid, dataSebelum: before, dataSesudah: { status: 'finalisasi' }, ipAddress: ip }, tx);
    return updated;
  }, TX_OPTS);
}

export async function reopenPeriode(id, { alasan, userId, ip }) {
  const pid = parseInt(id, 10);
  if (!Number.isFinite(pid)) throw new HttpError(400, 'INVALID_ID', 'ID tidak valid');
  if (!alasan || String(alasan).trim().length === 0) throw new HttpError(400, 'MISSING_ALASAN', 'alasan wajib diisi');
  const clean = String(alasan).trim();
  return prisma.$transaction(async (tx) => {
    const p = await tx.periodePenilaian.findUnique({ where: { id: pid } });
    if (!p) throw new HttpError(404, 'NOT_FOUND', 'Periode tidak ditemukan');
    if (p.status !== 'finalisasi') throw new HttpError(400, 'NOT_FINALIZED', 'Hanya periode finalisasi yang bisa di-reopen');
    const before = { status: p.status };
    // reopen ke aktif (atau penyelesaian_validasi — pilih aktif agar write kembali diizinkan)
    const updated = await tx.periodePenilaian.update({ where: { id: pid }, data: { status: 'aktif' } });
    await tx.bobotIndikator.updateMany({ where: { periodeId: pid }, data: { terkunci: false } });
    await recordAuditLog({ userId, action: 'reopen_period', entity: 'PeriodePenilaian', entityId: pid, dataSebelum: before, dataSesudah: { status: 'aktif' }, alasan: clean, ipAddress: ip }, tx);
    return updated;
  }, TX_OPTS);
}

export async function deletePeriode(id, { userId, ip }) {
  const pid = parseInt(id, 10);
  if (!Number.isFinite(pid)) throw new HttpError(400, 'INVALID_ID', 'ID tidak valid');
  const existing = await prisma.periodePenilaian.findUnique({ where: { id: pid } });
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Periode tidak ditemukan');
  // Periode finalisasi/arsip tetap terkunci (data histori) — hanya lifecycle non-locked yang bisa dihapus
  if (existing.status === 'finalisasi' || existing.status === 'arsip')
    throw new HttpError(423, 'PERIOD_LOCKED', 'Periode finalisasi/arsip tidak bisa dihapus');

  // KEPUTUSAN USER (2026-08-30): hapus tetap dijalankan walau ada submission/skor.
  // Semua data terkait di-cascade manual dalam satu transaction (prisma deleteMany),
  // jumlah data dikembalikan untuk ditampilkan di toast/modal konfirmasi.
  return prisma.$transaction(async (tx) => {
    const [subCount, scoreCount, bobotCount] = await Promise.all([
      tx.submissionItem.count({ where: { periodeId: pid } }),
      tx.madrasahScore.count({ where: { periodeId: pid } }),
      tx.bobotIndikator.count({ where: { periodeId: pid } }),
    ]);
    await tx.bobotIndikator.deleteMany({ where: { periodeId: pid } });
    await tx.submissionItem.deleteMany({ where: { periodeId: pid } });
    await tx.madrasahScore.deleteMany({ where: { periodeId: pid } });
    await tx.periodePenilaian.delete({ where: { id: pid } });
    await recordAuditLog({ userId, action: 'delete_periode', entity: 'PeriodePenilaian',
      entityId: pid, dataSebelum: existing, dataSesudah: null, ipAddress: ip }, tx);
    return { id: pid, deleted: { submissions: subCount, scores: scoreCount, bobots: bobotCount } };
  }, TX_OPTS);
}

export default { listPeriode, createPeriode, updatePeriode, deletePeriode, finalizePeriode, reopenPeriode, deriveStatus, resolveAktifPeriode };

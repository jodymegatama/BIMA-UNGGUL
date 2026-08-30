/**
 * Validasi Admin Integration Test — BIMA UNGGUL (port legacy tests/testValidationE2E.js).
 * Alur: Operator submit (menunggu) → Admin approve/reject/revoke → skor & AuditLog atomic.
 * Juga: DeleteRequest approve/reject + atomicity/rollback + pagination.
 *
 * Sequential by design: state skor menumpuk antar test (bagian dari skenario).
 * Data fixture: prefix E2E-VAL + periode E2E-VAL/2026 — dibersihkan sebelum & sesudah.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/db/prisma.js';
import * as validationService from '../src/services/validationService.js';
import { calculateSkorMadrasah } from '../src/services/scoringService.js';

const NS = 'E2E-VAL';
const ip = '127.0.0.1-e2e';

async function cleanup() {
  const per = await prisma.periodePenilaian.findFirst({ where: { namaPeriode: `${NS}/2026` } });
  if (per) {
    await prisma.validation.deleteMany({ where: { submissionItem: { periodeId: per.id } } }).catch(() => {});
    await prisma.deleteRequest.deleteMany({ where: { submissionItem: { periodeId: per.id } } }).catch(() => {});
    await prisma.submissionItem.deleteMany({ where: { periodeId: per.id } }).catch(() => {});
    await prisma.bobotIndikator.deleteMany({ where: { periodeId: per.id } }).catch(() => {});
    await prisma.periodePenilaian.deleteMany({ where: { id: per.id } }).catch(() => {});
  }
  await prisma.madrasah.deleteMany({ where: { nomorMadrasah: { startsWith: `BMU-${NS}` } } }).catch(() => {});
  await prisma.user.deleteMany({ where: { nip: { startsWith: NS } } }).catch(() => {});
  await prisma.auditLog.deleteMany({ where: { action: { contains: 'submission' }, ipAddress: ip } }).catch(() => {});
}

async function setup() {
  const periode = await prisma.periodePenilaian.create({
    data: {
      namaPeriode: `${NS}/2026`,
      tahunCapaian: 2026,
      tanggalMulai: new Date('2026-01-01'),
      tanggalCutoff: new Date('2026-12-31'),
      status: 'aktif',
    },
  });

  const indikators = await prisma.indikator.findMany();
  const bySlug = new Map(indikators.map((i) => [i.slug, i]));
  const diklat = bySlug.get('diklat');
  const giat = bySlug.get('giat_inovatif');
  if (!diklat || !giat) throw new Error('Indikator diklat/giat_inovatif belum seeded. Jalankan prisma db seed dulu.');

  for (const [slug, bobot] of [['diklat', 10], ['giat_inovatif', 12]]) {
    const ind = bySlug.get(slug);
    await prisma.bobotIndikator.create({
      data: { indikatorId: ind.id, periodeId: periode.id, nilaiBobot: bobot, terkunci: false },
    });
  }

  const admin = await prisma.user.create({
    data: { nip: `${NS}-ADMIN-001`, password: 'hash', name: 'E2E Admin', email: `e2e-admin-${Date.now()}@test.local`, role: 'admin', status: 'aktif' },
  });
  const operator = await prisma.user.create({
    data: { nip: `${NS}-OP-001`, password: 'hash', name: 'E2E Operator', email: `e2e-op-${Date.now()}@test.local`, role: 'operator', status: 'aktif' },
  });

  const madrasah = await prisma.madrasah.create({
    data: {
      nomorMadrasah: `BMU-${NS}-001`,
      namaMadrasah: `Madrasah ${NS} Utama`,
      jenjang: 'MI',
      statusKepemilikan: 'Negeri',
      jumlahSiswa: 100,
      alamat: 'Jl Test E2E',
      slug: `madrasah-${NS.toLowerCase()}-utama-${Date.now()}`,
      kelompok: 'MI Negeri',
    },
  });
  await prisma.user.update({ where: { id: operator.id }, data: { madrasahId: madrasah.id } });

  return { periode, admin, operator, madrasah, diklat, giat };
}

describe('Validasi admin (E2E-VAL)', () => {
  let ctx;

  beforeAll(async () => {
    await cleanup();
    ctx = await setup();
  });

  afterAll(async () => {
    await cleanup();
  });

  // Helper: create item menunggu (simulasi endpoint Operator POST /indikator/:id/submit)
  function createMenunggu({ indikatorId, extra = {} } = {}) {
    return prisma.submissionItem.create({
      data: {
        madrasahId: ctx.madrasah.id,
        indikatorId: indikatorId ?? ctx.diklat.id,
        periodeId: ctx.periode.id,
        createdById: ctx.operator.id,
        namaKegiatan: `Kegiatan ${NS} ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        institusi: 'Instansi Test',
        linkBukti: 'https://example.com/bukti.pdf',
        status: 'menunggu',
        ...extra,
      },
    });
  }

  it('GET validasi queue filter + pagination', async () => {
    const item1 = await createMenunggu();
    const q1 = await validationService.getValidasiQueue({ status: 'menunggu', periodeId: String(ctx.periode.id), page: '1', limit: '10' });
    expect(q1.total).toBeGreaterThanOrEqual(1);
    expect(q1.data.some((d) => d.id === item1.id)).toBe(true);
    const qPage = await validationService.getValidasiQueue({ status: 'menunggu', page: '999', limit: '1' });
    expect(qPage.page).toBe(999);
    expect(qPage.limit).toBe(1);
    ctx.item1 = item1;
  });

  it('approve menunggu → disetujui, recalc skor, audit atomic', async () => {
    const beforeScore = await calculateSkorMadrasah(ctx.madrasah.id, ctx.periode.id);
    expect(beforeScore.totalScore).toBeCloseTo(0, 4);
    const approved = await validationService.approveSubmission({ id: ctx.item1.id, adminId: ctx.admin.id, ip });
    expect(approved.status).toBe('disetujui');
    const val = await prisma.validation.findFirst({ where: { submissionItemId: ctx.item1.id, aksi: 'approve' } });
    expect(val).toBeTruthy();
    const live = await calculateSkorMadrasah(ctx.madrasah.id, ctx.periode.id);
    expect(Number(live.totalScore)).toBeCloseTo(10, 4);
    const audit = await prisma.auditLog.findFirst({ where: { action: 'approve_submission', entityId: String(ctx.item1.id) } });
    expect(audit?.dataSebelum?.status).toBe('menunggu');
    expect(audit?.dataSesudah?.status).toBe('disetujui');
  });

  it('double approve harus 400 INVALID_STATUS', async () => {
    await expect(
      validationService.approveSubmission({ id: ctx.item1.id, adminId: ctx.admin.id, ip }),
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_STATUS' });
  });

  it('reject tanpa alasan → 400 MISSING_ALASAN, status tetap menunggu', async () => {
    const item2 = await createMenunggu();
    ctx.item2 = item2;
    await expect(
      validationService.rejectSubmission({ id: item2.id, adminId: ctx.admin.id, alasan: '', ip }),
    ).rejects.toMatchObject({ status: 400, code: 'MISSING_ALASAN' });
    const still = await prisma.submissionItem.findUnique({ where: { id: item2.id } });
    expect(still.status).toBe('menunggu');
    const noVal = await prisma.validation.findFirst({ where: { submissionItemId: item2.id, aksi: 'reject' } });
    expect(noVal).toBeNull();
  });

  it('reject dengan alasan → ditolak + alasanPenolakan + skor unchanged', async () => {
    const rejected = await validationService.rejectSubmission({ id: ctx.item2.id, adminId: ctx.admin.id, alasan: 'Bukti tidak jelas', ip });
    expect(rejected.status).toBe('ditolak');
    expect(rejected.alasanPenolakan).toBe('Bukti tidak jelas');
    const valRej = await prisma.validation.findFirst({ where: { submissionItemId: ctx.item2.id, aksi: 'reject' } });
    expect(valRej?.alasan).toBe('Bukti tidak jelas');
    const auditRej = await prisma.auditLog.findFirst({ where: { action: 'reject_submission', entityId: String(ctx.item2.id) } });
    expect(auditRej).toBeTruthy();
    const scoreAfterReject = await calculateSkorMadrasah(ctx.madrasah.id, ctx.periode.id);
    expect(scoreAfterReject.totalScore).toBeCloseTo(10, 4);
  });

  it('revoke disetujui → ditolak (keputusan resmi) + alasanPenolakan + skor turun', async () => {
    const revoked = await validationService.revokeSubmission({ id: ctx.item1.id, adminId: ctx.admin.id, alasan: 'Koreksi data salah', ip });
    expect(revoked.status).toBe('ditolak');
    expect(revoked.alasanPenolakan).toBe('Koreksi data salah');
    const valRev = await prisma.validation.findFirst({ where: { submissionItemId: ctx.item1.id, aksi: 'revoke' } });
    expect(valRev?.alasan).toBe('Koreksi data salah');
    const liveAfterRevoke = await calculateSkorMadrasah(ctx.madrasah.id, ctx.periode.id);
    expect(Number(liveAfterRevoke.totalScore)).toBeCloseTo(0, 4);
    const auditRev = await prisma.auditLog.findFirst({ where: { action: 'revoke_submission', entityId: String(ctx.item1.id) } });
    expect(auditRev?.dataSebelum?.status).toBe('disetujui');
    expect(auditRev?.dataSesudah?.status).toBe('ditolak');
  });

  it('revoke tanpa alasan → 400 MISSING_ALASAN', async () => {
    const item3 = await createMenunggu();
    await validationService.approveSubmission({ id: item3.id, adminId: ctx.admin.id, ip });
    await expect(
      validationService.revokeSubmission({ id: item3.id, adminId: ctx.admin.id, alasan: '   ', ip }),
    ).rejects.toMatchObject({ status: 400, code: 'MISSING_ALASAN' });
    await validationService.revokeSubmission({ id: item3.id, adminId: ctx.admin.id, alasan: 'cleanup', ip });
  });

  it('DeleteRequest approve → soft-delete + recalc', async () => {
    const itemDel = await createMenunggu();
    await validationService.approveSubmission({ id: itemDel.id, adminId: ctx.admin.id, ip });
    const scoreBeforeDel = await calculateSkorMadrasah(ctx.madrasah.id, ctx.periode.id);
    expect(scoreBeforeDel.totalScore).toBeCloseTo(10, 4);
    const delReq = await prisma.deleteRequest.create({
      data: { submissionItemId: itemDel.id, requestedById: ctx.operator.id, alasan: 'Salah input, minta hapus', status: 'menunggu' },
    });
    const dq = await validationService.getDeleteRequestsQueue({ status: 'menunggu' });
    expect(dq.data.some((d) => d.id === delReq.id)).toBe(true);
    const approvedDel = await validationService.approveDeleteRequest({ id: delReq.id, adminId: ctx.admin.id, ip });
    expect(approvedDel.status).toBe('disetujui');
    const soft = await prisma.submissionItem.findUnique({ where: { id: itemDel.id } });
    expect(soft.deletedAt).not.toBeNull();
    const scoreAfterDel = await calculateSkorMadrasah(ctx.madrasah.id, ctx.periode.id);
    expect(scoreAfterDel.totalScore).toBeCloseTo(0, 4);
    const auditDelAp = await prisma.auditLog.findFirst({ where: { action: 'approve_delete_request', entityId: String(delReq.id) } });
    expect(auditDelAp).toBeTruthy();
  });

  it('DeleteRequest reject tanpa alasan → 400, dengan alasan → ditolak tanpa hapus', async () => {
    const itemDel2 = await createMenunggu();
    await validationService.approveSubmission({ id: itemDel2.id, adminId: ctx.admin.id, ip });
    const delReq2 = await prisma.deleteRequest.create({
      data: { submissionItemId: itemDel2.id, requestedById: ctx.operator.id, alasan: 'Minta hapus 2', status: 'menunggu' },
    });
    await expect(
      validationService.rejectDeleteRequest({ id: delReq2.id, adminId: ctx.admin.id, alasan: '', ip }),
    ).rejects.toMatchObject({ status: 400 });
    const rejectedDel = await validationService.rejectDeleteRequest({ id: delReq2.id, adminId: ctx.admin.id, alasan: 'Tidak memenuhi syarat', ip });
    expect(rejectedDel.status).toBe('ditolak');
    expect(rejectedDel.alasanAdmin).toBe('Tidak memenuhi syarat');
    const notDeleted = await prisma.submissionItem.findUnique({ where: { id: itemDel2.id } });
    expect(notDeleted.deletedAt).toBeNull();
    const scoreAfterRejDel = await calculateSkorMadrasah(ctx.madrasah.id, ctx.periode.id);
    expect(scoreAfterRejDel.totalScore).toBeCloseTo(10, 4);
    const auditDelRej = await prisma.auditLog.findFirst({ where: { action: 'reject_delete_request', entityId: String(delReq2.id) } });
    expect(auditDelRej).toBeTruthy();
  });

  it('Atomicity — approve gagal di tengah (FK invalid) → rollback semua', async () => {
    const itemAtom = await createMenunggu();
    const invalidAdminId = 999999; // melanggar FK Validation.validatorId
    await expect(
      validationService.approveSubmission({ id: itemAtom.id, adminId: invalidAdminId, ip }),
    ).rejects.toBeTruthy();
    const after = await prisma.submissionItem.findUnique({ where: { id: itemAtom.id } });
    expect(after.status).toBe('menunggu');
    const noValAtom = await prisma.validation.findFirst({ where: { submissionItemId: itemAtom.id } });
    expect(noValAtom).toBeNull();
    const scoreAtom = await calculateSkorMadrasah(ctx.madrasah.id, ctx.periode.id);
    expect(scoreAtom.totalScore).toBeCloseTo(10, 4);
  });

  it('Pagination + filter kombinasi', async () => {
    await Promise.all([createMenunggu(), createMenunggu(), createMenunggu()]);
    const paged = await validationService.getValidasiQueue({ status: 'menunggu', periodeId: String(ctx.periode.id), page: '1', limit: '2' });
    expect(paged.data.length).toBe(2);
    expect(paged.limit).toBe(2);
    expect(paged.total).toBeGreaterThanOrEqual(3);
    const filteredByMadrasah = await validationService.getValidasiQueue({ madrasahId: String(ctx.madrasah.id), periodeId: String(ctx.periode.id) });
    expect(filteredByMadrasah.total).toBeGreaterThanOrEqual(paged.total);
  });
});

/**
 * Publik + Admin Integration Test — BIMA UNGGUL (port legacy tests/testPublicAndAdminE2E.js).
 * Verifikasi: linkBukti isolasi, finalisasi lock, bobot lock, PDF/Excel buffer, periode, akun, audit-log.
 *
 * Controllers dipanggil langsung via mockRes (bukan HTTP server) — kontrak respon JSON tetap terjaga.
 * Data fixture: prefix PUBADM + periode PUBADM/2026 — dibersihkan sebelum & sesudah.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/db/prisma.js';
import * as publicController from '../src/controllers/publicController.js';
import * as periodService from '../src/services/periodService.js';
import * as bobotService from '../src/services/bobotService.js';
import * as accountService from '../src/services/accountService.js';
import * as exportService from '../src/services/exportService.js';
import { calculateSkorMadrasah } from '../src/services/scoringService.js';
import * as auditLogController from '../src/controllers/admin/auditLogController.js';

const NS = 'PUBADM';
const ip = '127.0.0.1-e2e-final';

function mockRes() {
  let statusCode = 200, body, headers = {}, buf;
  return {
    status(c) { statusCode = c; return this; },
    json(d) { body = d; return this; },
    send(d) { buf = d; body = d; return this; },
    setHeader(k, v) { headers[k] = v; },
    get statusCode() { return statusCode; },
    get body() { return body; },
    get headers() { return headers; },
    get buf() { return buf; },
  };
}

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
  await prisma.user.deleteMany({ where: { OR: [{ nip: { startsWith: NS } }, { email: { contains: '@test.local' } }] } }).catch(() => {});
  await prisma.auditLog.deleteMany({ where: { ipAddress: ip } }).catch(() => {});
}

async function setup() {
  const admin = await prisma.user.create({
    data: { nip: `${NS}-ADM-01`, password: 'hash', name: 'Admin Final', email: `adm-${Date.now()}@test.local`, role: 'admin', status: 'aktif' },
  });
  const madrasah = await prisma.madrasah.create({
    data: {
      nomorMadrasah: `BMU-${NS}-001`,
      namaMadrasah: `Madrasah ${NS}`,
      jenjang: 'MI',
      statusKepemilikan: 'Negeri',
      jumlahSiswa: 120,
      alamat: 'Jl Final',
      slug: `slug-${NS.toLowerCase()}-${Date.now()}`,
      kelompok: 'MI Negeri',
    },
  });
  const operator = await prisma.user.create({
    data: { password: 'hash', name: 'Op Final', email: `op-${Date.now()}@test.local`, role: 'operator', status: 'aktif', madrasahId: madrasah.id },
  });
  // bersihkan periode aktif lain dari test sebelumnya agar madrasahDetail auto-select tidak salah periode
  await prisma.periodePenilaian.deleteMany({ where: { namaPeriode: { startsWith: 'E2E-' } } }).catch(() => {});
  await prisma.periodePenilaian.deleteMany({ where: { namaPeriode: { startsWith: 'TEST' } } }).catch(() => {});
  const periode = await prisma.periodePenilaian.create({
    data: { namaPeriode: `${NS}/2026`, tahunCapaian: 2026, tanggalMulai: new Date('2099-01-02'), tanggalCutoff: new Date('2099-12-31'), status: 'aktif' },
  });
  const indikators = await prisma.indikator.findMany();
  const diklat = indikators.find((i) => i.slug === 'diklat');
  if (!diklat) throw new Error('Indikator diklat belum seeded. Jalankan prisma db seed dulu.');
  await prisma.bobotIndikator.create({ data: { indikatorId: diklat.id, periodeId: periode.id, nilaiBobot: 10, terkunci: false } });
  const item = await prisma.submissionItem.create({
    data: {
      madrasahId: madrasah.id,
      indikatorId: diklat.id,
      periodeId: periode.id,
      createdById: operator.id,
      namaKegiatan: 'Kegiatan Final Link',
      linkBukti: 'https://secret.example.com/bukti.pdf',
      status: 'disetujui',
    },
  });
  await prisma.validation.create({ data: { submissionItemId: item.id, validatorId: admin.id, aksi: 'approve' } });
  return { admin, operator, madrasah, periode, diklat, item };
}

describe('Publik & Admin (PUBADM)', () => {
  let ctx;

  beforeAll(async () => {
    await cleanup();
    ctx = await setup();
  });

  afterAll(async () => {
    await cleanup();
  });

  it('GET /api/leaderboard publik (tanpa auth) — filter periode+kelompok', async () => {
    const req = { query: { periodeId: String(ctx.periode.id), kelompok: 'MI Negeri' } };
    const res = mockRes();
    await publicController.leaderboard(req, res);
    expect(res.body.rankings.length).toBeGreaterThanOrEqual(1);
    expect(res.body.rankings[0].totalScore).toBeCloseTo(10, 4);
  });

  it('GET /api/madrasah/:slug — isolasi linkBukti', async () => {
    const req = { params: { slug: ctx.madrasah.slug }, query: { periodeId: String(ctx.periode.id) } };
    const res = mockRes();
    await publicController.madrasahDetail(req, res);
    expect(res.body.madrasah.slug).toBe(ctx.madrasah.slug);
    expect(Array.isArray(res.body.prestasi)).toBe(true);
    expect(res.body.prestasi.length).toBeGreaterThanOrEqual(1);
    expect('linkBukti' in res.body.prestasi[0]).toBe(false);
    expect(res.body.skor.totalScore).toBeCloseTo(10, 4);
  });

  it('Periode CRUD GET/POST/PATCH', async () => {
    const list = await periodService.listPeriode({});
    expect(list.length).toBeGreaterThanOrEqual(1);
    // pre-cleanup idempoten: sisa periode dari run sebelumnya (pola api.integration.test.js)
    const existing = await prisma.periodePenilaian.findFirst({ where: { namaPeriode: '2100/2101' } });
    if (existing) await prisma.periodePenilaian.delete({ where: { id: existing.id } });

    // Window 2100 — tidak overlap fixture PUBADM/2026 (2099) maupun periode lain
    // (guard satu-periode-aktif: scenario legacy dulu pakai 2099/2100 & 2099-01-01,
    // yang kini overlap fixture sendiri → 409 sejak guard ditambahkan).
    const created = await periodService.createPeriode(
      { namaPeriode: '2100/2101', tanggalMulai: '2100-01-01', tanggalCutoff: '2101-12-31' },
      { userId: ctx.admin.id, ip },
    );
    expect(created.namaPeriode).toBe('2100/2101');
    expect(created.tahunCapaian).toBe(2100);
    const patched = await periodService.updatePeriode(created.id, { status: 'aktif' }, { userId: ctx.admin.id, ip });
    // updatePeriode return statusEfektif (deriveStatus dari tanggal), bukan raw DB —
    // window 2100 = masa depan → 'belum_dimulai' (konsisten kontrak app, cf. periodService:147)
    expect(patched.status).toBe('belum_dimulai');
    // delete tanpa catch — kalau gagal, biarkan test terlihat
    await prisma.periodePenilaian.delete({ where: { id: created.id } });
  });

  it('Finalisasi lock — submission & bobot terkunci (423)', async () => {
    const fin = await periodService.finalizePeriode(ctx.periode.id, { userId: ctx.admin.id, ip });
    expect(fin.status).toBe('finalisasi');
    const locked = await prisma.bobotIndikator.findMany({ where: { periodeId: ctx.periode.id } });
    expect(locked.every((b) => b.terkunci === true)).toBe(true);
    const audit = await prisma.auditLog.findFirst({ where: { action: 'finalize_period', entityId: String(ctx.periode.id) } });
    expect(audit).toBeTruthy();
    await expect(
      periodService.updatePeriode(ctx.periode.id, { namaPeriode: 'X/Y' }, { userId: ctx.admin.id, ip }),
    ).rejects.toMatchObject({ status: expect.any(Number) });
    await expect(
      bobotService.updateBobot({ periodeId: String(ctx.periode.id), bobots: [{ indikatorId: ctx.diklat.id, nilaiBobot: 99 }] }, { userId: ctx.admin.id, ip }),
    ).rejects.toMatchObject({ status: 423 });
  });

  it('Reopen — alasan wajib + audit reopen_period + unlock bobot', async () => {
    await expect(
      periodService.reopenPeriode(ctx.periode.id, { alasan: '', userId: ctx.admin.id, ip }),
    ).rejects.toMatchObject({ status: 400 });
    const reopened = await periodService.reopenPeriode(ctx.periode.id, { alasan: 'Koreksi nilai', userId: ctx.admin.id, ip });
    expect(reopened.status).toBe('aktif');
    const audit = await prisma.auditLog.findFirst({ where: { action: 'reopen_period', entityId: String(ctx.periode.id) } });
    expect(audit?.alasan).toBe('Koreksi nilai');
    const unlocked = await prisma.bobotIndikator.findMany({ where: { periodeId: ctx.periode.id } });
    expect(unlocked.every((b) => !b.terkunci)).toBe(true);
  });

  it('Bobot GET/PATCH — recalc skor + audit update_bobot', async () => {
    const before = await bobotService.listBobot({ periodeId: String(ctx.periode.id) });
    expect(before.data.length).toBeGreaterThanOrEqual(1);
    const patched = await bobotService.updateBobot(
      { periodeId: String(ctx.periode.id), bobots: [{ indikatorId: ctx.diklat.id, nilaiBobot: 20 }] },
      { userId: ctx.admin.id, ip },
    );
    expect(patched[0].nilaiBobot).toBe(20);
    const score = await calculateSkorMadrasah(ctx.madrasah.id, ctx.periode.id);
    expect(score.totalScore).toBeCloseTo(20, 4);
    const audit = await prisma.auditLog.findFirst({ where: { action: 'update_bobot' } });
    expect(audit).toBeTruthy();
    await bobotService.updateBobot(
      { periodeId: String(ctx.periode.id), bobots: [{ indikatorId: ctx.diklat.id, nilaiBobot: 10 }] },
      { userId: ctx.admin.id, ip },
    );
  });

  it('Bobot tolak saat finalisasi (423)', async () => {
    await periodService.finalizePeriode(ctx.periode.id, { userId: ctx.admin.id, ip });
    await expect(
      bobotService.updateBobot({ periodeId: String(ctx.periode.id), bobots: [{ indikatorId: ctx.diklat.id, nilaiBobot: 30 }] }, { userId: ctx.admin.id, ip }),
    ).rejects.toMatchObject({ status: 423 });
    await periodService.reopenPeriode(ctx.periode.id, { alasan: 'unlock for cleanup', userId: ctx.admin.id, ip });
  });

  it('Akun GET/POST/PATCH + duplicate email 409 + admin wajib nip', async () => {
    const list = await accountService.listAkun({ page: '1', limit: '5' });
    expect(list.total).toBeGreaterThanOrEqual(2);
    // operator: tanpa nip (login via email)
    const created = await accountService.createAkun(
      { name: 'New User', email: `new-${Date.now()}@test.local`, password: 'Password123', role: 'operator' },
      { userId: ctx.admin.id, ip },
    );
    expect(created.nip).toBeNull();
    const patched = await accountService.updateAkun(created.id, { status: 'nonaktif' }, { userId: ctx.admin.id, ip });
    expect(patched.status).toBe('nonaktif');
    const audit = await prisma.auditLog.findFirst({ where: { action: 'update_account', entityId: String(created.id) } });
    expect(audit).toBeTruthy();
    // duplikat email operator -> 409
    await expect(
      accountService.createAkun({ name: 'Dup', email: created.email, password: 'Password123' }, { userId: ctx.admin.id, ip }),
    ).rejects.toMatchObject({ status: 409 });
    // admin tanpa nip -> 400
    await expect(
      accountService.createAkun({ name: 'No Nip Admin', email: `nonip-${Date.now()}@test.local`, password: 'Password123', role: 'admin' }, { userId: ctx.admin.id, ip }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('Export PDF — buffer %PDF', async () => {
    const buf = await exportService.buildPdfBuffer({ periodeId: String(ctx.periode.id), kelompok: 'MI Negeri' });
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.slice(0, 4).toString()).toBe('%PDF');
    expect(buf.length).toBeGreaterThan(1000);
  });

  it('Export Excel — buffer PK (xlsx)', async () => {
    const buf = await exportService.buildExcelBuffer({ periodeId: String(ctx.periode.id), kelompok: 'MI Negeri' });
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.slice(0, 2).toString()).toBe('PK');
    expect(buf.length).toBeGreaterThan(1000);
  });

  it('AuditLog filter + pagination (via controller)', async () => {
    const total = await prisma.auditLog.count({ where: { ipAddress: ip } });
    expect(total).toBeGreaterThanOrEqual(5);
    const req = { query: { action: 'update_bobot', page: '1', limit: '2' } };
    const res = mockRes();
    await auditLogController.list(req, res);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
  });
});

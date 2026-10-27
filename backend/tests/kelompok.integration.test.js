import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { prisma } from '../src/db/prisma.js';
import { register } from '../src/controllers/authController.js';
import { approveUserAndCreateMadrasah } from '../src/services/authService.js';
import { createMadrasah, listMadrasah } from '../src/services/madrasahService.js';
import { calculateRanking, calculateRankingAllGroups, calculateSkorMadrasah } from '../src/services/scoringService.js';
import { getValidasiQueue } from '../src/services/validationService.js';
import { updateBobot } from '../src/services/bobotService.js';
import { buildExcelBuffer, buildPdfBuffer } from '../src/services/exportService.js';
import { migrateKelompok } from '../scripts/migrate-kelompok.mjs';
import { dbGate } from './helpers/dbGate.js';

// Semua cleanup dibatasi ID yang dibuat suite ini, termasuk audit maintenance.
describe.skipIf(!dbGate())('Empat kelompok: RA, periode lama, migrasi dan ekspor', () => {
  const ns = `GRP4-${Date.now()}`;
  const madrasahIds = [], userIds = [], periodIds = [], maintenanceAuditIds = [];
  let admin, indikators, periods, ra;

  beforeAll(async () => {
    admin = await prisma.user.create({ data: { name: ns, email: `${ns}@example.test`, password: 'fixture', role: 'admin', status: 'aktif' } });
    userIds.push(admin.id);
    indikators = await prisma.indikator.findMany({ orderBy: { id: 'asc' } });
    expect(indikators).toHaveLength(9);
    periods = [];
    for (const status of ['aktif', 'finalisasi', 'arsip']) {
      const periode = await prisma.periodePenilaian.create({ data: {
        namaPeriode: `${ns}-${status}`, tahunCapaian: 2026, status,
        tanggalMulai: new Date('2026-01-01'), tanggalCutoff: new Date('2026-12-31'),
      } });
      periodIds.push(periode.id);
      periods.push(periode);
      for (const indikator of indikators) await prisma.bobotIndikator.create({ data: {
        periodeId: periode.id, indikatorId: indikator.id, nilaiBobot: 10,
        bobotTingkatWilayah: { kabupaten: 10 }, bobotJenjang: { s1: 10 }, terkunci: status !== 'aktif',
      } });
    }
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { id: { in: maintenanceAuditIds } } });
    await prisma.submissionItem.deleteMany({ where: { periodeId: { in: periodIds } } });
    await prisma.bobotIndikator.deleteMany({ where: { periodeId: { in: periodIds } } });
    await prisma.periodePenilaian.deleteMany({ where: { id: { in: periodIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.madrasah.deleteMany({ where: { id: { in: madrasahIds } } });
  });

  it('pendaftaran/approval dan admin menerima RA negeri maupun swasta', async () => {
    ra = [];
    for (const statusKepemilikan of ['Negeri', 'Swasta']) {
      const madrasahData = { nama: `${ns}-daftar-${statusKepemilikan}`, jenjang: 'RA', statusKepemilikan, jumlahSiswa: 100, alamat: 'Alamat fixture RA' };
      const res = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
      await register({ body: { name: ns, email: `${ns}-${statusKepemilikan}@example.test`, password: 'FixturePass123', telepon: '081234567890', madrasahData }, ip: 'fixture-grp4' }, res);
      if (res.body?.user?.id) userIds.push(res.body.user.id);
      expect(res.code).toBe(201);
      const approved = await approveUserAndCreateMadrasah(res.body.user.id, madrasahData);
      madrasahIds.push(approved.madrasah.id);
      ra.push(approved.madrasah);
      expect(approved.user).toMatchObject({ id: res.body.user.id, madrasahId: approved.madrasah.id, status: 'aktif' });
      expect(approved.madrasah).toMatchObject({ kelompok: 'RA', jenjang: 'RA', statusKepemilikan });
      const created = await createMadrasah({ ...madrasahData, namaMadrasah: `${ns}-admin-${statusKepemilikan}` }, { userId: admin.id, ip: 'fixture-grp4' });
      madrasahIds.push(created.id);
      expect(created).toMatchObject({ kelompok: 'RA', statusKepemilikan });
    }
  });

  it('sembilan indikator RA memakai bobot yang sama dengan MI pada setiap status periode', async () => {
    const mi = await createMadrasah({ namaMadrasah: `${ns}-MI`, jenjang: 'MI', statusKepemilikan: 'Negeri', jumlahSiswa: 100, alamat: 'Alamat fixture' }, { userId: admin.id, ip: 'fixture-grp4' });
    madrasahIds.push(mi.id);
    for (const periode of periods) {
      for (const m of [...ra, mi]) {
        for (const indikator of indikators) {
          const item = await prisma.submissionItem.create({ data: {
            madrasahId: m.id, periodeId: periode.id, indikatorId: indikator.id, createdById: admin.id,
            namaKegiatan: `${ns}-${indikator.slug}`, linkBukti: 'https://example.test/tka-anbk-2026.pdf',
            status: 'disetujui', tingkatWilayah: 'kabupaten', jenjangPendidikan: 's1', jumlah: 1, pembilang: 50, penyebut: 100,
          } });
          await prisma.validation.create({ data: { submissionItemId: item.id, validatorId: admin.id, aksi: 'approve', createdAt: new Date('2026-01-02') } });
        }
      }
      const expected = await calculateSkorMadrasah(mi.id, periode.id);
      expect(expected.indikatorCount).toBe(9);
      expect(expected.totalScore).toBe(80);
      for (const m of ra) expect(await calculateSkorMadrasah(m.id, periode.id)).toEqual(expected);
      const ranking = await calculateRanking('RA Negeri', periode.id);
      const rankedPair = ranking.filter((r) => ra.some((m) => m.id === r.madrasah.id));
      expect(rankedPair.map((r) => r.madrasah.id)).toEqual([...ra].sort((a, b) => a.nomorMadrasah.localeCompare(b.nomorMadrasah)).map((m) => m.id));
      expect(rankedPair.map((r) => r.ranking)).toEqual([1, 2]);
      expect(new Set(rankedPair.map((r) => r.madrasah.statusKepemilikan)).size).toBe(2);
      expect(Object.keys(await calculateRankingAllGroups(periode.id))).toEqual(['RA', 'MI', 'MTs', 'MA']);
      if (periode.status !== 'aktif') await expect(updateBobot({ periodeId: String(periode.id), bobots: [{ indikatorId: indikators[0].id, nilaiBobot: 99 }] }, { userId: admin.id, ip: 'fixture-grp4' })).rejects.toMatchObject({ status: 423 });
    }
  });

  it('filter admin dan validasi menggabungkan kepemilikan serta menolak kelompok asing', async () => {
    const list = await listMadrasah({ kelompok: 'RA Swasta', q: ns });
    expect(list.data).toHaveLength(4);
    expect(new Set(list.data.map((m) => m.statusKepemilikan)).size).toBe(2);
    const queue = await getValidasiQueue({ kelompok: 'RA Negeri', periodeId: String(periods[0].id) });
    expect(queue.total).toBe(18);
    expect(queue.data.every((s) => s.madrasah.kelompok === 'RA')).toBe(true);
    await expect(listMadrasah({ kelompok: 'TK' })).rejects.toMatchObject({ status: 400 });
    await expect(getValidasiQueue({ kelompok: 'TK' })).rejects.toMatchObject({ status: 400 });
  });

  it('ekspor RA negeri/swasta pada periode arsip berisi ranking gabungan', async () => {
    const filter = { periodeId: String(periods[2].id), kelompok: 'RA Swasta' };
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await buildExcelBuffer(filter));
    const rows = [];
    wb.getWorksheet('Leaderboard').eachRow((row) => rows.push(row.values));
    for (const m of ra) expect(rows.some((r) => r.includes(m.namaMadrasah) && r.includes('RA') && r.includes(80))).toBe(true);
    expect((await buildPdfBuffer(filter)).subarray(0, 4).toString()).toBe('%PDF');
  });

  it('dry-run tidak menulis; apply mencakup nonaktif/kapitalisasi dan idempoten', async () => {
    const stale = await prisma.madrasah.create({ data: { nomorMadrasah: `${ns}-stale`, namaMadrasah: `${ns}-stale`, slug: `${ns}-stale`, jenjang: 'MTs', statusKepemilikan: 'Swasta', jumlahSiswa: 10, alamat: 'Fixture', kelompok: 'MTS', deletedAt: new Date() } });
    madrasahIds.push(stale.id);
    const before = await prisma.madrasah.findUnique({ where: { id: stale.id } });
    const auditBefore = await prisma.auditLog.findMany({ where: { action: 'migrate_kelompok_jenjang' }, select: { id: true } });
    expect(await migrateKelompok(prisma)).toMatchObject({ changes: 1, updated: 0 });
    expect(await prisma.madrasah.findUnique({ where: { id: stale.id } })).toEqual(before);
    const applied = await migrateKelompok(prisma, { apply: true });
    const audits = await prisma.auditLog.findMany({ where: { action: 'migrate_kelompok_jenjang', id: { notIn: auditBefore.map((a) => a.id) } } });
    maintenanceAuditIds.push(...audits.map((a) => a.id));
    expect(applied).toMatchObject({ changes: 1, updated: 1 });
    expect(audits).toHaveLength(1);
    const after = await prisma.madrasah.findUnique({ where: { id: stale.id } });
    expect(after).toEqual({ ...before, kelompok: 'MTs', updatedAt: expect.any(Date) });
    expect(await migrateKelompok(prisma, { apply: true })).toMatchObject({ changes: 0, updated: 0 });
    expect(await prisma.auditLog.count({ where: { action: 'migrate_kelompok_jenjang' } })).toBe(auditBefore.length + 1);
  });
});

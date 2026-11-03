import { afterAll, describe, expect, it, vi } from 'vitest';
import ExcelJS from 'exceljs';
import { prisma } from '../src/db/prisma.js';
import * as periodService from '../src/services/periodService.js';
import { saveItems, updateOwnItem } from '../src/services/submissionService.js';
import { approveSubmission, rejectSubmission } from '../src/services/validationService.js';
import { calculateSkorMadrasah } from '../src/services/scoringService.js';
import { buildExcelBuffer, buildPdfBuffer } from '../src/services/exportService.js';
import { listBobot } from '../src/services/bobotService.js';
import { dbGate } from './helpers/dbGate.js';

describe.skipIf(!dbGate())('guru bersertifikasi — pengajuan sampai laporan', () => {
  const ns = `CERT-${Date.now()}`;
  const userIds = [], madrasahIds = [];
  let periode;
  afterAll(async () => {
    vi.restoreAllMocks();
    if (periode) {
      await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.validation.deleteMany({ where: { submissionItem: { periodeId: periode.id } } });
      await prisma.submissionItem.deleteMany({ where: { periodeId: periode.id } });
      await prisma.bobotIndikator.deleteMany({ where: { periodeId: periode.id } });
      await prisma.periodePenilaian.delete({ where: { id: periode.id } });
    }
    await prisma.auditLog.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.madrasah.deleteMany({ where: { id: { in: madrasahIds } } });
  });

  it('draft, tolak/edit/kirim ulang, persetujuan, skor dan ekspor pada empat kelompok', async () => {
    const now = Date.now();
    periode = await prisma.periodePenilaian.create({ data: { namaPeriode: ns, tahunCapaian: 2026, tanggalMulai: new Date(now - 60000), tanggalCutoff: new Date(now + 3600000), status: 'aktif' } });
    vi.spyOn(periodService, 'resolveAktifPeriode').mockResolvedValue(periode);
    const indikator = await prisma.indikator.findUniqueOrThrow({ where: { slug: 'guru_bersertifikasi' } });
    const config = await listBobot({ periodeId: String(periode.id) });
    expect(config.data.map((i) => i.kode)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
    expect(config.data.at(-1)).toMatchObject({ nilaiBobot: 0, adaBobot: false });
    const admin = await prisma.user.create({ data: { name: ns, email: `${ns}-admin@example.test`, password: 'fixture', role: 'admin', status: 'aktif' } });
    userIds.push(admin.id);
    await prisma.bobotIndikator.create({ data: { periodeId: periode.id, indikatorId: indikator.id, nilaiBobot: 10 } });
    for (const kelompok of ['RA', 'MI', 'MTs', 'MA']) {
      const madrasah = await prisma.madrasah.create({ data: { nomorMadrasah: `${ns}-${kelompok}`, namaMadrasah: `${ns} ${kelompok}`, jenjang: kelompok, kelompok, statusKepemilikan: 'Swasta', jumlahSiswa: 100, alamat: 'Alamat fixture sertifikasi', slug: `${ns.toLowerCase()}-${kelompok.toLowerCase()}` } });
      madrasahIds.push(madrasah.id);
      const operator = await prisma.user.create({ data: { name: ns, email: `${ns}-${kelompok}@example.test`, password: 'fixture', role: 'operator', status: 'aktif', madrasahId: madrasah.id } });
      userIds.push(operator.id);
      const params = { indikatorId: indikator.id, userId: operator.id, madrasahId: madrasah.id, ip: ns };
      const draft = await saveItems({ ...params, targetStatus: 'draft', items: [{ pembilang: 2 }] });
      const submitted = await saveItems({ ...params, targetStatus: 'menunggu', items: [{ id: draft.data[0].id, pembilang: 2, penyebut: 4, linkBukti: 'https://example.com/sertifikat' }, { pembilang: 6, penyebut: 6, linkBukti: 'https://example.com/rekap' }] });
      expect((await calculateSkorMadrasah(madrasah.id, periode.id)).totalScore).toBe(0);
      const [first, second] = submitted.data;
      await rejectSubmission({ id: first.id, adminId: admin.id, alasan: 'Perjelas bukti', ip: ns });
      await updateOwnItem({ id: first.id, body: { pembilang: 2, penyebut: 4, linkBukti: 'https://example.com/bukti-baru' }, userId: operator.id, madrasahId: madrasah.id, ip: ns });
      for (const item of [first, second]) await approveSubmission({ id: item.id, adminId: admin.id, ip: ns });
      expect((await calculateSkorMadrasah(madrasah.id, periode.id)).breakdown.guru_bersertifikasi).toBe(8);
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(await buildExcelBuffer({ periodeId: periode.id, kelompok }));
      expect(wb.worksheets[0].getCell('E2').value).toBe(8);
    }
    expect((await buildPdfBuffer({ periodeId: periode.id })).subarray(0, 4).toString()).toBe('%PDF');
    vi.mocked(periodService.resolveAktifPeriode).mockResolvedValue({ ...periode, status: 'finalisasi' });
    await expect(saveItems({ indikatorId: indikator.id, userId: userIds[1], madrasahId: madrasahIds[0], targetStatus: 'menunggu', items: [{ pembilang: 0, penyebut: 0, linkBukti: 'https://example.com/bukti' }] })).rejects.toMatchObject({ code: 'PERIOD_CLOSED' });
  });
});

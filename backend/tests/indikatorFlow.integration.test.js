import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/db/prisma.js';
import { createMaster, addPeriod, updatePeriod, previewPeriod, listPeriod } from '../src/services/indikatorService.js';
import { saveItems, updateOwnItem } from '../src/services/submissionService.js';
import { approveSubmission, revokeSubmission } from '../src/services/validationService.js';
import { finalizePeriode } from '../src/services/periodService.js';
import { calculateSkorMadrasah } from '../src/services/scoringService.js';
import { buildExcelBuffer } from '../src/services/exportService.js';
import ExcelJS from 'exceljs';
import { defaultFields } from '../src/services/indikatorConfig.js';

describe('Indikator baru: konfigurasi → draft → submit → approve → ekspor', () => {
  let p, user, school;
  const ids = [];
  const actor = () => ({ userId: user.id, ip: '127.0.0.1' });
  beforeAll(async () => {
    const key = `FLOW-${Date.now()}`;
    p = await prisma.periodePenilaian.create({ data: { namaPeriode: key, tahunCapaian: 2026, tanggalMulai: new Date(Date.now() - 1000), tanggalCutoff: new Date(Date.now() + 3600000), status: 'aktif' } });
    school = await prisma.madrasah.create({ data: { nomorMadrasah: key, slug: key.toLowerCase(), namaMadrasah: key, jenjang: 'RA', kelompok: 'RA', statusKepemilikan: 'Swasta', jumlahSiswa: 100, alamat: 'Fixture' } });
    user = await prisma.user.create({ data: { name: 'Flow fixture', email: `${key}@test.local`, password: 'unused', role: 'admin', status: 'aktif', madrasahId: school.id } });
  });
  afterAll(async () => {
    if (p) await prisma.periodePenilaian.delete({ where: { id: p.id } });
    if (user) await prisma.user.delete({ where: { id: user.id } });
    if (school) await prisma.madrasah.delete({ where: { id: school.id } });
    await prisma.indikator.deleteMany({ where: { id: { in: ids } } });
  });
  for (const [formula, weight, data, score] of [
    ['per_capaian', { nilaiBobot: 2 }, [{}, {}, {}, {}, {}], 10],
    ['per_tingkat_wilayah', { bobotTingkatWilayah: { kabupaten: 3, provinsi: 5, nasional: 10, internasional: 20 } }, [{ tingkatWilayah: 'kabupaten' }, { tingkatWilayah: 'kabupaten' }, { tingkatWilayah: 'nasional' }], 16],
    ['per_jenjang', { bobotJenjang: { s1: 2, s2: 5, s3: 10 } }, [{ jenjangPendidikan: 's2', jumlah: 2 }, { jenjangPendidikan: 's3', jumlah: 1 }], 20],
    ['persentase', { nilaiBobot: 20 }, [{ pembilang: 80, penyebut: 100 }], 16],
  ]) it(`menjalankan metode ${formula} dan melindungi field yang sudah digunakan`, async () => {
    const slug = `flow_${formula}_${Date.now()}`;
    const master = await createMaster({ kode: slug, slug, nama: `Baru ${formula}`, deskripsi: 'Penjelasan untuk publik dan operator', tipeFormula: formula, aktif: true }, actor());
    ids.push(master.id);
    await addPeriod(p.id, { indikatorId: master.id }, actor());
    await prisma.$transaction((tx) => updatePeriod(tx, p.id, master.id, { revision: 1, ...weight, menerimaInput: true }, actor()));
    expect((await previewPeriod(p.id, master.id, { revision: 2, items: data })).totalScore).toBe(score);
    const draft = await saveItems({ indikatorId: master.id, revision: 2, items: [{ namaKegiatan: 'Draft' }], targetStatus: 'draft', userId: user.id, madrasahId: school.id, ip: 'test' });
    expect(draft.data[0].linkBukti).toBeNull();
    const alternative = formula === 'per_capaian' ? 'persentase' : 'per_capaian';
    await expect(prisma.$transaction((tx) => updatePeriod(tx, p.id, master.id, { revision: 2, tipeFormula: alternative, fields: defaultFields(alternative) }, actor()))).rejects.toMatchObject({ status: 409, code: 'CONFIG_IN_USE' });
    const items = data.map((i, n) => ({ ...i, ...(n === 0 ? { id: draft.data[0].id } : {}), namaKegiatan: 'Capaian baru', linkBukti: 'https://example.com/bukti' }));
    const submitted = await saveItems({ indikatorId: master.id, revision: 2, items, targetStatus: 'menunggu', userId: user.id, madrasahId: school.id, ip: 'test' });
    for (const item of submitted.data) await approveSubmission({ id: item.id, adminId: user.id, ip: 'test' });
    expect((await calculateSkorMadrasah(school.id, p.id)).breakdown[slug]).toBe(score);
    const config = (await listPeriod(p.id)).find((c) => c.id === master.id);
    await prisma.$transaction((tx) => updatePeriod(tx, p.id, master.id, { revision: config.revision, deskripsi: 'Koreksi informasi', menerimaInput: false }, actor()));
    await expect(updateOwnItem({ id: submitted.data[0].id, body: {}, userId: user.id, madrasahId: school.id })).rejects.toMatchObject({ status: 400 });
    await expect(saveItems({ indikatorId: master.id, items: [{}], targetStatus: 'draft', userId: user.id, madrasahId: school.id })).rejects.toMatchObject({ status: 423 });
    expect((await calculateSkorMadrasah(school.id, p.id)).breakdown[slug]).toBe(score);
  });
  it('ekspor memiliki kolom indikator baru dan skor numerik', async () => {
    const buffer = await buildExcelBuffer({ periodeId: p.id, kelompok: 'RA' });
    const wb = new ExcelJS.Workbook(); await wb.xlsx.load(buffer);
    const ws = wb.getWorksheet('Rincian Indikator');
    expect(ws.getRow(1).values).toContain('Baru persentase');
    const row = ws.getRows(2, ws.rowCount - 1).find((r) => r.getCell(1).value === school.nomorMadrasah);
    expect(row.values.slice(3)).toEqual([10, 16, 20, 16]);
  });
  it('finalisasi juga mengunci mutasi validasi agar skor historis tidak berubah', async () => {
    await finalizePeriode(p.id, actor());
    const item = await prisma.submissionItem.findFirst({ where: { periodeId: p.id, status: 'disetujui' } });
    await expect(revokeSubmission({ id: item.id, adminId: user.id, alasan: 'Uji finalisasi', ip: 'test' })).rejects.toMatchObject({ status: 423 });
    expect((await calculateSkorMadrasah(school.id, p.id)).totalScore).toBe(62);
  });
});

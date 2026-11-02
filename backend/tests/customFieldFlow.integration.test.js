import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/db/prisma.js';
import { createMaster, updateMaster, addPeriod, updatePeriod, previewPeriod, listPeriod, copyWeights } from '../src/services/indikatorService.js';
import { defaultFields } from '../src/services/indikatorConfig.js';
import { saveItems, updateOwnItem } from '../src/services/submissionService.js';
import { approveSubmission } from '../src/services/validationService.js';
import { calculateSkorMadrasah } from '../src/services/scoringService.js';
import { madrasahDetail } from '../src/controllers/publicController.js';
import { buildExcelBuffer, buildPdfBuffer } from '../src/services/exportService.js';
import ExcelJS from 'exceljs';
const duration = { source: 'custom', key: 'cf_duration', type: 'decimal', label: 'Durasi Diklat', required: true, visibility: 'internal', min: 0, max: 1000, precision: 3 };
const partner = { source: 'custom', key: 'cf_partner', type: 'boolean', label: 'Mitra', required: true, visibility: 'public' };

describe('Field kustom melalui layanan aplikasi', () => {
  let p, ind, user, school, item;
  const extra = [], periods = [];
  const actor = () => ({ userId: user.id, ip: 'custom-test' });
  beforeAll(async () => {
    const s = `CUSTOM-FLOW-${Date.now()}`;
    p = await prisma.periodePenilaian.create({ data: { namaPeriode: s, tahunCapaian: 2026, tanggalMulai: new Date(Date.now() - 1000), tanggalCutoff: new Date(Date.now() + 3600000), status: 'aktif' } });
    school = await prisma.madrasah.create({ data: { nomorMadrasah: s, slug: s.toLowerCase(), namaMadrasah: s, jenjang: 'RA', kelompok: 'RA', statusKepemilikan: 'Swasta', jumlahSiswa: 20, alamat: 'Fixture' } });
    user = await prisma.user.create({ data: { name: s, email: `${s}@fixture.invalid`, password: 'not-used', role: 'admin', status: 'aktif', madrasahId: school.id } });
  });
  afterAll(async () => {
    if (p) await prisma.periodePenilaian.delete({ where: { id: p.id } });
    for (const period of periods) await prisma.periodePenilaian.delete({ where: { id: period.id } });
    for (const row of extra) await prisma.indikator.delete({ where: { id: row.id } });
    if (ind) await prisma.indikator.delete({ where: { id: ind.id } });
    if (user) await prisma.user.delete({ where: { id: user.id } });
    if (school) await prisma.madrasah.delete({ where: { id: school.id } });
  });
  it('menerima field baru dan menyalin binding ke snapshot periode', async () => {
    const s = `custom_${Date.now()}`;
    ind = await createMaster({ kode: s, slug: s, nama: 'Diklat kustom', short: 'Kustom', deskripsi: 'Informasi indikator', aktif: true, tipeFormula: 'per_jumlah', fields: [...defaultFields('per_jumlah'), duration, partner], scoringConfig: { quantity: { source: 'custom', key: duration.key } } }, actor());
    await addPeriod(p.id, { indikatorId: ind.id }, actor());
    await prisma.$transaction((tx) => updatePeriod(tx, p.id, ind.id, { revision: 1, nilaiBobot: 2, menerimaInput: true }, actor()));
    expect((await listPeriod(p.id))[0].scoringConfig).toEqual(ind.scoringConfig);
  });
  it('draft → PATCH mempertahankan nol/false dan mengunci struktur/binding', async () => {
    item = (await saveItems({ indikatorId: ind.id, periodeId: p.id, revision: 2, items: [{ namaKegiatan: 'Draf', customValues: { cf_duration: 0, cf_partner: false } }], targetStatus: 'draft', userId: user.id, madrasahId: school.id })).data[0];
    const edited = await updateOwnItem({ id: item.id, body: { status: 'draft', catatan: 'Koreksi' }, userId: user.id, madrasahId: school.id });
    expect(edited.customValues).toEqual({ cf_duration: 0, cf_partner: false });
    await expect(prisma.$transaction((tx) => updatePeriod(tx, p.id, ind.id, { revision: 2, scoringConfig: null }, actor()))).rejects.toMatchObject({ status: 400 });
    await expect(updateOwnItem({ id: item.id, body: { status: 'draft', customValues: { status: 'disetujui' } }, userId: user.id, madrasahId: school.id })).rejects.toMatchObject({ status: 400 });
  });
  it('submit membutuhkan sumber skor dan preview sama dengan hasil persetujuan', async () => {
    await expect(updateOwnItem({ id: item.id, body: { customValues: { cf_duration: null }, linkBukti: 'https://example.com/bukti' }, userId: user.id, madrasahId: school.id })).rejects.toMatchObject({ status: 400 });
    const example = [{ customValues: { cf_duration: 6 } }, { customValues: { cf_duration: 4 } }];
    expect((await previewPeriod(p.id, ind.id, { revision: 2, items: example })).totalScore).toBe(20);
    for (const n of [1001, 1.1234]) await expect(previewPeriod(p.id, ind.id, { revision: 2, items: [{ customValues: { cf_duration: n } }] })).rejects.toMatchObject({ status: 400 });
    const result = await saveItems({ indikatorId: ind.id, periodeId: p.id, revision: 2, items: example.map((r, n) => ({ ...r, ...(n === 0 ? { id: item.id } : {}), namaKegiatan: 'Diklat', linkBukti: 'https://example.com/bukti', customValues: { ...r.customValues, cf_partner: false } })), targetStatus: 'menunggu', userId: user.id, madrasahId: school.id });
    for (const row of result.data) await approveSubmission({ id: row.id, adminId: user.id, ip: 'custom-test' });
    expect((await calculateSkorMadrasah(school.id, p.id)).totalScore).toBe(20);
  });
  it('publik hanya menerima field public; snapshot tidak mengikuti perubahan master', async () => {
    await updateMaster(ind.id, { revision: ind.revision, fields: defaultFields('per_capaian'), tipeFormula: 'per_capaian', scoringConfig: null }, actor());
    expect((await listPeriod(p.id))[0].fields).toContainEqual(duration);
    let data;
    await madrasahDetail({ params: { slug: school.slug }, query: { periodeId: p.id } }, { json: (value) => { data = value; } });
    expect(data.prestasi).toHaveLength(2);
    for (const row of data.prestasi) { expect(row.customValues).toEqual({ cf_partner: false }); expect(row).not.toHaveProperty('linkBukti'); }
  });
  it('kategori: simulasi 23, bobot dapat berubah tetapi binding tetap terkunci dan salin kompatibel', async () => {
    const category = { source: 'custom', key: 'cf_category', type: 'select', label: 'Kategori', required: true, visibility: 'public', options: [{ value: 'opt_online', label: 'Daring' }, { value: 'opt_offline', label: 'Tatap muka' }] };
    const s = `category_${Date.now()}`;
    const scoringConfig = { category: { source: 'custom', key: category.key }, quantity: { source: 'custom', key: duration.key }, weights: { opt_online: 2, opt_offline: 5 } };
    const master = await createMaster({ kode: s, slug: s, nama: 'Kategori uji', deskripsi: 'Deskripsi', aktif: true, tipeFormula: 'per_kategori', fields: [...defaultFields('per_kategori'), duration, category], scoringConfig }, actor()); extra.push(master);
    await addPeriod(p.id, { indikatorId: master.id }, actor());
    await prisma.$transaction((tx) => updatePeriod(tx, p.id, master.id, { revision: 1, menerimaInput: true }, actor()));
    const examples = [{ customValues: { cf_category: 'opt_online', cf_duration: 4 } }, { customValues: { cf_category: 'opt_offline', cf_duration: 3 } }];
    expect((await previewPeriod(p.id, master.id, { revision: 2, items: examples })).totalScore).toBe(23);
    const saved = await saveItems({ indikatorId: master.id, periodeId: p.id, revision: 2, items: examples.map((row) => ({ ...row, namaKegiatan: '=SUM(1,1)', linkBukti: 'https://example.com/bukti' })), targetStatus: 'menunggu', userId: user.id, madrasahId: school.id });
    for (const row of saved.data) await approveSubmission({ id: row.id, adminId: user.id });
    expect((await calculateSkorMadrasah(school.id, p.id)).breakdown[s]).toBe(23);
    await prisma.$transaction((tx) => updatePeriod(tx, p.id, master.id, { revision: 2, scoringConfig: { ...scoringConfig, weights: { opt_online: 3, opt_offline: 5 } } }, actor()));
    expect((await calculateSkorMadrasah(school.id, p.id)).breakdown[s]).toBe(27);
    await expect(prisma.$transaction((tx) => updatePeriod(tx, p.id, master.id, { revision: 3, scoringConfig: { ...scoringConfig, quantity: { source: 'custom', key: 'cf_unknown' } } }, actor()))).rejects.toMatchObject({ status: 400 });
    const dest = await prisma.periodePenilaian.create({ data: { namaPeriode: `${s}-dest`, tahunCapaian: 2027, tanggalMulai: new Date(Date.now() + 86400000), tanggalCutoff: new Date(Date.now() + 172800000), status: 'belum_dimulai' } }); periods.push(dest);
    await addPeriod(dest.id, { indikatorId: master.id }, actor());
    expect((await copyWeights(dest.id, { sourcePeriodeId: p.id, revisions: { [master.id]: 1 } }, actor())).copied).toBe(1);
    expect((await listPeriod(dest.id))[0].scoringConfig.weights.opt_online).toBe(3);
  });
  it('rasio custom menolak pembilang melebihi penyebut saat submit; agregasi bukan rata-rata baris', async () => {
    const s = `ratio_${Date.now()}`, a = { ...duration, type: 'integer', key: 'cf_a', label: 'Memenuhi' }, b = { ...duration, type: 'integer', key: 'cf_b', label: 'Total' }; delete a.precision; delete b.precision;
    const master = await createMaster({ kode: s, slug: s, nama: 'Rasio uji', deskripsi: 'Rasio', aktif: true, tipeFormula: 'persentase', fields: [...defaultFields('per_capaian'), a, b], scoringConfig: { numerator: { source: 'custom', key: a.key }, denominator: { source: 'custom', key: b.key } } }, actor()); extra.push(master);
    await addPeriod(p.id, { indikatorId: master.id }, actor());
    await prisma.$transaction((tx) => updatePeriod(tx, p.id, master.id, { revision: 1, nilaiBobot: 20, menerimaInput: true }, actor()));
    const args = { indikatorId: master.id, periodeId: p.id, revision: 2, targetStatus: 'menunggu', userId: user.id, madrasahId: school.id };
    await expect(saveItems({ ...args, items: [{ namaKegiatan: 'Invalid', linkBukti: 'https://example.com', customValues: { cf_a: 81, cf_b: 80 } }] })).rejects.toMatchObject({ status: 400, code: 'INVALID_SCORE_RATIO' });
    expect(await prisma.submissionItem.count({ where: { indikatorId: master.id } })).toBe(0);
    expect((await previewPeriod(p.id, master.id, { revision: 2, items: [{ customValues: { cf_a: 80, cf_b: 100 } }, { customValues: { cf_a: 0, cf_b: 100 } }] })).totalScore).toBe(8);
    const valid = await saveItems({ ...args, items: [80, 0].map((a) => ({ namaKegiatan: 'Rasio valid', linkBukti: 'https://example.com', customValues: { cf_a: a, cf_b: 100 } })) });
    for (const row of valid.data) await approveSubmission({ id: row.id, adminId: user.id });
    expect((await calculateSkorMadrasah(school.id, p.id)).breakdown[s]).toBe(8);
  });
  it('ekspor admin memuat rincian bertipe dan teks formula tetap teks', async () => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await buildExcelBuffer({ periodeId: p.id, kelompok: 'RA' }));
    const detail = workbook.getWorksheet('Rincian Capaian');
    expect(detail).toBeDefined();
    const cells = []; detail.eachRow((r) => r.eachCell((c) => cells.push(c.value)));
    expect(cells).toContain('Durasi Diklat'); expect(cells).toContain('Tidak'); expect(cells).toContain('Daring'); expect(cells).toContain('=SUM(1,1)');
    expect(cells.some((v) => v && typeof v === 'object' && 'formula' in v)).toBe(false);
    expect((await buildPdfBuffer({ periodeId: p.id, kelompok: 'RA', includeDetails: true })).slice(0, 4).toString()).toBe('%PDF');
  });
  it('perubahan bobot dan approval yang melampaui batas total dibatalkan secara atomik', async () => {
    const s = `limits_${Date.now()}`;
    const master = await createMaster({ kode: s, slug: s, nama: 'Batas hitung', deskripsi: 'Batas', aktif: true, tipeFormula: 'per_jumlah', fields: [...defaultFields('per_jumlah'), { ...duration, max: 1e9 }], scoringConfig: { quantity: { source: 'custom', key: duration.key } } }, actor()); extra.push(master);
    await addPeriod(p.id, { indikatorId: master.id }, actor());
    await prisma.$transaction((tx) => updatePeriod(tx, p.id, master.id, { revision: 1, nilaiBobot: 1, menerimaInput: true }, actor()));
    const result = await saveItems({ indikatorId: master.id, periodeId: p.id, revision: 2, items: [1, 2].map(() => ({ namaKegiatan: 'Batas', linkBukti: 'https://example.com', customValues: { cf_duration: 1e9 } })), targetStatus: 'menunggu', userId: user.id, madrasahId: school.id });
    await approveSubmission({ id: result.data[0].id, adminId: user.id });
    await expect(prisma.$transaction((tx) => updatePeriod(tx, p.id, master.id, { revision: 2, nilaiBobot: 1000 }, actor()))).rejects.toMatchObject({ status: 400, code: 'INVALID_SCORE_VALUE' });
    expect((await listPeriod(p.id)).find((i) => i.id === master.id).nilaiBobot).toBe(1);
    await prisma.$transaction((tx) => updatePeriod(tx, p.id, master.id, { revision: 2, nilaiBobot: 999 }, actor()));
    await expect(approveSubmission({ id: result.data[1].id, adminId: user.id })).rejects.toMatchObject({ status: 400, code: 'INVALID_SCORE_VALUE' });
    expect((await prisma.submissionItem.findUnique({ where: { id: result.data[1].id } })).status).toBe('menunggu');
  });
});

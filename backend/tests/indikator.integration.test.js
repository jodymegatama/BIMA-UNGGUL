import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { prisma } from '../src/db/prisma.js';
import * as service from '../src/services/indikatorService.js';
import { defaultFields } from '../src/services/indikatorConfig.js';

describe('CRUD indikator dan snapshot periode', () => {
  let user, period, master;
  const ids = [];
  const periods = [];
  const actor = () => ({ userId: user.id, ip: '127.0.0.1' });
  beforeAll(async () => {
    user = await prisma.user.create({ data: { name: 'Config test', email: `config-${Date.now()}@test.local`, password: 'unused', role: 'admin', status: 'aktif' } });
    period = await prisma.periodePenilaian.create({ data: { namaPeriode: `CONFIG-${Date.now()}`, tahunCapaian: 2030, tanggalMulai: new Date('2030-01-01'), tanggalCutoff: new Date('2030-12-31') } });
    periods.push(period.id);
  });
  afterAll(async () => {
    await prisma.periodePenilaian.deleteMany({ where: { id: { in: periods } } });
    await prisma.indikator.deleteMany({ where: { id: { in: ids } } });
    if (user) await prisma.user.delete({ where: { id: user.id } });
  });
  it('memblokir CRUD tanpa autentikasi', async () => {
    expect((await request(app).post('/api/admin/indikator').send({})).status).toBe(401);
  });
  it('membuat master dengan deskripsi dan menyimpan snapshot terpisah', async () => {
    master = await service.createMaster({ kode: `cfg_${Date.now()}`, slug: `cfg_${Date.now()}`, nama: 'Indikator tambahan', deskripsi: 'Informasi untuk publik\ndan operator', short: 'Tambahan', tipeFormula: 'per_capaian', aktif: true }, actor());
    ids.push(master.id);
    const config = await service.addPeriod(period.id, { indikatorId: master.id }, actor());
    expect(config.deskripsi).toBe(master.deskripsi);
    const updated = await service.updateMaster(master.id, { revision: 1, nama: 'Nama baru', deskripsi: 'Deskripsi baru' }, actor());
    expect(updated.revision).toBe(2);
    expect((await service.listPeriod(period.id))[0].nama).toBe('Indikator tambahan');
    await expect(service.updateMaster(master.id, { revision: 1, nama: 'Stale' }, actor())).rejects.toMatchObject({ status: 409 });
    await expect(service.deleteMaster(master.id, actor())).rejects.toMatchObject({ status: 409 });
    await expect(prisma.indikator.delete({ where: { id: master.id } })).rejects.toMatchObject({ code: 'P2003' });
  });
  it('mengatur bobot nol, simulasi, dan menolak konfigurasi tidak lengkap', async () => {
    await expect(prisma.$transaction((tx) => service.updatePeriod(tx, period.id, master.id, { revision: 1, menerimaInput: true }, actor()))).rejects.toMatchObject({ status: 400 });
    const config = await prisma.$transaction((tx) => service.updatePeriod(tx, period.id, master.id, { revision: 1, nilaiBobot: 2, menerimaInput: true }, actor()));
    expect(config.revision).toBe(2);
    expect((await service.previewPeriod(period.id, master.id, { revision: 2, items: [{}, {}, {}, {}, {}] })).totalScore).toBe(10);
    await expect(prisma.$transaction((tx) => service.updatePeriod(tx, period.id, master.id, { revision: 2, nilaiBobot: Infinity }, actor()))).rejects.toMatchObject({ status: 400 });
  });
  it('dua admin menulis revisi sama hanya satu berhasil dan histori final terkunci', async () => {
    const outcomes = await Promise.allSettled([3, 4].map((nilaiBobot) => prisma.$transaction((tx) => service.updatePeriod(tx, period.id, master.id, { revision: 2, nilaiBobot }, actor()))));
    expect(outcomes.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.find((r) => r.status === 'rejected').reason.status).toBe(409);
    await prisma.periodePenilaian.update({ where: { id: period.id }, data: { status: 'finalisasi' } });
    await expect(prisma.$transaction((tx) => service.updatePeriod(tx, period.id, master.id, { revision: 3, deskripsi: 'Koreksi' }, actor()))).rejects.toMatchObject({ status: 423 });
  });
  it('operator tidak dapat membuat indikator dan admin dapat menghapus master yang belum dipakai', async () => {
    await prisma.user.update({ where: { id: user.id }, data: { role: 'operator' } });
    const token = jwt.sign({ userId: user.id, role: 'operator' }, process.env.JWT_SECRET);
    const res = await request(app).post('/api/admin/indikator').set('Authorization', `Bearer ${token}`).send({});
    expect(res.status).toBe(403);
    await prisma.user.update({ where: { id: user.id }, data: { role: 'admin' } });
    const m = await service.createMaster({ kode: `del_${Date.now()}`, slug: `del_${Date.now()}`, nama: 'Hapus', tipeFormula: 'persentase', fields: defaultFields('persentase') }, actor());
    expect(await service.deleteMaster(m.id, actor())).toEqual({ deleted: true });
  });
  it('menyalin bobot secara eksplisit tanpa menulis ulang deskripsi tujuan', async () => {
    const dest = await prisma.periodePenilaian.create({ data: { namaPeriode: `CONFIG-COPY-${Date.now()}`, tahunCapaian: 2031, tanggalMulai: new Date('2031-01-01'), tanggalCutoff: new Date('2031-12-31') } });
    periods.push(dest.id);
    await service.addPeriod(dest.id, { indikatorId: master.id }, actor());
    const source = (await service.listPeriod(period.id))[0];
    expect(await service.copyWeights(dest.id, { sourcePeriodeId: period.id, revisions: { [master.id]: 1 } }, actor())).toEqual({ copied: 1, skipped: 0 });
    const copied = (await service.listPeriod(dest.id))[0];
    expect(copied.nilaiBobot).toBe(source.nilaiBobot);
    expect(copied.deskripsi).toBe('Deskripsi baru');
    await expect(service.copyWeights(dest.id, { sourcePeriodeId: period.id, revisions: { [master.id]: 1 } }, actor())).rejects.toMatchObject({ status: 409 });
  });
});

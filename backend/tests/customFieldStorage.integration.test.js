import { describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import { prisma } from '../src/db/prisma.js';

describe('Penyimpanan field kustom MySQL', () => {
  it('round-trip JSON typed, SQL NULL/JSON null dan dua metode baru tanpa mengubah data lama', async () => {
    // Always roll back the entire fixture, including on assertion failure.
    const rollback = new Error('ROLLBACK_CUSTOM_FIELD_FIXTURE');
    try {
      await prisma.$transaction(async (tx) => {
        const suffix = String(Date.now());
        const p = await tx.periodePenilaian.create({ data: { namaPeriode: `CUSTOM-STORAGE-${suffix}`, tahunCapaian: 2030, tanggalMulai: new Date('2030-01-01'), tanggalCutoff: new Date('2030-12-31') } });
        const ind = await tx.indikator.create({ data: { kode: `storage_${suffix}`, slug: `storage_${suffix}`, nama: 'Fixture custom', tipeFormula: 'per_jumlah', scoringConfig: { quantity: { source: 'custom', key: 'cf_duration' } } } });
        const school = await tx.madrasah.create({ data: { nomorMadrasah: `BMU-CUSTOM-${suffix}`, slug: `custom-${suffix}`, namaMadrasah: 'Fixture custom', jenjang: 'RA', kelompok: 'RA', statusKepemilikan: 'Swasta', jumlahSiswa: 10, alamat: 'Fixture' } });
        const user = await tx.user.create({ data: { name: 'Fixture custom', email: `storage-${suffix}@fixture.invalid`, password: 'not-used', madrasahId: school.id } });
        const item = await tx.submissionItem.create({ data: { madrasahId: school.id, indikatorId: ind.id, periodeId: p.id, createdById: user.id } });
        expect(item.customValues).toBeNull();
        const values = { cf_duration: 0.125, cf_partner: false, cf_count: 0, cf_certificate: '00123', cf_options: ['opt_a', 'opt_b'], cf_date: '2026-11-02' };
        await tx.submissionItem.update({ where: { id: item.id }, data: { customValues: values } });
        expect((await tx.submissionItem.findUnique({ where: { id: item.id } })).customValues).toEqual(values);
        for (const value of [Prisma.JsonNull, Prisma.DbNull]) {
          await tx.submissionItem.update({ where: { id: item.id }, data: { customValues: value } });
          expect((await tx.submissionItem.findUnique({ where: { id: item.id } })).customValues).toBeNull();
          expect(await tx.submissionItem.count({ where: { id: item.id, customValues: { equals: value } } })).toBe(1);
          const opposite = value === Prisma.JsonNull ? Prisma.DbNull : Prisma.JsonNull;
          expect(await tx.submissionItem.count({ where: { id: item.id, customValues: { equals: opposite } } })).toBe(0);
        }
        const config = await tx.bobotIndikator.create({ data: { periodeId: p.id, indikatorId: ind.id, tipeFormula: 'per_kategori', scoringConfig: { category: { source: 'custom', key: 'cf_category' }, weights: { opt_a: 2 } } } });
        expect(config.scoringConfig.weights.opt_a).toBe(2);
        throw rollback;
      });
    } catch (e) { if (e !== rollback) throw e; }
  });
});

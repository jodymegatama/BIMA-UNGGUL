import { describe, it, expect, vi } from 'vitest';
import { computeSkorBreakdown, calculateSkorMadrasah } from '../src/services/scoringService.js';
import { sortIndikators, addGuruBersertifikasi } from '../src/services/indikatorService.js';

const indikator = { id: 10, slug: 'guru_bersertifikasi', tipeFormula: 'persentase' };
const item = (pembilang, penyebut) => ({ indikatorId: 10, indikator, pembilang, penyebut });

describe('guru bersertifikasi — skor', () => {
  it.each([[[item(8, 10)], 10, 8], [[item(2, 4), item(6, 6)], 10, 8], [[item(0, 0)], 10, 0], [[item(8, 10)], 0, 0]])('menghitung rasio agregat dan bobot', (items, nilaiBobot, expected) => {
    expect(computeSkorBreakdown(items, [{ indikatorId: 10, nilaiBobot }]).totalScore).toBe(expected);
  });
  it('bobot belum dikonfigurasi tidak menambah skor', () => {
    expect(computeSkorBreakdown([item(8, 10)], []).totalScore).toBe(0);
  });
  it('hanya membaca baris disetujui yang tidak dihapus', async () => {
    const client = { submissionItem: { findMany: vi.fn().mockResolvedValue([item(8, 10)]) }, bobotIndikator: { findMany: vi.fn().mockResolvedValue([{ indikatorId: 10, nilaiBobot: 10 }]) } };
    expect((await calculateSkorMadrasah(1, 2, client)).totalScore).toBe(8);
    expect(client.submissionItem.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { madrasahId: 1, periodeId: 2, status: 'disetujui', deletedAt: null } }));
  });
});

describe('master indikator', () => {
  it('mengurutkan kode numerik 1, 2, 9, 10', () => {
    expect(sortIndikators(['10', '9', '2', '1'].map((kode) => ({ kode }))).map((i) => i.kode)).toEqual(['1', '2', '9', '10']);
  });
  it('menambahkan bobot hanya pada periode terbuka dan tidak menimpa bobot lama', async () => {
    const now = new Date('2026-11-03T00:00:00Z');
    const tx = {
      indikator: { upsert: vi.fn().mockResolvedValue(indikator) },
      periodePenilaian: { findMany: vi.fn().mockResolvedValue([
        { id: 1, status: 'aktif', tanggalMulai: '2026-01-01', tanggalCutoff: '2026-12-31' },
        { id: 2, status: 'belum_dimulai', tanggalMulai: '2027-01-01', tanggalCutoff: '2027-12-31' },
        ...['aktif', 'cutoff', 'penyelesaian_validasi', 'finalisasi', 'arsip'].map((status, i) => ({ id: i + 3, status, tanggalMulai: '2025-01-01', tanggalCutoff: '2025-12-31' })),
      ]) },
      bobotIndikator: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
    };
    await addGuruBersertifikasi({ $transaction: (fn) => fn(tx) }, now);
    expect(tx.indikator.upsert.mock.calls[0][0].update).toEqual({});
    expect(tx.bobotIndikator.createMany).toHaveBeenCalledWith({ data: [1, 2].map((periodeId) => ({ indikatorId: 10, periodeId, nilaiBobot: 0 })), skipDuplicates: true });
  });
});

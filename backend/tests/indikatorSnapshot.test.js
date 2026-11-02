import { describe, expect, it } from 'vitest';
import { computeSkorBreakdown } from '../src/services/scoringService.js';

describe('Snapshot metode per periode', () => {
  it('perubahan rumus master tidak menulis ulang skor periode', () => {
    const indikator = { id: 1, slug: 'baru', tipeFormula: 'persentase' };
    const items = [1, 2, 3, 4, 5].map(() => ({ indikatorId: 1, indikator }));
    expect(computeSkorBreakdown(items, [{ indikatorId: 1, tipeFormula: 'per_capaian', nilaiBobot: 2 }]).totalScore).toBe(10);
  });
  it('menggunakan agregasi rasio dan menerima bobot nol', () => {
    const indikator = { id: 1, slug: 'baru', tipeFormula: 'per_capaian' };
    const items = [{ pembilang: 80, penyebut: 100 }, { pembilang: 0, penyebut: 100 }].map((i) => ({ ...i, indikatorId: 1, indikator }));
    expect(computeSkorBreakdown(items, [{ indikatorId: 1, tipeFormula: 'persentase', nilaiBobot: 20 }]).totalScore).toBe(8);
    expect(computeSkorBreakdown(items, [{ indikatorId: 1, tipeFormula: 'persentase', nilaiBobot: 0 }]).totalScore).toBe(0);
  });
});

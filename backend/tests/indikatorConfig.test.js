import { describe, expect, it } from 'vitest';
import { defaultFields, validateConfig, rulesFromFields, completeConfig } from '../src/services/indikatorConfig.js';

describe('Kontrak konfigurasi indikator', () => {
  it('mendukung indikator baru tanpa slug bawaan dan mempertahankan aturan skor wajib', () => {
    for (const tipeFormula of ['per_capaian', 'per_tingkat_wilayah', 'per_jenjang', 'persentase']) {
      const fields = defaultFields(tipeFormula);
      expect(validateConfig({ tipeFormula, fields })).toEqual([]);
      expect(rulesFromFields(fields).linkBukti.required).toBe(true);
    }
  });
  it('menolak field/tipe/opsi liar dan penghapusan field skor wajib', () => {
    expect(validateConfig({ tipeFormula: 'eval', fields: [] }).length).toBeGreaterThan(0);
    expect(validateConfig({ tipeFormula: 'persentase', fields: defaultFields('per_capaian') }).length).toBeGreaterThan(0);
    expect(validateConfig({ tipeFormula: 'per_capaian', fields: [{ key: '__proto__', type: 'text', label: 'X' }] }).length).toBeGreaterThan(0);
    const fields = defaultFields('per_tingkat_wilayah');
    fields.find((f) => f.key === 'tingkatWilayah').options.push({ value: 'liar', label: 'Liar' });
    expect(validateConfig({ tipeFormula: 'per_tingkat_wilayah', fields }).length).toBeGreaterThan(0);
    expect(validateConfig({ tipeFormula: 'per_capaian', fields: [{ key: 'namaKegiatan', type: 'text', label: 42, required: true }] }).length).toBeGreaterThan(0);
  });
  it('membedakan bobot kosong dari nol dan memerlukan deskripsi', () => {
    const config = { tipeFormula: 'persentase', fields: defaultFields('persentase'), deskripsi: 'Informasi indikator', nilaiBobot: 0 };
    expect(completeConfig(config)).toBe(true);
    expect(completeConfig({ ...config, nilaiBobot: null })).toBe(false);
    expect(completeConfig({ ...config, nilaiBobot: Infinity })).toBe(false);
    expect(completeConfig({ ...config, deskripsi: ' ' })).toBe(false);
  });
});

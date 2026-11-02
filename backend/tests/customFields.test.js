import { describe, expect, it } from 'vitest';
import { validateCustomFields, mergeCustomValues, validateScoringConfig, scoreCustomItems } from '../src/services/customFields.js';

const number = { source: 'custom', key: 'cf_duration', type: 'decimal', label: 'Durasi', required: true, visibility: 'internal', min: 0, max: 1000, precision: 3 };
const boolean = { source: 'custom', key: 'cf_partner', type: 'boolean', label: 'Mitra', required: true, visibility: 'internal' };
const category = { source: 'custom', key: 'cf_category', type: 'select', label: 'Kategori', required: true, visibility: 'public', options: [{ value: 'opt_online', label: 'Daring' }, { value: 'opt_offline', label: 'Tatap muka' }] };
const ref = (key) => ({ source: 'custom', key });

describe('Kontrak field kustom', () => {
  it('menerima tipe terkontrol dan menolak identitas/opsi/batas yang tidak valid', () => {
    expect(validateCustomFields([number, boolean, category])).toEqual([]);
    for (const fields of [[number, number], [{ ...number, key: '__proto__' }], [{ ...category, options: [{ value: 'opt_x', label: 'X' }, { value: 'opt_x', label: 'Y' }] }], [{ ...number, min: 10, max: 2 }], [{ ...number, type: 'javascript' }]]) expect(validateCustomFields(fields).length).toBeGreaterThan(0);
  });
  it('mempertahankan 0/false dan nilai PATCH yang tidak dikirim, null mengosongkan', () => {
    expect(mergeCustomValues([number, boolean], { cf_duration: 5, cf_partner: true }, { cf_duration: 0, cf_partner: false }, 'submit')).toEqual({ cf_duration: 0, cf_partner: false });
    expect(mergeCustomValues([number, boolean], { cf_duration: 5, cf_partner: false }, {}, 'submit')).toEqual({ cf_duration: 5, cf_partner: false });
    expect(mergeCustomValues([number], { cf_duration: 5 }, { cf_duration: null }, 'draft')).toEqual({});
    expect(() => mergeCustomValues([number], {}, {}, 'submit')).toThrow();
    expect(() => mergeCustomValues([number], {}, { status: 'disetujui' }, 'draft')).toThrow();
  });
  it('memvalidasi tanggal kalender, pilihan jamak, desimal dan jenis nilai', () => {
    const date = { source: 'custom', key: 'cf_date', label: 'Tanggal', type: 'date', required: false, visibility: 'internal' };
    const many = { ...category, type: 'multiselect' };
    expect(mergeCustomValues([date], {}, { cf_date: '2024-02-29' })).toEqual({ cf_date: '2024-02-29' });
    for (const [fields, value] of [[[date], { cf_date: '2026-02-29' }], [[many], { cf_category: ['opt_online', 'opt_online'] }], [[number], { cf_duration: 0.12345 }], [[boolean], { cf_partner: 'false' }], [[number], { cf_duration: Infinity }]]) expect(() => mergeCustomValues(fields, {}, value)).toThrow();
  });
  it('menolak binding salah tipe, sumber hilang, atau field skor yang opsional', () => {
    expect(validateScoringConfig('per_jumlah', [number], { quantity: ref(number.key) })).toEqual([]);
    expect(validateScoringConfig('per_jumlah', [boolean], { quantity: ref(boolean.key) }).length).toBeGreaterThan(0);
    expect(validateScoringConfig('per_jumlah', [number], null).length).toBeGreaterThan(0);
    expect(validateScoringConfig('per_jumlah', [{ ...number, required: false }], { quantity: ref(number.key) }).length).toBeGreaterThan(0);
  });
  it('menghitung contoh jumlah, persentase dan kategori menggunakan ID opsi stabil', () => {
    const items = [6, 4].map((n) => ({ customValues: { cf_duration: n } }));
    expect(scoreCustomItems('per_jumlah', items, { quantity: ref(number.key) }, { nilaiBobot: 2 })).toBe(20);
    expect(scoreCustomItems('persentase', [{ customValues: { cf_a: 80, cf_b: 100 } }], { numerator: ref('cf_a'), denominator: ref('cf_b') }, { nilaiBobot: 20 })).toBe(16);
    expect(scoreCustomItems('per_kategori', [{ customValues: { cf_category: 'opt_online', cf_duration: 4 } }, { customValues: { cf_category: 'opt_offline', cf_duration: 3 } }], { category: ref(category.key), quantity: ref(number.key), weights: { opt_online: 2, opt_offline: 5 } }, {})).toBe(23);
    expect(() => scoreCustomItems('per_jumlah', [{}], { quantity: ref(number.key) }, { nilaiBobot: 2 })).toThrow();
  });
  it('wilayah dan jenjang dapat membaca pilihan kustom dengan pemetaan kanonis', () => {
    const items = [{ customValues: { cf_category: 'opt_online', cf_duration: 2 } }, { customValues: { cf_category: 'opt_offline', cf_duration: 3 } }];
    expect(scoreCustomItems('per_tingkat_wilayah', items, { category: ref(category.key), categoryMap: { opt_online: 'kabupaten', opt_offline: 'nasional' } }, { bobotTingkatWilayah: { kabupaten: 3, nasional: 10 } })).toBe(13);
    expect(scoreCustomItems('per_jenjang', items, { category: ref(category.key), quantity: ref(number.key), categoryMap: { opt_online: 's1', opt_offline: 's2' } }, { bobotJenjang: { s1: 2, s2: 5 } })).toBe(19);
    expect(validateScoringConfig('per_tingkat_wilayah', [category], { category: ref(category.key) }).length).toBeGreaterThan(0);
  });
});

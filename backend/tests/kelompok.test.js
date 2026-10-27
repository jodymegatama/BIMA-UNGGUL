import { describe, it, expect } from 'vitest';
import * as groups from '../src/constants/periode.constants.js';
import { deriveKelompok } from '../src/services/authService.js';
import { resolveKelompoks } from '../src/services/exportService.js';

describe('Kelompok berdasarkan jenjang', () => {
  it('menyediakan empat kelompok termasuk RA', () => {
    expect(groups.KELOMPOKS_LIST).toEqual(['RA', 'MI', 'MTs', 'MA']);
  });

  it.each(['RA', 'MI', 'MTs', 'MA'])('%s menggabungkan kedua kepemilikan', (jenjang) => {
    expect(deriveKelompok(jenjang, 'Negeri')).toBe(jenjang);
    expect(deriveKelompok(jenjang, 'Swasta')).toBe(jenjang);
  });

  it.each([
    ['MI Negeri', 'MI'], ['MI Swasta', 'MI'],
    ['MTs Negeri', 'MTs'], ['MTs Swasta', 'MTs'],
    ['MA Negeri', 'MA'], ['MA Swasta', 'MA'], ['MTS', 'MTs'],
  ])('filter lama %s mengarah ke %s', (input, expected) => {
    expect(groups.normalizeKelompok(input)).toBe(expected);
  });

  it.each(['TK', 'MI lainnya', '', null, ['MI'], { kelompok: 'MI' }])('menolak kelompok tidak dikenal %j', (input) => {
    expect(groups.normalizeKelompok(input)).toBeNull();
  });

  it('ekspor RA dan alias lama menghasilkan satu kelompok kanonis', () => {
    expect(resolveKelompoks({ kelompok: 'RA' }).kelompoks).toEqual(['RA']);
    expect(resolveKelompoks({ kelompok: 'MI Negeri' }).kelompok).toBe('MI');
    expect(resolveKelompoks({ jenjang: 'MTS' }).kelompoks).toEqual(['MTs']);
    expect(resolveKelompoks().kelompoks).toEqual(['RA', 'MI', 'MTs', 'MA']);
  });

  it('ekspor menolak filter tidak valid dan parameter ganda', () => {
    expect(() => resolveKelompoks({ kelompok: 'TK' })).toThrow();
    expect(() => resolveKelompoks({ jenjang: 'MI Negeri' })).toThrow();
    expect(() => resolveKelompoks({ kelompok: 'MI', jenjang: 'MI' })).toThrow();
  });
});

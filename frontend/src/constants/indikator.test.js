import { describe, it, expect } from 'vitest';
import { validateRow } from './indikator.js';

describe('validateRow — mode draft vs submit (regresi QB-3)', () => {
  // Draft parsial hanya mengisi satu kolom wajib; kolom linkBukti sengaja dikosongkan.
  const rowParsial = {
    namaKegiatan: 'Diklat Kurikulum Merdeka Angkatan 3',
    namaPeserta: 'Budi Santoso',
    linkBukti: '',
  };

  it('draft: kolom wajib yang kosong tidak menghasilkan error', () => {
    expect(validateRow('diklat', rowParsial, { mode: 'draft' })).toEqual({});
  });

  it('draft: kolom wajib yang kosong tetap error saat mode submit', () => {
    const errors = validateRow('diklat', rowParsial, { mode: 'submit' });
    expect(errors.institusi).toBeTruthy();
    expect(errors.statusPegawai).toBeTruthy();
    expect(errors.linkBukti).toBeTruthy();
  });

  it('draft: ratio kosong dilewati, ratio tak valid tetap error', () => {
    expect(validateRow('rapor_rata_rata', { pembilang: '', penyebut: '', linkBukti: '' }, { mode: 'draft' })).toEqual({});
    const errors = validateRow('rapor_rata_rata', { pembilang: 'abc', penyebut: '5', linkBukti: '' }, { mode: 'draft' });
    expect(errors.ratio).toBeTruthy();
  });

  it('draft: linkBukti terisi tapi bukan URL tetap error', () => {
    const errors = validateRow('diklat', { ...rowParsial, linkBukti: 'drive.google.com/abc' }, { mode: 'draft' });
    expect(errors.linkBukti).toBeTruthy();
  });
});

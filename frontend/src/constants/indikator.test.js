import { describe, it, expect } from 'vitest';
import { validateRow, INDIKATORS, emptyRowFor, buildPayload } from './indikator.js';

describe('guru bersertifikasi', () => {
  const kode = 'guru_bersertifikasi';
  const row = { pembilang: '8', penyebut: '10', linkBukti: 'https://example.com/bukti', catatan: '' };
  it('menampilkan indikator ke-10 dan membangun payload rasio', () => {
    expect(INDIKATORS).toHaveLength(10);
    expect(INDIKATORS.at(-1).kode).toBe(kode);
    expect(emptyRowFor(kode)).toEqual({ pembilang: '', penyebut: '', linkBukti: '', catatan: '' });
    expect(buildPayload(kode, { ...row, namaKegiatan: 'tidak boleh terkirim' })).toEqual({ pembilang: '8', penyebut: '10', linkBukti: row.linkBukti });
  });
  it('menerima rasio, 0/0, dan draft parsial', () => {
    expect(validateRow(kode, row)).toEqual({});
    expect(validateRow(kode, { ...row, pembilang: '0', penyebut: '0' })).toEqual({});
    expect(validateRow(kode, { ...emptyRowFor(kode), pembilang: '8' }, { mode: 'draft' })).toEqual({});
  });
  it.each([{ pembilang: '-1' }, { pembilang: '11' }, { pembilang: '1.5' }, { penyebut: '1000001' }])('menolak rasio tidak valid %j', (changes) => {
    expect(validateRow(kode, { ...row, ...changes }).ratio).toBeTruthy();
  });
  it('mewajibkan bukti saat submit', () => {
    expect(validateRow(kode, { ...row, linkBukti: '' }).linkBukti).toBeTruthy();
  });
});

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

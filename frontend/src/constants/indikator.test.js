import initialIndicators from '../../../backend/prisma/indikator-defaults.json';
const fieldsFor = (slug) => initialIndicators.find((i) => i.slug === slug).fields;
import { describe, it, expect } from 'vitest';
import { validateRow, buildPayload, emptyRowFor } from './indikator.js';

it('indikator baru memakai field API untuk nilai awal dan payload tanpa field di luar konfigurasi', () => {
  const fields = [{ key: 'namaKegiatan', type: 'text', label: 'Kegiatan baru', required: true }, { key: 'jumlah', type: 'number', label: 'Jumlah baru', required: true, min: 1 }];
  expect(emptyRowFor(fields)).toEqual({ namaKegiatan: '', jumlah: '' });
  expect(buildPayload(fields, { namaKegiatan: ' Capaian ', jumlah: '3', status: 'disetujui', namaPeserta: 'Bukan field indikator' })).toEqual({ namaKegiatan: 'Capaian', jumlah: 3 });
});

describe('validateRow — mode draft vs submit (regresi QB-3)', () => {
  // Draft parsial hanya mengisi satu kolom wajib; kolom linkBukti sengaja dikosongkan.
  const rowParsial = {
    namaKegiatan: 'Diklat Kurikulum Merdeka Angkatan 3',
    namaPeserta: 'Budi Santoso',
    linkBukti: '',
  };

  it('draft: kolom wajib yang kosong tidak menghasilkan error', () => {
    expect(validateRow(fieldsFor('diklat'), rowParsial, { mode: 'draft' })).toEqual({});
  });

  it('draft: kolom wajib yang kosong tetap error saat mode submit', () => {
    const errors = validateRow(fieldsFor('diklat'), rowParsial, { mode: 'submit' });
    expect(errors.institusi).toBeTruthy();
    expect(errors.statusPegawai).toBeTruthy();
    expect(errors.linkBukti).toBeTruthy();
  });

  it('draft: ratio kosong dilewati, ratio tak valid tetap error', () => {
    expect(validateRow(fieldsFor('rapor_rata_rata'), { pembilang: '', penyebut: '', linkBukti: '' }, { mode: 'draft' })).toEqual({});
    const errors = validateRow(fieldsFor('rapor_rata_rata'), { pembilang: 'abc', penyebut: '5', linkBukti: '' }, { mode: 'draft' });
    expect(errors.ratio).toBeTruthy();
  });

  it('draft: linkBukti terisi tapi bukan URL tetap error', () => {
    const errors = validateRow(fieldsFor('diklat'), { ...rowParsial, linkBukti: 'drive.google.com/abc' }, { mode: 'draft' });
    expect(errors.linkBukti).toBeTruthy();
  });
});

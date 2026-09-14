import { describe, it, expect } from 'vitest';
import { deriveStatus } from '../src/services/periodService.js';
import { FIELD_RULES, validateItem } from '../src/services/submissionService.js';
import HttpError from '../src/utils/httpError.js';

describe('deriveStatus (periode)', () => {
  it('belum_dimulai jika tanggalMulai di masa depan', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(deriveStatus({ status: null, tanggalMulai: future, tanggalCutoff: null })).toBe('belum_dimulai');
  });

  it('aktif jika hari ini di antara mulai & cutoff', () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(deriveStatus({ status: null, tanggalMulai: past, tanggalCutoff: future })).toBe('aktif');
  });

  it('cutoff jika lewat tanggalCutoff', () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(deriveStatus({ status: null, tanggalMulai: null, tanggalCutoff: past })).toBe('cutoff');
  });

  it('status manual (finalisasi/arsip) menang atas derive tanggal', () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(deriveStatus({ status: 'finalisasi', tanggalMulai: null, tanggalCutoff: past })).toBe('finalisasi');
  });
});

describe('HttpError', () => {
  it('membawa status & code', () => {
    const e = new HttpError(404, 'NOT_FOUND', 'Data tidak ada');
    expect(e.status).toBe(404);
    expect(e.code).toBe('NOT_FOUND');
    expect(e.message).toBe('Data tidak ada');
  });
});

/**
 * Kontrak 9 indikator (revisi 2026-09-14).
 * Guard paritas: rename/label tidak boleh mengubah daftar slug, kewajiban bukti, atau aturan ratio.
 */
const SLUGS_9 = [
  'diklat',
  'penghargaan_individu',
  'penghargaan_institusi',
  'prestasi_siswa',
  'lulus_jenjang_lanjutan',
  'rapor_rata_rata',
  'siswa_lanjutan_unggulan',
  'giat_inovatif',
  'rasio_penerimaan',
];

describe('FIELD_RULES — kontrak 9 indikator', () => {
  it('memuat tepat 9 indikator dengan slug yang sama seperti master', () => {
    expect(Object.keys(FIELD_RULES).sort()).toEqual([...SLUGS_9].sort());
  });

  it('setiap indikator WAJIB melampirkan linkBukti (type url)', () => {
    for (const slug of SLUGS_9) {
      expect(FIELD_RULES[slug].linkBukti, slug).toEqual({ required: true, type: 'url' });
    }
  });

  it('catatan tetap opsional di semua indikator (D5)', () => {
    for (const slug of SLUGS_9) {
      expect(FIELD_RULES[slug].catatan.required, slug).toBe(false);
    }
  });

  it('tidak ada field "tahun" di kontrak API — tahun bukti otomatis dari periode (D1 opsi A)', () => {
    for (const slug of SLUGS_9) {
      expect(Object.keys(FIELD_RULES[slug]), slug).not.toContain('tahun');
    }
  });

  it('penyebut ratio boleh 0 → "0 dari 0 = 0%" (D2)', () => {
    expect(FIELD_RULES.rapor_rata_rata.penyebut.min).toBe(0);
    expect(FIELD_RULES.rasio_penerimaan.penyebut.min).toBe(0);
  });
});

describe('validateItem — aturan ratio "X dari Y = Z%"', () => {
  const base = { linkBukti: 'https://drive.google.com/bukti' };

  it('menerima 0 dari 0 = 0% (disetujui user 2026-09-14)', () => {
    const errs = validateItem('rapor_rata_rata', { ...base, pembilang: 0, penyebut: 0 }, 'submit');
    expect(errs).toEqual([]);
  });

  it('menerima rasio normal (pembilang <= penyebut)', () => {
    const errs = validateItem('rasio_penerimaan', { ...base, pembilang: 282, penyebut: 320 }, 'submit');
    expect(errs).toEqual([]);
  });

  it('menolak pembilang > penyebut', () => {
    const errs = validateItem('rasio_penerimaan', { ...base, pembilang: 10, penyebut: 5 }, 'submit');
    expect(errs.map((e) => e.field)).toContain('pembilang');
  });

  it('menolak link bukti bukan URL http(s)', () => {
    const errs = validateItem('diklat', { namaKegiatan: 'Diklat A', institusi: 'Balai', namaPeserta: 'Budi', statusPegawai: 'asn', linkBukti: 'drive.google.com/x' }, 'submit');
    expect(errs.map((e) => e.field)).toContain('linkBukti');
  });

  it('submit tanpa link bukti ditolak (bukti wajib)', () => {
    const errs = validateItem('giat_inovatif', { namaKegiatan: 'Giat A' }, 'submit');
    expect(errs.map((e) => e.field)).toContain('linkBukti');
  });

  it('draft boleh parsial — tidak ada error required', () => {
    const errs = validateItem('giat_inovatif', { namaKegiatan: 'Giat A' }, 'draft');
    expect(errs).toEqual([]);
  });
});

import { describe, it, expect } from 'vitest';
import { deriveStatus } from '../src/services/periodService.js';
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

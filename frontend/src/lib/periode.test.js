import { describe, it, expect } from 'vitest';
import {
  deriveStatusClient,
  daysUntilCutoff,
  formatTanggal,
  urgency,
  countdownText,
  STATUS_HISTORI_PERIODE,
} from './periode';

// Anchor tetap agar test deterministik: 2026-09-29 10:00 WIB (UTC+7)
const NOW = new Date('2026-09-29T03:00:00.000Z');
const iso = (s) => new Date(s).toISOString();

describe('deriveStatusClient (periode)', () => {
  // Semua panggilan meneruskan NOW — fungsi memakai jam internal kalau tidak,
  // jadi tanpa injeksi hasil test ikut berubah tergantung tanggal saat test dijalankan.
  it('belum_dimulai jika tanggalMulai di masa depan', () => {
    expect(deriveStatusClient({ status: null, tanggalMulai: iso('2026-09-30T00:00:00Z'), tanggalCutoff: iso('2026-12-31T00:00:00Z') }, NOW)).toBe('belum_dimulai');
  });

  it('aktif jika now di antara mulai & cutoff', () => {
    expect(deriveStatusClient({ status: null, tanggalMulai: iso('2026-09-01T00:00:00Z'), tanggalCutoff: iso('2026-12-31T00:00:00Z') }, NOW)).toBe('aktif');
  });

  it('cutoff jika lewat tanggalCutoff', () => {
    expect(deriveStatusClient({ status: null, tanggalMulai: null, tanggalCutoff: iso('2026-09-01T00:00:00Z') }, NOW)).toBe('cutoff');
  });

  it('status historis (finalisasi/arsip/penyelesaian_validasi) menang atas derive tanggal — kontrak backend', () => {
    for (const s of STATUS_HISTORI_PERIODE) {
      expect(deriveStatusClient({ status: s, tanggalMulai: null, tanggalCutoff: iso('2020-01-01T00:00:00Z') }, NOW)).toBe(s);
    }
  });

  it('null untuk periode kosong', () => {
    expect(deriveStatusClient(null, NOW)).toBeNull();
    expect(deriveStatusClient({}, NOW)).toBe('aktif'); // tanpa tanggal apa pun → dianggap aktif (derive backend: mulai ≤ now ≤ cutoff)
  });
});

describe('daysUntilCutoff', () => {
  it('ceil konsisten countdown admin: 2.5 hari → 3', () => {
    expect(daysUntilCutoff(iso('2026-10-01T15:00:00Z'), NOW)).toBe(3);
  });

  it('negatif bila sudah lewat, null bila tanpa tanggal / tanggal invalid', () => {
    expect(daysUntilCutoff(iso('2026-09-28T00:00:00Z'), NOW)).toBeLessThan(0);
    expect(daysUntilCutoff(null, NOW)).toBeNull();
    expect(daysUntilCutoff('bukan-tanggal', NOW)).toBeNull();
  });
});

describe('formatTanggal', () => {
  it('format Indonesia long date; null utk input kosong/invalid', () => {
    expect(formatTanggal(iso('2026-09-29T03:00:00Z'))).toMatch(/29/);
    // id-ID memakai titik pemisah jam (03.00) — regex toleran [.,:]
    expect(formatTanggal(iso('2026-09-29T03:00:00Z'), true)).toMatch(/\d{2}[.,:]\d{2}/);
    expect(formatTanggal(null)).toBeNull();
    expect(formatTanggal('x')).toBeNull();
  });
});

describe('urgency (batas chip PeriodeCutoffChip)', () => {
  const cutoffAt = (d) => iso(`2026-09-29T00:00:00Z`).replace('T00', `T${String(d).padStart(2, '0')}`); // helper sederhana di bawah
  const at = (dateStr) => iso(dateStr);

  it('normal > 7 hari', () => {
    expect(urgency({ status: null, tanggalCutoff: at('2026-10-15T00:00:00Z') }, NOW)).toBe('normal');
  });

  it('warning pada 4–7 hari', () => {
    // NOW=09-29T03:00Z → 10-06T10:00Z sisa 7h19m → ceil 8 → normal
    expect(urgency({ status: null, tanggalCutoff: at('2026-10-06T10:00:00Z') }, NOW)).toBe('normal');
    expect(urgency({ status: null, tanggalCutoff: at('2026-10-05T00:00:00Z') }, NOW)).toBe('warning'); // 5d21h → ceil 6
    expect(urgency({ status: null, tanggalCutoff: at('2026-10-03T00:00:00Z') }, NOW)).toBe('warning'); // 3d21h → ceil 4
  });

  it('danger ≤ 3 hari termasuk hari-H', () => {
    expect(urgency({ status: null, tanggalCutoff: at('2026-10-02T00:00:00Z') }, NOW)).toBe('danger'); // 2d21h → ceil 3
    expect(urgency({ status: null, tanggalCutoff: at('2026-09-29T12:00:00Z') }, NOW)).toBe('danger'); // hari ini (9 jam)
  });

  it('closed saat lewat / finalisasi, upcoming saat belum dimulai', () => {
    expect(urgency({ status: null, tanggalCutoff: at('2026-09-28T00:00:00Z') }, NOW)).toBe('closed');
    expect(urgency({ status: 'finalisasi', tanggalCutoff: at('2026-12-31T00:00:00Z') }, NOW)).toBe('closed');
    expect(urgency({ status: null, tanggalMulai: at('2026-10-01T00:00:00Z'), tanggalCutoff: at('2026-12-31T00:00:00Z') }, NOW)).toBe('upcoming');
  });

  it('null tanpa periode; normal bila aktif tanpa tanggal cutoff', () => {
    expect(urgency(null, NOW)).toBeNull();
    expect(urgency({ status: null }, NOW)).toBe('normal');
  });

  it('helper cutoffAt dipakai konsisten (sanity)', () => {
    // 2026-09-29T05 → 2 jam setelah NOW (sisa hari → ceil 1 → danger)
    expect(urgency({ status: null, tanggalCutoff: cutoffAt(5) }, NOW)).toBe('danger');
  });
});

describe('countdownText (calendar-day-aware)', () => {
  it('Hari ini / Besok / N hari lagi / Sudah lewat', () => {
    // TZ-proof: bangun target dari kalender LOKAL NOW (19:59 & +1 hari), bukan jam UTC mentah
    const laterToday = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate(), 23, 59, 0);
    const tomorrow = new Date(laterToday); tomorrow.setDate(tomorrow.getDate() + 1);
    expect(countdownText(laterToday.toISOString(), NOW)).toBe('Hari ini');
    expect(countdownText(tomorrow.toISOString(), NOW)).toBe('Besok');
    expect(countdownText(iso('2026-10-05T09:00:00Z'), NOW)).toBe('7 hari lagi'); // 6d6h → ceil 7
    expect(countdownText(iso('2026-09-25T00:00:00Z'), NOW)).toBe('Sudah lewat');
    expect(countdownText(null, NOW)).toBeNull();
  });
});

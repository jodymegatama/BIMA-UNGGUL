/**
 * NOTE: File ini dipertahankan sebagai data tiruan (mock/fallback)
 * untuk keperluan Storybook, UI testing, dan pengembangan offline.
 * Jalur produksi aplikasi utama 100% menggunakan API Backend real-time.
 */
import { INDIKATORS } from './mockLeaderboard';

// tipe formula per indikator (sesuai PRD §11)
const TIPE = {
  diklat: 'per_capaian',
  penghargaan_individu: 'per_capaian',
  penghargaan_institusi: 'per_tingkat',
  prestasi_siswa: 'per_tingkat',
  lulus_jenjang_lanjutan: 'per_jenjang',
  rapor_rata_rata: 'persentase',
  siswa_lanjutan_unggulan: 'per_capaian',
  giat_inovatif: 'per_capaian',
  rasio_penerimaan: 'persentase',
};

function defaultBobot(kode) {
  const t = TIPE[kode];
  if (t === 'per_capaian') return { tipe: t, nilai: 10 };
  if (t === 'persentase') return { tipe: t, nilai: 0.5 };
  if (t === 'per_tingkat') return { tipe: t, kabupaten: 1, provinsi: 2, nasional: 3, internasional: 4 };
  if (t === 'per_jenjang') return { tipe: t, s1: 1, s2: 1.5, s3: 2 };
  return { tipe: t, nilai: 10 };
}

export const BOBOT_AWAL = Object.fromEntries(
  INDIKATORS.map((ind) => [ind.kode, { kode: ind.kode, nama: ind.nama, ...defaultBobot(ind.kode) }])
);

// Histori per periode — 2025/2026 locked, 2026/2027 editable
export const MOCK_BOBOT_PER_PERIODE = {
  '2024/2025': Object.fromEntries(
    INDIKATORS.map((ind) => [ind.kode, { ...defaultBobot(ind.kode), kode: ind.kode, nama: ind.nama, locked: true }])
  ),
  '2025/2026': Object.fromEntries(
    INDIKATORS.map((ind) => [ind.kode, { ...defaultBobot(ind.kode), kode: ind.kode, nama: ind.nama, locked: true }])
  ),
  '2026/2027': Object.fromEntries(
    INDIKATORS.map((ind) => [ind.kode, { ...defaultBobot(ind.kode), kode: ind.kode, nama: ind.nama, locked: false }])
  ),
  '2027/2028': Object.fromEntries(
    INDIKATORS.map((ind) => [ind.kode, { ...defaultBobot(ind.kode), kode: ind.kode, nama: ind.nama, locked: false }])
  ),
};

export const PERIODE_BOBOT = [
  { nama: '2024/2025', status: 'Arsip' },
  { nama: '2025/2026', status: 'Finalisasi' },
  { nama: '2026/2027', status: 'Aktif' },
  { nama: '2027/2028', status: 'Belum Dimulai' },
];

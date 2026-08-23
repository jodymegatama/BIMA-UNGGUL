/**
 * NOTE: File ini dipertahankan sebagai data tiruan (mock/fallback)
 * untuk keperluan Storybook, UI testing, dan pengembangan offline.
 * Jalur produksi aplikasi utama 100% menggunakan API Backend real-time.
 */
export const MOCK_PERIODE = [
  {
    id: 'per-2024-2025',
    nama: '2024/2025',
    tahunCapaian: 2024,
    tanggalMulai: '2024-07-01T00:00:00.000Z',
    tanggalCutoff: '2025-05-31T23:59:59.000Z',
    status: 'Arsip',
  },
  {
    id: 'per-2025-2026',
    nama: '2025/2026',
    tahunCapaian: 2025,
    tanggalMulai: '2025-07-01T00:00:00.000Z',
    tanggalCutoff: '2026-05-31T23:59:59.000Z',
    status: 'Finalisasi',
  },
  {
    id: 'per-2026-2027',
    nama: '2026/2027',
    tahunCapaian: 2026,
    tanggalMulai: '2026-07-01T00:00:00.000Z',
    tanggalCutoff: '2027-05-31T23:59:59.000Z',
    status: 'Aktif',
  },
  {
    id: 'per-2027-2028',
    nama: '2027/2028',
    tahunCapaian: 2027,
    tanggalMulai: '2027-07-01T00:00:00.000Z',
    tanggalCutoff: '2028-05-31T23:59:59.000Z',
    status: 'Belum Dimulai',
  },
];

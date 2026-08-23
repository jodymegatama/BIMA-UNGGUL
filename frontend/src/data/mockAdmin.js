/**
 * NOTE: File ini dipertahankan sebagai data tiruan (mock/fallback)
 * untuk keperluan Storybook, UI testing, dan pengembangan offline.
 * Jalur produksi aplikasi utama 100% menggunakan API Backend real-time.
 */
export const PERIODE_AKTIF = {
  nama: '2026/2027',
  status: 'Aktif',
  tanggalMulai: '2026-07-01T00:00:00.000Z',
  tanggalCutoff: '2027-05-31T23:59:59.000Z',
  totalMadrasah: 184,
  totalSubmission: 1247,
  menunggu: 42,
  disetujui: 892,
  ditolak: 87,
};

export const MADRASAH_PER_KELOMPOK = [
  { kelompok: 'MI Negeri', total: 16, aktif: 14, menunggu: 4 },
  { kelompok: 'MI Swasta', total: 38, aktif: 32, menunggu: 9 },
  { kelompok: 'MTs Negeri', total: 14, aktif: 13, menunggu: 3 },
  { kelompok: 'MTs Swasta', total: 42, aktif: 36, menunggu: 11 },
  { kelompok: 'MA Negeri', total: 7, aktif: 7, menunggu: 2 },
  { kelompok: 'MA Swasta', total: 67, aktif: 58, menunggu: 13 },
];

export const NOTIF_ADMIN = [
  { id: 1, title: '12 submission baru menunggu', desc: 'Antrian validasi perlu aksi segera', time: '1 jam lalu' },
  { id: 2, title: 'Periode 2026/2027 aktif', desc: 'Cut-off 31 Mei 2027 • 124 hari lagi', time: 'Hari ini' },
  { id: 3, title: 'Bobot finalisasi terkunci', desc: 'Bobot periode lalu diarsipkan', time: '2 hari lalu' },
];

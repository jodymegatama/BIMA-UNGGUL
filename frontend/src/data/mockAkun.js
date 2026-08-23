/**
 * NOTE: File ini dipertahankan sebagai data tiruan (mock/fallback)
 * untuk keperluan Storybook, UI testing, dan pengembangan offline.
 * Jalur produksi aplikasi utama 100% menggunakan API Backend real-time.
 */
export const MOCK_AKUN = [
  { id: 'akun-001', nip: '197812345678900003', nama: 'Siti Aminah, S.Pd', madrasah: 'MI Ar Rahmah Pandaan', jenjang: 'MI', statusKepemilikan: 'Swasta', status: 'Menunggu', createdAt: '2026-09-10T08:00:00.000Z' },
  { id: 'akun-002', nip: '198501012009011002', nama: 'Budi Santoso, M.Pd', madrasah: 'MTs Negeri 2 Pasuruan', jenjang: 'MTs', statusKepemilikan: 'Negeri', status: 'Menunggu', createdAt: '2026-09-12T09:30:00.000Z' },
  { id: 'akun-003', nip: '197305152005011001', nama: 'Ahmad Fauzi, S.Pd', madrasah: 'MI Negeri Bangil', jenjang: 'MI', statusKepemilikan: 'Negeri', status: 'Aktif', createdAt: '2026-08-20T10:00:00.000Z', bmuId: 'BMU-100137' },
  { id: 'akun-004', nip: '198010122008012003', nama: 'Dewi Lestari, S.Pd', madrasah: 'MA Zainul Hasan Genggong', jenjang: 'MA', statusKepemilikan: 'Swasta', status: 'Aktif', createdAt: '2026-08-15T11:00:00.000Z', bmuId: 'BMU-100412' },
  { id: 'akun-005', nip: '199001012015031001', nama: 'Rina Wati, S.Pd', madrasah: 'MI Darut Taqwa Bangil', jenjang: 'MI', statusKepemilikan: 'Swasta', status: 'Nonaktif', createdAt: '2026-07-01T08:00:00.000Z', bmuId: 'BMU-100205' },
];

let bmuCounter = 200;
export function generateBMU() {
  bmuCounter += 1;
  return `BMU-${String(bmuCounter).padStart(6, '0')}`;
}

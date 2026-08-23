/**
 * NOTE: File ini dipertahankan sebagai data tiruan (mock/fallback)
 * untuk keperluan Storybook, UI testing, dan pengembangan offline.
 * Jalur produksi aplikasi utama 100% menggunakan API Backend real-time.
 */
import { MOCK_DELETE_REQUESTS as OPERATOR_MOCK } from './mockOperator';

// Reuse data Operator agar satu alur — tambahkan 2 entri ekstra untuk variasi admin view
// Semua field sudah sesuai interface DeleteRequest terbaru (alasan, alasanAdmin, reviewedBy/At, createdAt/resolvedAt)

const EXTRA = [
  {
    id: 'del-005',
    submissionItemId: 'sub-10',
    indikatorKode: 'prestasi_siswa',
    indikatorNama: 'Prestasi Siswa',
    namaKegiatan: 'Juara 2 MHQ Tingkat Provinsi — Siti Aisyah',
    institusi: 'Kemenag Kab. Pasuruan',
    tanggalDisetujui: new Date(Date.now() - 18 * 86400000).toISOString(),
    skor: 14,
    statusRequest: 'Menunggu Persetujuan',
    alasan: 'Data duplikat dengan prestasi tahun lalu.',
    alasanAdmin: null,
    requestedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    madrasahNama: 'MTs Negeri 1 Pasuruan',
    madrasahKelompok: 'MTs Negeri',
  },
  {
    id: 'del-006',
    submissionItemId: 'sub-3',
    indikatorKode: 'prestasi_siswa',
    indikatorNama: 'Prestasi Siswa',
    namaKegiatan: 'Juara 1 Olimpiade Matematika',
    institusi: 'Dinas Pendidikan Kab. Pasuruan',
    tanggalDisetujui: new Date(Date.now() - 9 * 86400000).toISOString(),
    skor: 10,
    statusRequest: 'Disetujui',
    alasan: 'Salah pilih tingkat, seharusnya Kabupaten bukan Provinsi.',
    alasanAdmin: null,
    reviewedBy: 'admin-001',
    reviewedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    resolvedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    madrasahNama: 'MI Negeri Bangil',
    madrasahKelompok: 'MI Negeri',
  },
];

// Normalisasi: operator mock belum punya madrasahNama/Kelompok eksplisit, tambahkan fallback
const normalizedOperator = OPERATOR_MOCK.map((it) => ({
  ...it,
  madrasahNama: it.madrasahNama || 'MI Negeri Bangil',
  madrasahKelompok: it.madrasahKelompok || 'MI Negeri',
  createdAt: it.requestedAt || it.createdAt || new Date().toISOString(),
}));

export const MOCK_DELETE_REQUESTS = [...normalizedOperator, ...EXTRA];

// Helper untuk Admin filter
export function getDeleteRequestsByStatus(status) {
  if (status === 'Semua') return MOCK_DELETE_REQUESTS;
  return MOCK_DELETE_REQUESTS.filter((r) => r.statusRequest === status);
}

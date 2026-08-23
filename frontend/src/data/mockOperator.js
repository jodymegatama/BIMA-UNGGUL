/**
 * NOTE: File ini dipertahankan sebagai data tiruan (mock/fallback)
 * untuk keperluan Storybook, UI testing, dan pengembangan offline.
 * Jalur produksi aplikasi utama 100% menggunakan API Backend real-time.
 */
import { INDIKATORS } from './mockLeaderboard';

const OPERATOR_MADRASAH_BASE = {
  nama: 'MI Negeri Bangil',
  bmuId: 'BMU-100137',
  slug: 'mi-negeri-bangil',
  kelompok: 'MI Negeri',
  jenjang: 'MI',
  status: 'Negeri',
  alamat: 'Jl. Raya Bangil No. 12, Kab. Pasuruan',
  jumlahSiswa: 342,
};

const STORAGE_KEY = 'bima_operator_madrasah';

function loadOverride() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return {};
}

export function getOperatorMadrasah() {
  return { ...OPERATOR_MADRASAH_BASE, ...loadOverride() };
}

export function saveOperatorMadrasah(patch) {
  const cur = loadOverride();
  const next = { ...cur, ...patch };
  try {
    if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  return { ...OPERATOR_MADRASAH_BASE, ...next };
}

// Backwards compat: direct import masih dapat base, tapi page baru pakai getOperatorMadrasah()
export const OPERATOR_MADRASAH = OPERATOR_MADRASAH_BASE;

export const OPERATOR_USER = {
  nama: 'Ahmad Fauzi, S.Pd',
  nip: '197812345678900002',
  role: 'operator',
};

// Mock submission per indikator — untuk Dashboard stats & Riwayat
// Status: Draft, Menunggu, Disetujui, Ditolak (dengan alasan)
const now = Date.now();

function mk(id, kode, status, opts = {}) {
  const ind = INDIKATORS.find((i) => i.kode === kode);
  return {
    id: `sub-${id}`,
    indikatorKode: kode,
    indikatorNama: ind?.nama || kode,
    status,
    createdAt: new Date(now - opts.daysAgo * 86400000).toISOString(),
    updatedAt: new Date(now - (opts.daysAgo - 1) * 86400000).toISOString(),
    linkBukti: opts.linkBukti || 'https://drive.google.com/file/d/contoh-bukti',
    namaKegiatan: opts.namaKegiatan || `Contoh capaian ${ind?.short || kode} #${id}`,
    institusi: opts.institusi || 'Kemenag Kab. Pasuruan',
    tingkat: opts.tingkat || null,
    alasan: opts.alasan || null,
    skor: status === 'Disetujui' ? opts.skor || Math.floor(12 + Math.random() * 20) : null,
  };
}

export const MOCK_SUBMISSIONS = [
  mk(1, 'diklat', 'Disetujui', { daysAgo: 12, namaKegiatan: 'Diklat Kurikulum Merdeka Angkatan 3', institusi: 'Balai Diklat Keagamaan Surabaya', skor: 18 }),
  mk(2, 'penghargaan_individu', 'Disetujui', { daysAgo: 10, namaKegiatan: 'Guru Berprestasi Kab. Pasuruan', skor: 15 }),
  mk(3, 'prestasi_siswa', 'Menunggu', { daysAgo: 3, namaKegiatan: 'Juara 1 Olimpiade Matematika', institusi: 'Dinas Pendidikan Kab. Pasuruan', tingkat: 'Kabupaten' }),
  mk(4, 'penghargaan_institusi', 'Menunggu', { daysAgo: 2, namaKegiatan: 'Madrasah Adiwiyata Tingkat Provinsi', institusi: 'DLH Prov. Jatim', tingkat: 'Provinsi' }),
  mk(5, 'lulus_jenjang_lanjutan', 'Draft', { daysAgo: 5, namaKegiatan: 'Lulus S2 — Siti Aminah, M.Pd', tingkat: null }),
  mk(6, 'rapor_rata_rata', 'Draft', { daysAgo: 6, namaKegiatan: 'Rapor >85 — 42 dari 120 siswa (35%)' }),
  mk(7, 'giat_inovatif', 'Ditolak', { daysAgo: 8, namaKegiatan: 'Gerakan Literasi Digital Madrasah', alasan: 'Link bukti tidak dapat dibuka. Mohon upload ulang dengan akses publik (Anyone with link).' }),
  mk(8, 'siswa_lanjutan_unggulan', 'Ditolak', { daysAgo: 9, namaKegiatan: 'Lolos SNBP — Naila Putri, Universitas Airlangga', alasan: 'Nama siswa tidak sesuai dengan data di bukti. Periksa ejaan dan NISN.' }),
  mk(9, 'rasio_penerimaan', 'Disetujui', { daysAgo: 15, namaKegiatan: 'Rasio 112 pendaftar / 90 diterima (124%)', skor: 22 }),
  mk(10, 'diklat', 'Menunggu', { daysAgo: 1, namaKegiatan: 'Diklat Moderasi Beragama', skor: null }),
];

export const STATS = {
  Draft: MOCK_SUBMISSIONS.filter((s) => s.status === 'Draft').length,
  Menunggu: MOCK_SUBMISSIONS.filter((s) => s.status === 'Menunggu').length,
  Disetujui: MOCK_SUBMISSIONS.filter((s) => s.status === 'Disetujui').length,
  Ditolak: MOCK_SUBMISSIONS.filter((s) => s.status === 'Ditolak').length,
};

export const NOTIFIKASI = [
  { id: 1, tipe: 'ditolak', judul: 'Submission ditolak', desc: 'Giat Inovatif — Link bukti tidak dapat dibuka', time: '2 jam lalu', status: 'Ditolak' },
  { id: 2, tipe: 'disetujui', judul: 'Submission disetujui', desc: 'Rasio Penerimaan — skor +22', time: '1 hari lalu', status: 'Disetujui' },
  { id: 3, tipe: 'menunggu', judul: 'Menunggu validasi', desc: 'Prestasi Siswa — Juara 1 Olimpiade Matematika', time: '3 hari lalu', status: 'Menunggu' },
];

// Mock DeleteRequest untuk /operator/hapus-data — hanya Approved yang muncul di sini
// Status: Belum Diajukan (default), Menunggu Persetujuan, Disetujui (terhapus), Ditolak (dengan alasan)
export const MOCK_DELETE_REQUESTS = [
  {
    id: 'del-001',
    submissionItemId: 'sub-1',
    indikatorKode: 'diklat',
    indikatorNama: 'Diklat Tenaga Pendidik',
    namaKegiatan: 'Diklat Kurikulum Merdeka Angkatan 3',
    institusi: 'Balai Diklat Keagamaan Surabaya',
    tanggalDisetujui: new Date(now - 12 * 86400000).toISOString(),
    skor: 18,
    statusRequest: 'Belum Diajukan',
    alasan: null,
    alasanAdmin: null,
    requestedAt: null,
  },
  {
    id: 'del-002',
    submissionItemId: 'sub-2',
    indikatorKode: 'penghargaan_individu',
    indikatorNama: 'Penghargaan Individu Tenaga Pendidik',
    namaKegiatan: 'Guru Berprestasi Kab. Pasuruan',
    institusi: 'Kemenag Kab. Pasuruan',
    tanggalDisetujui: new Date(now - 10 * 86400000).toISOString(),
    skor: 15,
    statusRequest: 'Menunggu Persetujuan',
    alasan: 'Data ganda, salah input tahun. Mohon hapus.',
    alasanAdmin: null,
    requestedAt: new Date(now - 1 * 86400000).toISOString(),
  },
  {
    id: 'del-003',
    submissionItemId: 'sub-9',
    indikatorKode: 'rasio_penerimaan',
    indikatorNama: 'Rasio Penerimaan',
    namaKegiatan: 'Rasio 112 pendaftar / 90 diterima (124%)',
    institusi: 'Kemenag Kab. Pasuruan',
    tanggalDisetujui: new Date(now - 15 * 86400000).toISOString(),
    skor: 22,
    statusRequest: 'Ditolak',
    alasan: 'Duplikat dengan data tahun lalu, hapus saja.',
    alasanAdmin: 'Tidak dapat dihapus — data sudah masuk rekap periode dan mempengaruhi ranking. Hubungi Admin jika urgent.',
    requestedAt: new Date(now - 5 * 86400000).toISOString(),
    resolvedAt: new Date(now - 3 * 86400000).toISOString(),
  },
  {
    id: 'del-004',
    submissionItemId: 'sub-9-dup',
    indikatorKode: 'diklat',
    indikatorNama: 'Diklat Tenaga Pendidik',
    namaKegiatan: 'Diklat Moderasi Beragama — duplikat',
    institusi: 'Kemenag Kab. Pasuruan',
    tanggalDisetujui: new Date(now - 20 * 86400000).toISOString(),
    skor: 12,
    statusRequest: 'Disetujui',
    alasan: 'Salah upload file, bukan diklat ini.',
    alasanAdmin: 'Disetujui — data ditandai terhapus (soft delete), skor dihitung ulang, tercatat di audit trail.',
    requestedAt: new Date(now - 7 * 86400000).toISOString(),
    resolvedAt: new Date(now - 6 * 86400000).toISOString(),
  },
];

// Skor sementara (sum Disetujui)
export const SKOR_SEMENTARA = MOCK_SUBMISSIONS.filter((s) => s.status === 'Disetujui').reduce((a, b) => a + (b.skor || 0), 0);
export const RANKING_MOCK = { rank: 4, total: 16, kelompok: 'MI Negeri', periode: '2026/2027', updatedAt: new Date().toISOString() };

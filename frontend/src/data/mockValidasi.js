/**
 * NOTE: File ini dipertahankan sebagai data tiruan (mock/fallback)
 * untuk keperluan Storybook, UI testing, dan pengembangan offline.
 * Jalur produksi aplikasi utama 100% menggunakan API Backend real-time.
 */
import { INDIKATORS } from './mockLeaderboard';

const madrasahPool = [
  { nama: 'MI Negeri Bangil', kelompok: 'MI Negeri' },
  { nama: 'MI Darut Taqwa Bangil', kelompok: 'MI Swasta' },
  { nama: 'MTs Negeri 1 Pasuruan', kelompok: 'MTs Negeri' },
  { nama: 'MTs Al Yasini Areng-Areng', kelompok: 'MTs Swasta' },
  { nama: 'MAN 1 Pasuruan', kelompok: 'MA Negeri' },
  { nama: 'MA Zainul Hasan Genggong', kelompok: 'MA Swasta' },
  { nama: 'MI Negeri Pandaan', kelompok: 'MI Negeri' },
  { nama: 'MTs Negeri Bangil', kelompok: 'MTs Negeri' },
  { nama: 'MA Darul Ulum Pandaan', kelompok: 'MA Swasta' },
];

const institusiPool = ['Kemenag Kab. Pasuruan', 'Kemdikbud', 'Balai Diklat Surabaya', 'UNESA', 'Dinas Pendidikan Kab. Pasuruan'];
const statusPool = ['Menunggu', 'Menunggu', 'Menunggu', 'Disetujui', 'Disetujui', 'Ditolak', 'Draft'];

function random(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export const MOCK_ANTRIAN = Array.from({ length: 18 }, (_, i) => {
  const ms = madrasahPool[i % madrasahPool.length];
  const ind = INDIKATORS[i % INDIKATORS.length];
  const status = statusPool[i % statusPool.length];
  const skor = status === 'Disetujui' ? Math.floor(10 + Math.random() * 25) : status === 'Menunggu' ? Math.floor(8 + Math.random() * 20) : null;
  const daysAgo = Math.floor(Math.random() * 12) + 1;
  return {
    id: `val-${String(i + 1).padStart(3, '0')}`,
    madrasahNama: ms.nama,
    madrasahKelompok: ms.kelompok,
    indikatorKode: ind.kode,
    indikatorNama: ind.nama,
    skor,
    tanggalSubmit: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    status,
    periode: '2026/2027',
    linkBukti: 'https://drive.google.com/file/d/contoh-bukti-' + (i + 1),
    namaKegiatan: `${ind.short} — Contoh capaian #${i + 1}`,
    institusi: random(institusiPool),
    tingkat: ['Kabupaten', 'Provinsi', 'Nasional'][i % 3],
    catatan: i % 4 === 0 ? 'Catatan tambahan contoh' : '',
    alasan: status === 'Ditolak' ? 'Link bukti tidak dapat dibuka atau data tidak sesuai.' : null,
  };
});

/**
 * NOTE: File ini dipertahankan sebagai data tiruan (mock/fallback)
 * untuk keperluan Storybook, UI testing, dan pengembangan offline.
 * Jalur produksi aplikasi utama 100% menggunakan API Backend real-time.
 */
const now = Date.now();

function mk(id, hoursAgo, user, action, entity, entityId, opts = {}) {
  return {
    id: `log-${String(id).padStart(3, '0')}`,
    userId: user.id,
    userNama: user.nama,
    userRole: user.role,
    action,
    entity,
    entityId,
    dataSebelum: opts.dataSebelum || null,
    dataSesudah: opts.dataSesudah || null,
    alasan: opts.alasan || null,
    ipAddress: opts.ip || `192.168.1.${10 + (id % 90)}`,
    createdAt: new Date(now - hoursAgo * 3600000).toISOString(),
  };
}

const admin1 = { id: 'admin-001', nama: 'Admin Seksi Pendma', role: 'admin' };
const admin2 = { id: 'admin-002', nama: 'Siti Rahayu, S.Pd', role: 'admin' };
const op1 = { id: 'op-001', nama: 'Ahmad Fauzi, S.Pd', role: 'operator' };
const op2 = { id: 'op-002', nama: 'Siti Aminah, S.Pd', role: 'operator' };
const op3 = { id: 'op-003', nama: 'Budi Santoso, M.Pd', role: 'operator' };

export const MOCK_AUDIT_LOG = [
  mk(1, 1, admin1, 'approve_submission', 'SubmissionItem', 'val-003', {
    dataSebelum: { status: 'Menunggu' },
    dataSesudah: { status: 'Disetujui', skor: 18 },
    ip: '103.12.45.10',
  }),
  mk(2, 2, admin1, 'reject_submission', 'SubmissionItem', 'val-007', {
    alasan: 'Link bukti tidak dapat dibuka.',
    dataSebelum: { status: 'Menunggu' },
    dataSesudah: { status: 'Ditolak' },
  }),
  mk(3, 3, admin2, 'revoke', 'SubmissionItem', 'val-002', {
    alasan: 'Koreksi bobot salah input.',
    dataSebelum: { status: 'Disetujui', skor: 15 },
    dataSesudah: { status: 'Menunggu' },
  }),
  mk(4, 5, admin1, 'approve_delete_request', 'DeleteRequest', 'del-004', {
    dataSebelum: { statusRequest: 'Menunggu Persetujuan' },
    dataSesudah: { statusRequest: 'Disetujui', reviewedBy: 'admin-001' },
    alasan: 'Salah upload file, bukan diklat ini.',
  }),
  mk(5, 6, admin2, 'reject_delete_request', 'DeleteRequest', 'del-003', {
    alasan: 'Tidak dapat dihapus — data sudah masuk rekap periode dan mempengaruhi ranking.',
    dataSebelum: { statusRequest: 'Menunggu Persetujuan' },
    dataSesudah: { statusRequest: 'Ditolak', reviewedBy: 'admin-002' },
  }),
  mk(6, 7, admin1, 'approve_delete_request', 'DeleteRequest', 'del-006', {
    alasan: 'Salah pilih tingkat, seharusnya Kabupaten bukan Provinsi.',
    dataSebelum: { statusRequest: 'Menunggu Persetujuan' },
    dataSesudah: { statusRequest: 'Disetujui' },
  }),
  mk(7, 8, admin1, 'reopen_period', 'PeriodePenilaian', 'per-2025-2026', {
    alasan: 'Ada submission tertinggal yang belum divalidasi.',
    dataSebelum: { status: 'Finalisasi' },
    dataSesudah: { status: 'Penyelesaian Validasi' },
  }),
  mk(8, 9, admin2, 'reopen_period', 'PeriodePenilaian', 'per-2024-2025', {
    alasan: 'Koreksi data madrasah pindahan.',
    dataSebelum: { status: 'Arsip' },
    dataSesudah: { status: 'Finalisasi' },
  }),
  mk(9, 10, admin1, 'update_bobot', 'BobotIndikator', 'diklat', {
    dataSebelum: { nilai: 10 },
    dataSesudah: { nilai: 12 },
  }),
  mk(10, 11, admin1, 'update_bobot', 'BobotIndikator', 'penghargaan_institusi', {
    dataSebelum: { kabupaten: 1, provinsi: 2, nasional: 3 },
    dataSesudah: { kabupaten: 1, provinsi: 2, nasional: 4 },
  }),
  mk(11, 12, admin1, 'approve_account', 'User', 'akun-001', {
    dataSebelum: { status: 'Menunggu' },
    dataSesudah: { status: 'Aktif', nomorMadrasah: 'BMU-000201' },
  }),
  mk(12, 13, admin2, 'approve_account', 'User', 'akun-002', {
    dataSebelum: { status: 'Menunggu' },
    dataSesudah: { status: 'Aktif', nomorMadrasah: 'BMU-000202' },
  }),
  mk(13, 14, op1, 'login', 'User', 'op-001', { ip: '114.5.12.33' }),
  mk(14, 15, admin1, 'login', 'User', 'admin-001', { ip: '103.12.45.10' }),
  mk(15, 16, op2, 'login', 'User', 'op-002', { ip: '114.5.12.34' }),
  mk(16, 18, op1, 'create_submission', 'SubmissionItem', 'sub-010', {
    dataSesudah: { indikator: 'diklat', status: 'Menunggu', linkBukti: 'https://drive.google.com/file/d/...' },
  }),
  mk(17, 20, op3, 'update_madrasah', 'Madrasah', 'BMU-100137', {
    dataSebelum: { namaMadrasah: 'MI Negeri Bangil', jumlahSiswa: 340 },
    dataSesudah: { namaMadrasah: 'MI Negeri Bangil Baru', jumlahSiswa: 342 },
  }),
  mk(18, 22, admin1, 'export_pdf', 'Laporan', '2026/2027', {
    dataSesudah: { periode: '2026/2027', kelompok: 'Semua' },
  }),
  mk(19, 24, admin1, 'export_excel', 'Laporan', '2026/2027', {}),
  mk(20, 26, op2, 'request_delete', 'DeleteRequest', 'del-002', {
    alasan: 'Data ganda, salah input tahun. Mohon hapus.',
    dataSesudah: { statusRequest: 'Menunggu Persetujuan' },
  }),
  mk(21, 28, admin2, 'reject_submission', 'SubmissionItem', 'val-008', {
    alasan: 'Nama siswa tidak sesuai.',
    dataSebelum: { status: 'Menunggu' },
    dataSesudah: { status: 'Ditolak' },
  }),
  mk(22, 30, admin1, 'approve_submission', 'SubmissionItem', 'val-001', {
    dataSebelum: { status: 'Menunggu' },
    dataSesudah: { status: 'Disetujui', skor: 22 },
  }),
  mk(23, 34, op3, 'login', 'User', 'op-003', {}),
  mk(24, 36, admin1, 'finalize_period', 'PeriodePenilaian', 'per-2025-2026', {
    dataSebelum: { status: 'Penyelesaian Validasi' },
    dataSesudah: { status: 'Finalisasi' },
  }),
  mk(25, 40, admin2, 'create_periode', 'PeriodePenilaian', 'per-2027-2028', {
    dataSesudah: { nama: '2027/2028', status: 'Belum Dimulai' },
  }),
];

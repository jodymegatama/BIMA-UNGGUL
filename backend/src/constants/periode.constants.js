// Satu sumber kebenaran — kelompok madrasah & status histori periode.
// Digunakan di banyak service/controller agar tidak stringly-typed &
// tidak drift saat kelompok/status berubah.
export const KELOMPOKS_LIST = [
  'MI Negeri', 'MI Swasta',
  'MTs Negeri', 'MTs Swasta',
  'MA Negeri', 'MA Swasta',
];

// Status periode yang TIDAK bisa "jalan" (input ditutup — histogram/riwayat).
// Dipakai assertNoOverlap, resolveAktifPeriode, listPeriodePublik, dll.
export const STATUS_HISTORI_PERIODE = ['finalisasi', 'arsip', 'penyelesaian_validasi'];

export default { KELOMPOKS_LIST, STATUS_HISTORI_PERIODE };

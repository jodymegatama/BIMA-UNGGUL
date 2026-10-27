// Satu sumber kebenaran — kelompok madrasah & status histori periode.
// Digunakan di banyak service/controller agar tidak stringly-typed &
// tidak drift saat kelompok/status berubah.
export const KELOMPOKS_LIST = ['RA', 'MI', 'MTs', 'MA'];

// Tautan lama tetap membuka seluruh jenjang, termasuk kedua kepemilikan.
export function normalizeKelompok(value) {
  if (typeof value !== 'string') return null;
  const match = /^(RA|MI|MTS|MA)(?:\s+(?:Negeri|Swasta))?$/i.exec(value.trim());
  return match ? KELOMPOKS_LIST.find((k) => k.toUpperCase() === match[1].toUpperCase()) : null;
}

// Status periode yang TIDAK bisa "jalan" (input ditutup — histogram/riwayat).
// Dipakai assertNoOverlap, resolveAktifPeriode, listPeriodePublik, dll.
export const STATUS_HISTORI_PERIODE = ['finalisasi', 'arsip', 'penyelesaian_validasi'];

export default { KELOMPOKS_LIST, STATUS_HISTORI_PERIODE };

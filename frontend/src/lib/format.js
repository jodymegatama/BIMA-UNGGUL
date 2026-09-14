/**
 * formatSkor — formatter skor tunggal untuk seluruh aplikasi (DESIGN.md/PRD US8 transparansi).
 * 1 desimal, pakai titik (92.5), tanpa puluhan desimal panjang.
 * Untuk sekarang pakai floor 1 desimal biar 92.556 → 92.5 sesuai permintaan user
 * (kalau mau rounding ganti Math.floor → Math.round).
 */
export function formatSkor(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  const floored = Math.floor(n * 10) / 10;
  if (Number.isInteger(floored)) return String(floored);
  return floored.toFixed(1);
}

export default formatSkor;

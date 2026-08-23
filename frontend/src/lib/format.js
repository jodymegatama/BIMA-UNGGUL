/**
 * formatSkor — formatter skor tunggal untuk seluruh aplikasi (DESIGN.md/PRD US8 transparansi).
 * Context7 /mdn/content: Intl.NumberFormat("id-ID") → koma desimal Indonesia;
 * maximumFractionDigits: 1 → maksimal 1 desimal ("56,9"); bilangan bulat tampil polos ("57").
 *
 * Nilai numerik mentah tetap dipakai untuk sort/chart/ranking — helper ini HANYA untuk render string.
 */
const fmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });

export function formatSkor(value) {
  const n = Number(value);
  return Number.isFinite(n) ? fmt.format(n) : '—';
}

export default formatSkor;

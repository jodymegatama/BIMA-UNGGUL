/**
 * Opsi transaksi Prisma terpusat — dulu 6 salinan divergen (15000 vs 20000).
 * Nilai canonical: 20000 (operasi berat: batch bobot, cascade delete + recalc).
 * maxWait 5000 = batas waktu antre lock, timeout 20000 = batas eksekusi transaksi.
 */
export const TX_OPTS = { timeout: 20000, maxWait: 5000 };

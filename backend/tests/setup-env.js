/**
 * Setup env untuk suite backend (didaftarkan di vitest.config.js: setupFiles).
 *
 * Kenapa perlu: Prisma CLI membaca `.env` sendiri, tapi `@prisma/client` saat
 * runtime TIDAK — dia hanya melihat `process.env`. Sebelum ini tidak ada yang
 * memuat `.env` untuk test, sehingga `npx vitest run` di lokal gagal dengan
 * "Environment variable not found: DATABASE_URL" walaupun `backend/.env` ada
 * dan gate `dbGate()` sudah membuka suite-nya — gate membuka pintu, tapi
 * Prisma tetap tidak melihat kredensialnya.
 *
 * Path-nya di-resolve dari lokasi file ini (bukan cwd), supaya tetap benar
 * entah vitest dijalankan dari `backend/` atau lewat `npm test -w backend`.
 * dotenv tidak menimpa env yang sudah ada, jadi DATABASE_URL dari shell / CI
 * tetap menang.
 */
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config({
  path: fileURLToPath(new URL('../.env', import.meta.url)),
  quiet: true,
});

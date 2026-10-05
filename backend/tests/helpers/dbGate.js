/**
 * Gate DB untuk integration test backend.
 *
 * Suite integrasi butuh MySQL nyata (`DATABASE_URL` di `backend/.env`, yang
 * gitignored). Tanpa env, Prisma melempar PrismaClientInitializationError di
 * `beforeAll` dan seluruh file dilaporkan gagal — padahal bukan kode yang
 * salah, hanya environment-nya yang belum disiapkan.
 *
 * Pola yang dipakai: `describe.skipIf(!dbGate())(...)`. Suite tetap terdaftar
 * (terlihat di laporan) tapi di-skip, sama seperti `hasCreds ? it : it.skip`
 * yang sudah dipakai api.integration.test.js untuk login admin.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BACKEND_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * True bila ada DATABASE_URL di shell atau di backend/.env.
 *
 * Yang mengecek keduanya: Prisma membaca `.env` lewat dotenv, sedangkan
 * `process.env` hanya terisi kalau variabelnya di-export di shell. Kalau hanya
 * salah satu yang dicek, suite ikut ter-skip pada setup yang sebenarnya siap —
 * atau gagal keras pada setup yang sebenarnya belum.
 */
function hasDb() {
  if (process.env.DATABASE_URL) return true;
  const envPath = join(BACKEND_ROOT, '.env');
  if (!existsSync(envPath)) return false;
  try {
    return readFileSync(envPath, 'utf8').split(/\r?\n/).some((line) => /^\s*DATABASE_URL\s*=\s*\S/.test(line));
  } catch {
    return false;
  }
}

/**
 * Alasan yang tampil saat suite di-skip, supaya jelas ini keputusan
 * environment dan bukan test yang diam-diam hilang dari laporan.
 */
export const DB_MISSING_HINT =
  'Butuh MySQL: isi DATABASE_URL di backend/.env (lihat .env.example) lalu jalankan ulang.';

let sudahPeringatkan = false;

/**
 * Gate yang dipakai di `describe.skipIf(...)`: sama seperti `hasDb()`, tapi
 * juga mencetak alasannya ke stdout kalau DB belum siap. Dipisah dari
 * `hasDb()` supaya pemanggil cukup menulis `!dbGate()` — tanpa import
 * `DB_MISSING_HINT` yang menganggur di tiap file test.
 *
 * Dedupe `sudahPeringatkan` bersifat per-file (tiap file test punya sendiri
 * modul ini karena Vitest mengisolasi module graph per test file), jadi
 * paling banyak satu baris per file — tetap terbaca, tidak jadi spam.
 */
export function dbGate() {
  const siap = hasDb();
  if (!siap && !sudahPeringatkan) {
    sudahPeringatkan = true;
    console.warn(`[test] Suite integrasi backend di-skip — ${DB_MISSING_HINT}`);
  }
  return siap;
}
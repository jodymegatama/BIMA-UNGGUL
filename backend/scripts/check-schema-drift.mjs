/**
 * Cek sinkronisasi DB ↔ schema.prisma ↔ folder migrations.
 *
 * Dipakai dua tempat:
 *   * CI — gate setelah `prisma:deploy` (DB dibangun murni dari migrations)
 *   * lokal — `npm run db:check` untuk tahu lebih awal kalau DB dev sendiri
 *     sudah tidak sinkron
 *
 * Yang diperiksa:
 *   1. Migration yang belum diterapkan di DB ini (`prisma migrate status`)
 *   2. Beda struktur antara DB dan `prisma/schema.prisma` (`prisma migrate diff`)
 *
 * Urutan sumber DATABASE_URL: argumen CLI → environment → `backend/.env`.
 *
 * Exit code: 0 = sinkron, 1 = ada yang belum sinkron / prasyarat kurang.
 */
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import dotenv from 'dotenv';

const BACKEND_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCHEMA = join(BACKEND_ROOT, 'prisma', 'schema.prisma');
const ENV_FILE = join(BACKEND_ROOT, '.env');

// dotenv tidak menimpa env yang sudah ada, jadi env shell tetap menang.
if (existsSync(ENV_FILE)) dotenv.config({ path: ENV_FILE, quiet: true });

// Terima URL sebagai argumen supaya bisa dipakai tanpa mengubah env:
//   node scripts/check-schema-drift.mjs "mysql://user:pass@host:3306/db"
const argUrl = process.argv.slice(2).find((a) => !a.startsWith('-'));
const databaseUrl = argUrl || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(
    '[check] DATABASE_URL belum ada.\n' +
      '        Pilih salah satu:\n' +
      `          1. buat ${ENV_FILE} (salin dari backend/.env.example, isi DATABASE_URL)\n` +
      '          2. set DATABASE_URL di shell\n' +
      '          3. berikan sebagai argumen:\n' +
      '             npm run db:check -- "mysql://user:pass@host:3306/nama_db"',
  );
  process.exit(1);
}

/** Tampilkan identitas DB tanpa membocorkan password ke log CI. */
function describeUrl(url) {
  try {
    const u = new URL(url);
    return `${u.hostname}:${u.port || '3306'}${u.pathname}`;
  } catch {
    return '<DATABASE_URL>';
  }
}

// Resolve CLI Prisma lewat node_modules, bukan `npx`: di sebagian environment
// `node_modules/.bin` tidak ter-link, dan `npx` bisa menarik versi lain.
const prismaCli = createRequire(import.meta.url).resolve('prisma/build/index.js');
const runPrisma = (args) =>
  execFileSync(process.execPath, [prismaCli, ...args], {
    cwd: BACKEND_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

console.log(`[check] DB: ${describeUrl(databaseUrl)}`);

// --- 1. Migration yang belum diterapkan -------------------------------------
let statusOut;
let statusFailed = false;
try {
  statusOut = runPrisma(['migrate', 'status']);
} catch (err) {
  statusFailed = true;
  statusOut = `${err.stdout || ''}${err.stderr || ''}`;
}
const pending = /have not yet been applied/i.test(statusOut);

// --- 2. Beda struktur DB ↔ schema -------------------------------------------
let diff;
try {
  diff = runPrisma(['migrate', 'diff', '--from-url', databaseUrl, '--to-schema-datamodel', SCHEMA, '--script']);
} catch (err) {
  console.error('[check] gagal menjalankan `prisma migrate diff`:\n' + (err.stderr || err.message));
  process.exit(1);
}

const statements = diff
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('--'));

const masalah = [];

if (pending) {
  const daftar = (statusOut.match(/^\d{14}_\w+$/gm) || []).map((m) => `          - ${m}`).join('\n');
  masalah.push(
    'Ada migration yang BELUM diterapkan ke DB ini.\n' +
      (daftar ? daftar + '\n' : '') +
      '        Jalankan: npm run prisma:deploy -w backend',
  );
} else if (statusFailed) {
  // Bukan karena pending — kemungkinan tidak bisa konek / DB belum dibuat.
  masalah.push('`prisma migrate status` gagal:\n' + statusOut.trim());
}

if (statements.length > 0) {
  masalah.push(
    'Struktur DB BEDA dari schema.prisma.\n' +
      '        Artinya ada perubahan schema tanpa migration, ATAU migration yang\n' +
      '        hasilnya tidak sama dengan schema. Jangan diabaikan — DB baru\n' +
      '        (CI, produksi, onboarding) dibangun dari folder migrations.\n\n' +
      '        -------- prisma migrate diff (DB vs schema) --------\n' +
      diff +
      '        ---------------------------------------------------',
  );
}

if (masalah.length === 0) {
  console.log('[check] OK — DB ini sinkron dengan schema.prisma dan seluruh migration.');
  process.exit(0);
}

console.error(`[check] TIDAK SINKRON (${masalah.length} masalah):\n`);
masalah.forEach((m, i) => console.error(`  ${i + 1}. ${m}\n`));
process.exit(1);

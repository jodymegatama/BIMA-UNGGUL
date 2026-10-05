/**
 * Rekonsiliasi draft nyangkut di periode lama.
 *
 * Dipakai:
 *   npm run db:reconcile-drafts          # laporan saja, tidak menulis apa pun
 *   npm run db:reconcile-drafts -- --apply   # benar-benar memindahkan draft
 *
 * Logika ada di src/services/draftReconcile.js supaya bisa diuji; file ini hanya
 * pembungkus CLI.
 *
 * Exit code: 0 = aman (tidak ada draft nyangkut, atau semuanya sudah diperbaiki),
 * 1 = masih ada draft yang butuh tindakan manual/admin.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import dotenv from 'dotenv';

const BACKEND_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
if (existsSync(join(BACKEND_ROOT, '.env'))) dotenv.config({ path: join(BACKEND_ROOT, '.env'), quiet: true });

// Dynamic import butuh file:// URL — path Windows seperti C:\... tidak diterima
// oleh ESM loader.
const { reconcileLegacyDrafts } = await import(
  pathToFileURL(join(BACKEND_ROOT, 'src', 'services', 'draftReconcile.js')).href
);
const { prisma } = await import(pathToFileURL(join(BACKEND_ROOT, 'src', 'db', 'prisma.js')).href);

const apply = process.argv.includes('--apply');

console.log(`[reconcile] mode: ${apply ? 'TULIS (--apply)' : 'dry-run (tidak menulis)'}`);
console.log('[reconcile] DB:', (process.env.DATABASE_URL || '(tidak ada)').replace(/:[^:@/]*@/, ':***@'));

const laporan = await reconcileLegacyDrafts({ apply });

console.log('[reconcile] periode aktif:', laporan.periodeAktif ? `${laporan.periodeAktif.nama} (status ${laporan.periodeAktif.status})` : 'tidak ada');
console.log(`[reconcile] total draft: ${laporan.totalDraft} | sehat: ${laporan.sehat} | diperbaiki: ${laporan.diperbaiki.length} | perlu tindakan admin: ${laporan.perluTindakanAdmin.length}`);

for (const d of laporan.diperbaiki) console.log(`  [pindah] #${d.id} periode ${d.dari} -> ${d.ke}`);
for (const d of laporan.perluTindakanAdmin) console.log(`  [perManual] #${d.id} "${d.namaKegiatan ?? ''}" — ${d.alasan}${d.aksi ? ` (${d.aksi})` : ''}`);

if (!apply && laporan.perluTindakanAdmin.some((d) => d.alasan !== 'punya_riwayat_validasi')) {
  console.log('[reconcile] jalankan ulang dengan --apply untuk memindahkan draft yang aman dipindah.');
}

await prisma.$disconnect();
process.exit(laporan.perluTindakanAdmin.length > 0 ? 1 : 0);
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { KELOMPOKS_LIST } from '../src/constants/periode.constants.js';

// Default baca-saja; --apply memperbaiki master tanpa menyentuh capaian/bobot.
export async function migrateKelompok(db, { apply = false } = {}) {
  const rows = await db.madrasah.findMany({ select: { id: true, jenjang: true, kelompok: true, deletedAt: true } });
  if (rows.some((m) => !KELOMPOKS_LIST.includes(m.jenjang))) throw new Error('Jenjang tidak dikenal; migrasi dihentikan.');
  const changes = rows.filter((m) => m.kelompok !== m.jenjang);
  const report = {
    mode: apply ? 'apply' : 'dry-run',
    total: rows.length,
    nonaktif: rows.filter((m) => m.deletedAt).length,
    pending: await db.user.count({ where: { status: 'menunggu' } }),
    groups: rows.reduce((all, m) => ({ ...all, [m.kelompok]: (all[m.kelompok] || 0) + 1 }), {}),
    changes: changes.length,
    updated: 0,
  };
  if (!apply || !changes.length) return report;
  await db.$transaction(async (tx) => {
    const actor = await tx.user.findFirst({ where: { role: 'admin' }, orderBy: { id: 'asc' }, select: { id: true } });
    if (!actor) throw new Error('Akun admin pencatat migrasi belum tersedia.');
    for (const jenjang of KELOMPOKS_LIST) {
      // ID hasil perbandingan JS juga menangkap beda kapitalisasi di kolasi MySQL CI.
      const ids = changes.filter((m) => m.jenjang === jenjang).map((m) => m.id);
      if (!ids.length) continue;
      const result = await tx.madrasah.updateMany({ where: { id: { in: ids }, jenjang }, data: { kelompok: jenjang } });
      report.updated += result.count;
    }
    if (report.updated) await tx.auditLog.create({ data: {
      userId: actor.id, action: 'migrate_kelompok_jenjang', entity: 'Madrasah', entityId: 'all',
      dataSebelum: { jumlahDiubah: report.updated },
      dataSesudah: { kelompok: KELOMPOKS_LIST, source: 'maintenance_script' },
      alasan: 'Kelompok seluruh periode mengikuti jenjang.', ipAddress: 'maintenance',
    } });
  });
  return report;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });
  const db = new PrismaClient();
  try {
    console.log(JSON.stringify(await migrateKelompok(db, { apply: process.argv.includes('--apply') }), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}

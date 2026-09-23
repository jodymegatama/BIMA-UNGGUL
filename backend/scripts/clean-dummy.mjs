/**
 * clean-dummy.mjs — Purge semua data dummy/test dari DB
 * KEEPS: 1 admin (nip 199012312345678901) + 9 Indikator master data
 * PURGES: User dummy lain, Madrasah BMU-TEST / BMU-999001 / BMU-E2E-VAL / BMU-PUBADM,
 *         PeriodePenilaian TEST/2026 | E2E-VAL/2026 | PUBADM/2026, + cascade children.
 * NOTE: tabel MadrasahScore sudah dihapus (live-compute 432a673) — tidak ada lagi
 * di purge list; skor selalu dihitung saat dibaca.
 */
import { prisma } from '../src/db/prisma.js';

const KEEP_ADMIN_NIP = '199012312345678901';
const DUMMY_USER_NIPS = [
  '19700101199203001', // testScoring admin (admin tetap ber-NIP)
  // operator dummy kini tanpa nip — dicocokkan via email di bawah
];
const DUMMY_PERIODE_NAMES = ['TEST/2026', 'E2E-VAL/2026', 'PUBADM/2026', '2099/2100'];
const DUMMY_MADRASAH_BMUS = ['BMU-999001'];

async function main() {
  console.log('🧹 Memulai pembersihan data dummy...');

  // 1. Resolve keep admin
  const keepAdmin = await prisma.user.findUnique({ where: { nip: KEEP_ADMIN_NIP } });
  if (!keepAdmin) throw new Error(`Admin ${KEEP_ADMIN_NIP} tidak ditemukan — abort`);
  console.log(`✓ Keep admin: ${KEEP_ADMIN_NIP} (${keepAdmin.name})`);

  // 2. Resolve dummy users
  const dummyUsers = await prisma.user.findMany({
    where: {
      OR: [
        { nip: { in: DUMMY_USER_NIPS } },
        { nip: { startsWith: 'E2E-VAL' } },
        { nip: { startsWith: 'PUBADM' } },
        { nip: { startsWith: 'TEST-' } },
        { email: { contains: '@test.local' } },
        { email: { in: ['admin.dummy@kemenag.go.id', 'operator.dummy@madrasah.local', 'menunggu@madrasah.local'] } },
      ],
      NOT: { id: keepAdmin.id },
    },
    select: { id: true, nip: true },
  });
  const dummyUserIds = dummyUsers.map((u) => u.id);
  console.log(`→ Dummy users to delete: ${dummyUsers.length}`);
  for (const u of dummyUsers) console.log(`   - ${u.nip}`);

  // 3. Resolve dummy periods
  const dummyPeriods = await prisma.periodePenilaian.findMany({
    where: {
      OR: [
        { namaPeriode: { in: DUMMY_PERIODE_NAMES } },
        { namaPeriode: { startsWith: 'TEST/' } },
        { namaPeriode: { startsWith: 'E2E-' } },
        { namaPeriode: { startsWith: 'PUBADM' } },
      ],
    },
    select: { id: true, namaPeriode: true },
  });
  const dummyPeriodeIds = dummyPeriods.map((p) => p.id);
  console.log(`→ Dummy periode to delete: ${dummyPeriodeIds.length}`);
  for (const p of dummyPeriods) console.log(`   - ${p.namaPeriode} (id=${p.id})`);

  // 4. Resolve dummy madrasah
  const dummyMadrasah = await prisma.madrasah.findMany({
    where: {
      OR: [
        { nomorMadrasah: { in: DUMMY_MADRASAH_BMUS } },
        { nomorMadrasah: { startsWith: 'BMU-TEST' } },
        { nomorMadrasah: { startsWith: 'BMU-E2E-VAL' } },
        { nomorMadrasah: { startsWith: 'BMU-PUBADM' } },
        { slug: 'mi-negeri-dummy' },
        { slug: { startsWith: 'slug-pubadm-' } },
        { slug: { startsWith: 'madrasah-e2e-val-' } },
        { slug: { startsWith: 'mi-test-' } },
      ],
    },
    select: { id: true, nomorMadrasah: true },
  });
  const dummyMadrasahIds = dummyMadrasah.map((m) => m.id);
  console.log(`→ Dummy madrasah to delete: ${dummyMadrasahIds.length}`);
  for (const m of dummyMadrasah) console.log(`   - ${m.nomorMadrasah}`);

  // 5. Atomic purge
  const result = await prisma.$transaction(async (tx) => {
    let deletedAuditByUser = 0;
    if (dummyUserIds.length) {
      deletedAuditByUser = (await tx.auditLog.deleteMany({ where: { userId: { in: dummyUserIds } } })).count;
    }
    let deletedAuditByIp = 0;
    try {
      deletedAuditByIp = (
        await tx.auditLog.deleteMany({
          where: { ipAddress: { in: ['127.0.0.1-e2e', '127.0.0.1-e2e-final', 'unknown'] } },
        })
      ).count;
    } catch { /* optional */ }

    // Children of SubmissionItem tied to dummy periode/madrasah
    let delValidation = 0, delDeleteRequest = 0, delSubmissionItem = 0, delBobot = 0;

    if (dummyPeriodeIds.length || dummyMadrasahIds.length) {
      // find submissionItems linked to either
      const items = await tx.submissionItem.findMany({
        where: { OR: [{ periodeId: { in: dummyPeriodeIds } }, { madrasahId: { in: dummyMadrasahIds } }] },
        select: { id: true },
      });
      const itemIds = items.map((i) => i.id);
      if (itemIds.length) {
        delValidation = (await tx.validation.deleteMany({ where: { submissionItemId: { in: itemIds } } })).count;
        delDeleteRequest = (await tx.deleteRequest.deleteMany({ where: { submissionItemId: { in: itemIds } } })).count;
        delSubmissionItem = (await tx.submissionItem.deleteMany({ where: { id: { in: itemIds } } })).count;
      }
      if (dummyPeriodeIds.length) {
        delBobot = (await tx.bobotIndikator.deleteMany({ where: { periodeId: { in: dummyPeriodeIds } } })).count;
      }
    }

    // Delete parents
    let delPeriode = 0, delMadrasah = 0, delUser = 0;
    if (dummyPeriodeIds.length) {
      delPeriode = (await tx.periodePenilaian.deleteMany({ where: { id: { in: dummyPeriodeIds } } })).count;
    }
    if (dummyMadrasahIds.length) {
      // clear FK on users first
      await tx.user.updateMany({ where: { madrasahId: { in: dummyMadrasahIds }, NOT: { id: keepAdmin.id } }, data: { madrasahId: null } });
      delMadrasah = (await tx.madrasah.deleteMany({ where: { id: { in: dummyMadrasahIds } } })).count;
    }
    if (dummyUserIds.length) {
      delUser = (await tx.user.deleteMany({ where: { id: { in: dummyUserIds } } })).count;
    }

    return { deletedAuditByUser, deletedAuditByIp, delValidation, delDeleteRequest, delSubmissionItem, delBobot, delPeriode, delMadrasah, delUser };
  });

  console.log('\n=== HASIL PENGHAPUSAN ===');
  for (const [k, v] of Object.entries(result)) {
    console.log(`${v} rows → ${k}`);
  }

  // 6. Verifikasi akhir
  const counts = {
    user: await prisma.user.count(),
    indikator: await prisma.indikator.count(),
    periode: await prisma.periodePenilaian.count(),
    madrasah: await prisma.madrasah.count(),
    submission: await prisma.submissionItem.count(),
    validation: await prisma.validation.count(),
    bobot: await prisma.bobotIndikator.count(),
    audit: await prisma.auditLog.count(),
    notification: await prisma.notification.count(),
  };
  console.log('\n=== COUNTS SETELAH CLEANUP ===');
  console.table(counts);
  const remaining = await prisma.user.findMany({ select: { nip: true, name: true, role: true, status: true } });
  console.log('Remaining users:', JSON.stringify(remaining, null, 2));
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

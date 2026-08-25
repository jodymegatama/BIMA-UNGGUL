/**
 * Smoke test Notifikasi — approve submission via service → notifikasi operator dibuat.
 * Jalankan dari folder backend: node scripts/smoke-notification.mjs
 */
import { PrismaClient } from '@prisma/client';
import authService from '../src/services/authService.js';
import validationService from '../src/services/validationService.js';

const prisma = new PrismaClient();

async function main() {
  // cari submission 'menunggu' milik operator; kalau tak ada, buat dulu
  let item = await prisma.submissionItem.findFirst({
    where: { status: 'menunggu', deletedAt: null },
    orderBy: { id: 'desc' },
  });
  let created = false;
  if (!item) {
    const user = await prisma.user.findFirst({ where: { role: 'operator', status: 'aktif' } });
    const indikator = await prisma.indikator.findFirst();
    const periode = await prisma.periodePenilaian.findFirst({ orderBy: { id: 'desc' } });
    item = await prisma.submissionItem.create({
      data: {
        madrasahId: user.madrasahId, indikatorId: indikator.id, periodeId: periode.id,
        createdById: user.id, namaKegiatan: 'Notif Smoke', institusi: 'X', namaPeserta: 'Y',
        statusPegawai: 'asn', linkBukti: 'https://x.co/n', status: 'menunggu', tahun: periode.tahunCapaian,
      },
    });
    created = true;
  }
  const notifBefore = await prisma.notification.count({ where: { userId: item.createdById } });

  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!admin) return console.log('SKIP — tidak ada user admin');

  await validationService.approveSubmission({ id: item.id, adminId: admin.id, ip: '127.0.0.1' });
  const notif = await prisma.notification.findFirst({
    where: { userId: item.createdById, tipe: 'submission_approved' },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Notif submission_approved:', notif ? `OK — "${notif.pesan}"` : 'FAIL');

  // reject path (revoke dulu agar boleh reject? revoke→ditolak, lalu reject butuh menunggu; langsung pakai reject pada item lain)
  // cukup verifikasi revoke juga membuat notif:
  await validationService.revokeSubmission({ id: item.id, adminId: admin.id, alasan: 'smoke revoke', ip: '127.0.0.1' });
  const notif2 = await prisma.notification.findFirst({
    where: { userId: item.createdById, tipe: 'submission_revoked' },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Notif submission_revoked:', notif2 ? 'OK' : 'FAIL');

  // markAllAsRead
  const { markAllAsRead } = await import('../src/services/notificationService.js');
  const r = await markAllAsRead(item.createdById);
  const unread = await prisma.notification.count({ where: { userId: item.createdById, statusBaca: 'belum_dibaca' } });
  console.log('markAllAsRead count:', r.count, '| sisa unread:', unread === 0 ? 'OK' : 'FAIL');

  // cleanup: hapus item uji + notif uji (bila dibuat script ini)
  if (created) {
    await prisma.submissionItem.delete({ where: { id: item.id } });
    await prisma.auditLog.deleteMany({ where: { entity: 'SubmissionItem', entityId: String(item.id) } });
    await prisma.notification.deleteMany({ where: { userId: item.createdById, tipe: { in: ['submission_approved', 'submission_revoked'] }, pesan: { contains: 'Notif Smoke' } } });
    // recalc balik
    const { recalculateAfterAction } = await import('../src/services/scoringService.js');
    await recalculateAfterAction(item.madrasahId, item.periodeId);
    console.log('cleanup OK');
  } else {
    console.log('item pre-existing — tidak dihapus; notif uji dibiarkan (data nyata)');
  }
  console.log('notifBefore:', notifBefore);
}

main().finally(() => prisma.$disconnect());

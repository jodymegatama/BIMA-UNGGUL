import { prisma } from '../src/db/prisma.js';

await prisma.auditLog.deleteMany({});
console.log('AuditLog purged');

const mads = await prisma.madrasah.findMany();
for (const mad of mads) {
  await prisma.madrasahScore.deleteMany({ where: { madrasahId: mad.id } });
  await prisma.user.updateMany({ where: { madrasahId: mad.id }, data: { madrasahId: null } });
  await prisma.madrasah.delete({ where: { id: mad.id } });
  console.log('Deleted madrasah', mad.nomorMadrasah, mad.slug);
}

console.table({
  users: await prisma.user.count(),
  indikator: await prisma.indikator.count(),
  periode: await prisma.periodePenilaian.count(),
  madrasah: await prisma.madrasah.count(),
  submission: await prisma.submissionItem.count(),
  validation: await prisma.validation.count(),
  deleteReq: await prisma.deleteRequest.count(),
  bobot: await prisma.bobotIndikator.count(),
  score: await prisma.madrasahScore.count(),
  audit: await prisma.auditLog.count(),
  notif: await prisma.notification.count(),
});

const rem = await prisma.user.findMany({ select: { nip: true, name: true, role: true, status: true } });
console.log('FINAL users:', JSON.stringify(rem, null, 2));
await prisma.$disconnect();

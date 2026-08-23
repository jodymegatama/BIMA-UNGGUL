import { prisma } from '../src/db/prisma.js';

// Hapus user Test Operator yang tersisa + madrasah sisa + notification/audit terkait
const nip = '197812345678900002';
const u = await prisma.user.findUnique({ where: { nip } });
if (u) {
  await prisma.notification.deleteMany({ where: { userId: u.id } });
  await prisma.auditLog.deleteMany({ where: { userId: u.id } });
  await prisma.user.delete({ where: { id: u.id } });
  console.log(`Deleted user ${nip}`);
} else {
  console.log(`User ${nip} not found`);
}

// Cek madrasah yang tersisa
const m = await prisma.madrasah.findMany();
console.log('Remaining madrasah:', JSON.stringify(m.map((x)=>({bmu:x.nomorMadrasah, slug:x.slug})), null, 2));
for (const mm of m) {
  // hapus jika masih dummy (slug mengandung test/e2e/pubadm/dummy)
  const isDummy = /dummy|test|e2e|pubadm/i.test(mm.slug || '') || /^BMU-999/.test(mm.nomorMadrasah);
  if (isDummy) {
    await prisma.madrasahScore.deleteMany({ where: { madrasahId: mm.id } });
    await prisma.madrasah.delete({ where: { id: mm.id } });
    console.log(`Deleted dummy madrasah ${mm.nomorMadrasah}`);
  }
}

// Cek audit/notification yang tersisa
const audits = await prisma.auditLog.findMany();
console.log('Remaining audit:', JSON.stringify(audits.map(a=>({action:a.action, ip:a.ipAddress, entity:a.entity+':'+a.entityId})), null, 2));
for (const a of audits) {
  if (/e2e/i.test(a.ipAddress||'') || /TEST|PUBADM|E2E-VAL/i.test(a.entityId||'')) {
    await prisma.auditLog.delete({ where: { id: a.id } });
    console.log(`Deleted audit ${a.id} (${a.action})`);
  }
}

const notifs = await prisma.notification.findMany();
console.log('Remaining notifications:', JSON.stringify(notifs, null, 2));
for (const n of notifs) {
  const owner = await prisma.user.findUnique({ where: { id: n.userId } });
  if (!owner) {
    await prisma.notification.delete({ where: { id: n.id } });
    console.log(`Orphan notification deleted ${n.id}`);
  } else if (/menunggu|test\.local|madrasah\.local|kemenag\.go\.id/i.test(owner.email||'')) {
    await prisma.notification.delete({ where: { id: n.id } });
    console.log(`Notification of dummy deleted ${n.id}`);
  }
}

// Final counts
console.table({
  users: await prisma.user.count(),
  indikator: await prisma.indikator.count(),
  periode: await prisma.periodePenilaian.count(),
  madrasah: await prisma.madrasah.count(),
  submission: await prisma.submissionItem.count(),
  validation: await prisma.validation.count(),
  bobot: await prisma.bobotIndikator.count(),
  score: await prisma.madrasahScore.count(),
  audit: await prisma.auditLog.count(),
  notification: await prisma.notification.count(),
});
const rem = await prisma.user.findMany({ select: { nip: true, name: true, role: true, status: true } });
console.log('FINAL users:', JSON.stringify(rem, null, 2));
await prisma.$disconnect();

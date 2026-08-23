import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Buat notifikasi in-app untuk user tertentu
 * @param {number} userId
 * @param {string} tipe - contoh: submission_approved, submission_rejected, account_approved
 * @param {string} pesan
 */
export async function createNotification(userId, tipe, pesan) {
  try {
    const notif = await prisma.notification.create({
      data: { userId: Number(userId), tipe, pesan, statusBaca: 'belum_dibaca' },
    });
    return notif;
  } catch (err) {
    console.error('[notificationService.create]', err.message);
    return null;
  }
}

/**
 * Tandai satu notifikasi sebagai sudah dibaca (hanya milik user tersebut)
 */
export async function markAsRead(notificationId, userId) {
  const notif = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notif) throw Object.assign(new Error('Notifikasi tidak ditemukan'), { status: 404 });
  if (Number(notif.userId) !== Number(userId)) throw Object.assign(new Error('Forbidden'), { status: 403 });
  return prisma.notification.update({
    where: { id: notificationId },
    data: { statusBaca: 'sudah_dibaca' },
  });
}

/**
 * Ambil notifikasi milik user, terbaru dulu
 */
export async function getNotifications(userId, { limit = 50 } = {}) {
  return prisma.notification.findMany({
    where: { userId: Number(userId) },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

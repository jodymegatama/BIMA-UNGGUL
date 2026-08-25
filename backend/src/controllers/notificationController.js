import { getNotifications, markAsRead, markAllAsRead } from '../services/notificationService.js';

// GET /api/notifications — list milik user login (auth required, semua role)
export async function list(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const data = await getNotifications(userId);
    res.json(data);
  } catch (err) {
    console.error('[GET /notifications]', err);
    res.status(500).json({ error: 'Gagal ambil notifikasi' });
  }
}

// PATCH /api/notifications/:id/read — tandai sudah dibaca
export async function markRead(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const updated = await markAsRead(req.params.id, userId);
    res.json({ success: true, data: updated });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Gagal update notifikasi' });
  }
}

// PATCH /api/notifications/read-all — tandai SEMUA notifikasi user sudah dibaca (bulk)
export async function markAllRead(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await markAllAsRead(userId);
    res.json({ success: true, count: result.count });
  } catch (err) {
    console.error('[PATCH /notifications/read-all]', err);
    res.status(500).json({ error: 'Gagal update notifikasi' });
  }
}

export default { list, markRead, markAllRead };

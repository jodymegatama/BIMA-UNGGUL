import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { getNotifications, markAsRead } from '../services/notificationService.js';

const router = express.Router();

// GET /api/notifications — list milik user login (auth required, semua role)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const data = await getNotifications(userId);
    res.json(data);
  } catch (err) {
    console.error('[GET /notifications]', err);
    res.status(500).json({ error: 'Gagal ambil notifikasi' });
  }
});

// PATCH /api/notifications/:id/read — tandai sudah dibaca
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const updated = await markAsRead(req.params.id, userId);
    res.json({ success: true, data: updated });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Gagal update notifikasi' });
  }
});

export default router;

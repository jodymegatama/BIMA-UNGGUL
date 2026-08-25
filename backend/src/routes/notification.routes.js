import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import notificationController from '../controllers/notificationController.js';

const router = express.Router();

// Semua route notifikasi butuh auth (semua role)
router.use(authMiddleware);

// GET /api/notifications — list milik user login
router.get('/', notificationController.list);

// PATCH /api/notifications/read-all — tandai SEMUA sudah dibaca (bulk) — sebelum '/:id/read' agar tak ambigu
router.patch('/read-all', notificationController.markAllRead);

// PATCH /api/notifications/:id/read — tandai sudah dibaca
router.patch('/:id/read', notificationController.markRead);

export default router;

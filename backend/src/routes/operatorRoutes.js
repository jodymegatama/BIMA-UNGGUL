import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';
import {
  getMadrasah,
  updateMadrasah,
  getIndikatorStatus,
  listSubmissionItems,
  draftIndikatorItems,
  submitIndikatorItems,
  updateSubmissionItem,
  requestDeleteSubmissionItem,
} from '../controllers/operatorController.js';

const router = express.Router();

// Semua route operator butuh auth + role operator
router.get('/madrasah', authMiddleware, roleMiddleware(['operator']), getMadrasah);
router.patch('/madrasah', authMiddleware, roleMiddleware(['operator']), updateMadrasah);
// Ref PRD §13 — status & data 9 indikator milik madrasah operator + daftar submission item
router.get('/indikator', authMiddleware, roleMiddleware(['operator']), getIndikatorStatus);
router.get('/submission-item', authMiddleware, roleMiddleware(['operator']), listSubmissionItems);
// Write endpoints — PRD §13 / US2 US3 US4 US7b
router.post('/indikator/:id/draft', authMiddleware, roleMiddleware(['operator']), draftIndikatorItems);
router.post('/indikator/:id/submit', authMiddleware, roleMiddleware(['operator']), submitIndikatorItems);
router.patch('/submission-item/:id', authMiddleware, roleMiddleware(['operator']), updateSubmissionItem);
router.post('/submission-item/:id/request-delete', authMiddleware, roleMiddleware(['operator']), requestDeleteSubmissionItem);

export default router;

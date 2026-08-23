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

// Semua route operator butuh auth + role operator — cukup dipasang sekali di sini
router.use(authMiddleware, roleMiddleware(['operator']));

router.get('/madrasah', getMadrasah);
router.patch('/madrasah', updateMadrasah);
// Ref PRD §13 — status & data 9 indikator milik madrasah operator + daftar submission item
router.get('/indikator', getIndikatorStatus);
router.get('/submission-item', listSubmissionItems);
// Write endpoints — PRD §13 / US2 US3 US4 US7b
router.post('/indikator/:id/draft', draftIndikatorItems);
router.post('/indikator/:id/submit', submitIndikatorItems);
router.patch('/submission-item/:id', updateSubmissionItem);
router.post('/submission-item/:id/request-delete', requestDeleteSubmissionItem);

export default router;

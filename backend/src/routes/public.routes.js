import express from 'express';
import * as publicController from '../controllers/publicController.js';
const router = express.Router();
router.get('/leaderboard', publicController.leaderboard);
router.get('/madrasah/:slug', publicController.madrasahDetail);
router.get('/periode', publicController.listPeriodePublik);
router.get('/stats', publicController.statsPublik);
export default router;

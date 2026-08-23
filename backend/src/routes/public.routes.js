import express from 'express';
import * as publicController from '../controllers/publicController.js';
const router = express.Router();
router.get('/leaderboard', publicController.leaderboard);
router.get('/madrasah/:slug', publicController.madrasahDetail);
export default router;

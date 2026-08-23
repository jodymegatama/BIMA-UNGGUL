/**
 * Auth Routes — BIMA UNGGUL Phase 3
 * Route definitions untuk 5 endpoints + approve user
 * Reference: PRD Section 13 (API endpoints), Section 16 (File Structure)
 */

import express from 'express';
import * as authController from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Registrasi Operator baru
 * Public endpoint (no auth required)
 */
router.post('/register', authController.register);

/**
 * POST /api/auth/login
 * Login dengan NIP + password
 * Public endpoint (no auth required)
 */
router.post('/login', authController.login);

/**
 * POST /api/auth/refresh
 * Refresh access token menggunakan refresh token dari cookie
 * Protected: requires valid refresh token in cookie (checked in controller)
 */
router.post('/refresh', authController.refresh);

/**
 * POST /api/auth/logout
 * Logout & clear refresh token cookie
 * Protected: requires access token
 */
router.post('/logout', authMiddleware, authController.logout);

export default router;

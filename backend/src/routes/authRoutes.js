import express from 'express';

const router = express.Router();

/**
 * POST /auth/login
 * Login dengan NIP + password
 * Body: { nip, password }
 * Response: { accessToken, refreshToken, user }
 */
router.post('/login', (req, res) => {
  res.status(200).json({ message: 'Login endpoint — placeholder' });
});

/**
 * POST /auth/refresh
 * Refresh access token menggunakan refresh token
 * Body: { refreshToken }
 * Response: { accessToken }
 */
router.post('/refresh', (req, res) => {
  res.status(200).json({ message: 'Refresh endpoint — placeholder' });
});

/**
 * POST /auth/logout
 * Logout user
 * Response: { message }
 */
router.post('/logout', (req, res) => {
  res.status(200).json({ message: 'Logout endpoint — placeholder' });
});

export default router;

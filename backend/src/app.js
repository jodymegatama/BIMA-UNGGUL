import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import operatorRoutes from './routes/operator.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import adminRoutes from './routes/admin.routes.js';
import publicRoutes from './routes/public.routes.js';

const app = express();

// 1. Security Headers (Helmet)
app.use(helmet());

// 2. Rate Limiting (Brute-force protection for /api/auth/login)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // maks 5 percobaan GAGAL per window per IP
  skipSuccessfulRequests: true, // login sukses tidak dihitung — hanya gagal
  message: { error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. Middleware
app.use(cors({
  origin: env.frontendUrl,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// 4. Routes — loginLimiter WAJIB sebelum authRoutes (middleware dieksekusi berurutan)
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', publicRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

export default app;

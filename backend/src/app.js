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

// 0. Trust proxy — WAJIB di produksi. Backend tidak pernah expose port ke luar
//    (compose cuma `expose`, akses publik lewat nginx), jadi hop pertama selalu
//    nginx milik sendiri dan aman dipercaya. Tanpa ini express-rate-limit
//    menolak X-Forwarded-For dengan ERR_ERL_UNEXPECTED_X_FORWARDED_FOR, dan
//    rate limit login dihitung dari IP proxy, bukan IP asli user sebenarnya.
app.set('trust proxy', 1);

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

// 3. Middleware — CORS: allow localhost + LAN 192.168.x.x untuk dev (bima LAN)
// prod tetap via env.frontendUrl (domain)
const allowedOrigins = [env.frontendUrl, 'http://localhost:5173', 'http://192.168.1.90:5173'].filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl/postman
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (/^http:\/\/192\.168\.\d+\.\d+:5173$/.test(origin)) return cb(null, true);
    if (/^http:\/\/localhost:\d+$/.test(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
}));
app.use(express.json());
// Jaring pengaman body: express.json() hanya mengisi req.body kalau Content-Type
// application/json. Klien yang kirim text/plain (curl tanpa -H, form, bot) membuat
// req.body tetap `undefined`, lalu handler yang men-destructure req.body melempar
// TypeError "Cannot destructure property ... of 'req.body' as it is undefined"
// yang jatuh ke error handler sebagai 500. Efeknya: setiap req.body pasti object.
app.use((req, _res, next) => {
  if (req.body === undefined) req.body = {};
  next();
});
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

// Error Prisma yang sebenarnya kondisi client / state, bukan bug server.
// Tanpa peta ini, pelanggaran unique / foreign key / not-found naik jadi 500.
// SyntaxError dari body-parser sudah membawa status sendiri, jadi hanya kode
// Prisma yang perlu dipetakan di sini.
const PRISMA_ERROR_HTTP = {
  P2002: { status: 409, code: 'DUPLICATE_DATA', error: 'Data sudah ada (nilai unik terpakai)' },
  P2003: { status: 400, code: 'INVALID_REFERENCE', error: 'Relasi data tidak valid' },
  P2025: { status: 404, code: 'NOT_FOUND', error: 'Data tidak ditemukan' },
};

// Error handler.
// Diekspor (namanya) supaya bisa diuji langsung — test tidak lagi bergantung pada
// route yang kebetulan melempar error untuk dijadikan "kendaraan" assertions.
export function errorHandler(err, req, res, _next) {
  const mapped = PRISMA_ERROR_HTTP[err?.code];
  if (mapped) {
    return res.status(mapped.status).json({ error: mapped.error, code: mapped.code });
  }

  // HttpError (dan SyntaxError body-parser) sudah membawa status 4xx + pesan
  // yang aman ditampilkan — teruskan apa adanya.
  if (err?.status >= 400 && err.status < 500) {
    return res.status(err.status).json({
      error: err.message || 'Permintaan tidak valid',
      ...(err.code ? { code: err.code } : {}),
    });
  }

  // Sisanya benar-benar bug server: log lengkap, balas generik. err.message
  // untuk 500 bisa berisi isi query Prisma/ENV dan tidak boleh bocor ke klien.
  console.error('[error]', err);
  res.status(500).json({ error: 'Terjadi kesalahan pada server', code: 'INTERNAL_ERROR' });
}

// Wajib SETELAH semua route & handler 404 — Express hanya mencari error handler
// yang terdaftar sesudah titik di mana error itu muncul.
app.use(errorHandler);

export default app;

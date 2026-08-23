/**
 * Config — load & validasi environment variables sekali di entry point.
 * WAJIB di-import paling awal (sebelum modul lain yang membaca process.env
 * pada level atas, mis. constants/auth.constants.js).
 */

import dotenv from 'dotenv';

dotenv.config();

const REQUIRED = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const isProduction = process.env.NODE_ENV === 'production';

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length > 0) {
  const msg = `[Config] Variabel environment wajib belum diset: ${missing.join(', ')}`;
  if (isProduction) {
    throw new Error(msg);
  }
  console.warn(`[Config] ${msg} — mode dev: lanjut dengan nilai fallback.`);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  port: parseInt(process.env.PORT, 10) || 3000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

export default env;

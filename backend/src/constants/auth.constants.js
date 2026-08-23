/**
 * Auth Constants — BIMA UNGGUL Phase 3
 * JWT secrets, expiry times, dan configuration
 * Reference: PRD Section 3 (Technical constraints) & Section 13 (API Integration)
 */

export const AUTH_CONFIG = {
  // JWT Secrets — WAJIB set di .env production!
  // CATATAN: nama variabel di .env adalah JWT_REFRESH_SECRET (bukan REFRESH_SECRET);
  // keduanya didukung agar kompatibel dengan deployment lama.
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-key-min-32-chars-change-in-prod',
  REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET ||
    process.env.REFRESH_SECRET ||
    'your-refresh-secret-key-min-32-chars-change-in-prod',

  // JWT Expiry times (dapat dioverride via .env: JWT_EXPIRY / JWT_REFRESH_EXPIRY)
  ACCESS_TOKEN_EXPIRY: process.env.JWT_EXPIRY || '15m',        // 15 minutes
  REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d', // 7 days

  // Cookie settings (PRD compliance)
  COOKIE_OPTIONS: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production', // only HTTPS in production
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  },

  // Password requirements (PRD Section 3 constraint)
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/, // min 8 chars, has letter & number
  PASSWORD_ERROR_MESSAGE: 'Password minimal 8 karakter (kombinasi huruf & angka)',

  // Bcrypt rounds
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),

  // User roles (dari Prisma schema)
  ROLES: {
    OPERATOR: 'operator',
    ADMIN: 'admin',
  },

  // User status (dari Prisma schema StatusUser enum)
  USER_STATUS: {
    MENUNGGU: 'menunggu',      // waiting for approval
    AKTIF: 'aktif',            // active
    NONAKTIF: 'nonaktif',      // inactive
  },

  // BMU Number generation
  BMU_PREFIX: 'BMU-',
  BMU_DIGITS: 6,               // BMU-000001 format
  BMU_PAD_CHAR: '0',
};

export default AUTH_CONFIG;

/**
 * Auth Service — BIMA UNGGUL Phase 3
 * Business logic untuk registration, login, token generation, BMU generation
 * Reference: PRD Section 5 (US1-4), Section 13 (API), Context7 bcryptjs & jsonwebtoken docs
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';
import { AUTH_CONFIG } from '../constants/auth.constants.js';

/**
 * Hash password menggunakan bcryptjs (async)
 * Reference: Context7 bcryptjs async hashing docs
 * 
 * @param {string} password — plaintext password
 * @returns {Promise<string>} — hashed password
 */
export async function hashPassword(password) {
  try {
    const hash = await bcrypt.hash(password, AUTH_CONFIG.BCRYPT_ROUNDS);
    return hash;
  } catch (err) {
    throw new Error(`Password hashing failed: ${err.message}`, { cause: err });
  }
}

/**
 * Compare plaintext password dengan hash
 * Reference: Context7 bcryptjs async comparison docs
 * 
 * @param {string} password — plaintext password
 * @param {string} hash — stored password hash
 * @returns {Promise<boolean>} — true jika match, false sebaliknya
 */
export async function comparePassword(password, hash) {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (err) {
    throw new Error(`Password comparison failed: ${err.message}`, { cause: err });
  }
}

/**
 * Generate JWT access token (short-lived, 15 minutes)
 * Reference: Context7 jsonwebtoken sign docs, PRD constraint
 * 
 * @param {object} payload — token payload { userId, role, madrasahId }
 * @returns {string} — JWT access token
 */
export function generateAccessToken(payload) {
  try {
    const token = jwt.sign(payload, AUTH_CONFIG.JWT_SECRET, {
      expiresIn: AUTH_CONFIG.ACCESS_TOKEN_EXPIRY,
      algorithm: 'HS256',
    });
    return token;
  } catch (err) {
    throw new Error(`Access token generation failed: ${err.message}`, { cause: err });
  }
}

/**
 * Generate JWT refresh token (long-lived, 7 days)
 * Reference: Context7 jsonwebtoken sign docs, PRD constraint
 * 
 * @param {object} payload — token payload { userId }
 * @returns {string} — JWT refresh token
 */
export function generateRefreshToken(payload) {
  try {
    const token = jwt.sign(payload, AUTH_CONFIG.REFRESH_SECRET, {
      expiresIn: AUTH_CONFIG.REFRESH_TOKEN_EXPIRY,
      algorithm: 'HS256',
    });
    return token;
  } catch (err) {
    throw new Error(`Refresh token generation failed: ${err.message}`, { cause: err });
  }
}

/**
 * Verify refresh token
 * Reference: Context7 jsonwebtoken verify docs
 * 
 * @param {string} token — refresh token to verify
 * @returns {object} — decoded payload atau throw error
 */
export function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, AUTH_CONFIG.REFRESH_SECRET);
    return decoded;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Refresh token sudah kadaluarsa', { cause: err });
    }
    throw new Error('Refresh token tidak valid', { cause: err });
  }
}

/**
 * Generate BMU number berurutan
 * Format: BMU-000001, BMU-000002, dst
 * Reference: PRD Section 5 (US1 AC: BMU-XXXXXX berurutan & permanen)
 * 
 * @returns {Promise<string>} — generated BMU number
 */
export async function generateBMUNumber() {
  try {
    const prefix = AUTH_CONFIG.BMU_PREFIX;

    // Cari baris terakhir by orderBy desc (index scan O(1)) — parse 1 baris saja.
    // Kegagalan row terakhir non-digit (mis. BMU-TEST-001) → fallback scan terbatas.
    const last = await prisma.madrasah.findFirst({
      where: { nomorMadrasah: { startsWith: prefix } },
      orderBy: { nomorMadrasah: 'desc' },
      select: { nomorMadrasah: true },
    });

    let maxNumber = 0;
    if (last) {
      const digits = String(last.nomorMadrasah).substring(prefix.length).match(/^\d+$/);
      if (digits) maxNumber = parseInt(digits[0], 10);
    }
    if (maxNumber === 0) {
      // fallback: nomor terakhir bukan digit murni — scan terbatas 500 baris terakhir
      const tail = await prisma.madrasah.findMany({
        where: { nomorMadrasah: { startsWith: prefix } },
        orderBy: { nomorMadrasah: 'desc' },
        take: 500,
        select: { nomorMadrasah: true },
      });
      for (const m of tail) {
        const d = String(m.nomorMadrasah).substring(prefix.length).match(/^\d+$/);
        if (!d) continue;
        const num = parseInt(d[0], 10);
        if (Number.isFinite(num) && num > maxNumber) maxNumber = num;
      }
    }

    const nextNumber = maxNumber + 1;
    const paddedNumber = String(nextNumber).padStart(AUTH_CONFIG.BMU_DIGITS, AUTH_CONFIG.BMU_PAD_CHAR);
    return `${prefix}${paddedNumber}`;
  } catch (err) {
    throw new Error(`BMU number generation failed: ${err.message}`, { cause: err });
  }
}

/**
 * Generate slug dari nama madrasah
 * Format: "MI Negeri Bangil" → "mi-negeri-bangil"
 * 
 * @param {string} nama — nama madrasah
 * @returns {string} — slug
 */
export function generateSlug(nama) {
  return nama
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
}

/**
 * Derive kelompok dari jenjang + statusKepemilikan
 * Reference: PRD Section 8 (Madrasah model) & Section 5 (AC: kelompok derived)
 * 
 * @param {string} jenjang — "MI" | "MTs" | "MA"
 * @param {string} statusKepemilikan — "Negeri" | "Swasta"
 * @returns {string} — kelompok
 */
export function deriveKelompok(jenjang, statusKepemilikan) {
  return `${jenjang} ${statusKepemilikan}`;
}

/**
 * Validate password strength
 * Reference: PRD Section 3 (Password constraint: 8 char, kombinasi huruf & angka)
 * 
 * @param {string} password
 * @returns {object} — { valid: boolean, error?: string }
 */
export function validatePassword(password) {
  if (!password || password.length < AUTH_CONFIG.PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      error: `Password minimal ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} karakter`,
    };
  }

  if (!AUTH_CONFIG.PASSWORD_REGEX.test(password)) {
    return {
      valid: false,
      error: AUTH_CONFIG.PASSWORD_ERROR_MESSAGE,
    };
  }

  return { valid: true };
}

/**
 * Validate NIP format & uniqueness
 * Reference: PRD Section 5 (US1 AC: NIP unik, 8-18 digit)
 * 
 * @param {string} nip
 * @returns {Promise<object>} — { valid: boolean, error?: string }
 */
export async function validateNIP(nip) {
  if (!nip || nip.length < 8 || nip.length > 18) {
    return {
      valid: false,
      error: 'NIP harus 8-18 karakter',
    };
  }

  if (!/^\d+$/.test(nip)) {
    return {
      valid: false,
      error: 'NIP hanya boleh berisi angka',
    };
  }

  // Check duplikat di database
  const existingUser = await prisma.user.findUnique({
    where: { nip },
  });

  if (existingUser) {
    return {
      valid: false,
      error: 'NIP sudah terdaftar',
    };
  }

  return { valid: true };
}

/**
 * Create user baru dengan status "menunggu"
 * Simpan madrasah data temporer di user metadata JSON
 * Reference: PRD Section 5 (US1: register dengan data madrasah)
 * 
 * @param {object} userData — { nip, name, email, password, madrasahData: { nama, jenjang, statusKepemilikan, alamat, jumlahSiswa } }
 * @returns {Promise<object>} — created user (tanpa password)
 */
export async function createPendingUser(userData) {
  try {
    const passwordHash = await hashPassword(userData.password);

    // Store madrasah data as JSON metadata di user record
    const user = await prisma.user.create({
      data: {
        nip: userData.nip,
        name: userData.name,
        email: userData.email,
        password: passwordHash,
        telepon: userData.telepon || null,
        role: 'operator',
        status: 'menunggu', // Waiting for admin approval
        madrasahData: userData.madrasahData, // JSON field — temporary storage
      },
      select: {
        id: true,
        nip: true,
        name: true,
        email: true,
        telepon: true,
        role: true,
        status: true,
        madrasahData: true,
        createdAt: true,
      },
    });

    return user;
  } catch (err) {
    throw new Error(`User creation failed: ${err.message}`, { cause: err });
  }
}

/**
 * Approve user & create Madrasah record dengan BMU auto-generated
 * Reference: PRD Section 5 (US1 AC: Admin approve → BMU generated + madrasah created)
 * 
 * @param {number} userId — user ID to approve
 * @param {object} madrasahData — { nama, jenjang, statusKepemilikan, alamat, jumlahSiswa }
 * @returns {Promise<object>} — approved user + created madrasah
 */
export async function approveUserAndCreateMadrasah(userId, madrasahData) {
  try {
    const bmuNumber = await generateBMUNumber();
    const slug = generateSlug(madrasahData.nama);
    const kelompok = deriveKelompok(madrasahData.jenjang, madrasahData.statusKepemilikan);

    // Prisma transaction: update user + create madrasah atomic
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update user status to aktif
      const approvedUser = await tx.user.update({
        where: { id: userId },
        data: {
          status: 'aktif',
        },
      });

      // 2. Create madrasah record
      const madrasah = await tx.madrasah.create({
        data: {
          nomorMadrasah: bmuNumber,
          namaMadrasah: madrasahData.nama,
          jenjang: madrasahData.jenjang,
          statusKepemilikan: madrasahData.statusKepemilikan,
          jumlahSiswa: madrasahData.jumlahSiswa,
          alamat: madrasahData.alamat,
          slug,
          kelompok,
        },
      });

      // 3. Update user dengan madrasahId
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          madrasahId: madrasah.id,
        },
        select: {
          id: true,
          nip: true,
          name: true,
          email: true,
          role: true,
          status: true,
          madrasahId: true,
          createdAt: true,
        },
      });

      return { user: updatedUser, madrasah };
    });

    return result;
  } catch (err) {
    throw new Error(`User approval failed: ${err.message}`, { cause: err });
  }
}

/**
 * Find active user untuk login
 * Reference: PRD Section 5 (US3: hanya status "aktif" boleh login)
 * 
 * @param {string} nip
 * @returns {Promise<object|null>} — user jika ada & aktif
 */
export async function findActiveUser(nip) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        nip,
        status: 'aktif', // Only active users can login
      },
    });
    return user || null;
  } catch (err) {
    throw new Error(`User lookup failed: ${err.message}`, { cause: err });
  }
}

export default {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateBMUNumber,
  generateSlug,
  deriveKelompok,
  validatePassword,
  validateNIP,
  createPendingUser,
  approveUserAndCreateMadrasah,
  findActiveUser,
};

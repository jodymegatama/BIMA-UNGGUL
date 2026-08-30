/**
 * Auth Controller — BIMA UNGGUL Phase 3
 * Handler untuk 5 endpoints: register, login, refresh, logout, approve user
 * Reference: PRD Section 13 (API endpoints), Express 5.x automatic error handling
 */

import * as authService from '../services/authService.js';
import { prisma } from '../db/prisma.js';
import { AUTH_CONFIG } from '../constants/auth.constants.js';

/**
 * POST /api/auth/register
 * Registrasi Operator baru dengan data madrasah temporer
 * 
 * Request body:
 * {
 *   nip: "12345678",
 *   name: "Kepala Sekolah",
 *   email: "kepala@school.com",
 *   password: "SecurePass123",
 *   madrasahData: {
 *     nama: "MI Negeri Bangil",
 *     jenjang: "MI",
 *     statusKepemilikan: "Negeri",
 *     alamat: "Jl. Sudirman No. 1",
 *     jumlahSiswa: 450
 *   }
 * }
 * 
 * Response: { status: "menunggu_persetujuan" }
 * Reference: PRD Section 5 (US1, AC: NIP unik, field validation)
 */
export async function register(req, res) {
  const { nip, name, email, password, madrasahData, telepon } = req.body;

  // 1. Validate input
  if (!nip || !name || !email || !password || !madrasahData) {
    return res.status(400).json({
      error: 'Field wajib tidak lengkap',
      code: 'MISSING_FIELDS',
      required: ['nip', 'name', 'email', 'password', 'madrasahData'],
    });
  }

  // 2. Validate NIP format & uniqueness
  const nipValidation = await authService.validateNIP(nip);
  if (!nipValidation.valid) {
    return res.status(400).json({
      error: nipValidation.error,
      code: 'INVALID_NIP',
    });
  }

  // 3. Validate password strength
  const passwordValidation = authService.validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({
      error: passwordValidation.error,
      code: 'WEAK_PASSWORD',
    });
  }

  // 4. Validate madrasah data
  const { nama, jenjang, statusKepemilikan, alamat, jumlahSiswa } = madrasahData;
  if (!nama || !jenjang || !statusKepemilikan || !alamat || !jumlahSiswa) {
    return res.status(400).json({
      error: 'Data madrasah tidak lengkap',
      code: 'INVALID_MADRASAH_DATA',
      required: ['nama', 'jenjang', 'statusKepemilikan', 'alamat', 'jumlahSiswa'],
    });
  }

  if (!['MI', 'MTs', 'MA'].includes(jenjang)) {
    return res.status(400).json({
      error: 'Jenjang harus MI, MTs, atau MA',
      code: 'INVALID_JENJANG',
    });
  }

  if (!['Negeri', 'Swasta'].includes(statusKepemilikan)) {
    return res.status(400).json({
      error: 'Status kepemilikan harus Negeri atau Swasta',
      code: 'INVALID_STATUS_KEPEMILIKAN',
    });
  }

  if (typeof jumlahSiswa !== 'number' || jumlahSiswa <= 0) {
    return res.status(400).json({
      error: 'Jumlah siswa harus angka positif',
      code: 'INVALID_JUMLAH_SISWA',
    });
  }

  if (nama.length < 3 || nama.length > 120) {
    return res.status(400).json({
      error: 'Nama madrasah 3-120 karakter',
      code: 'INVALID_NAMA_LENGTH',
    });
  }

  if (alamat.length < 5 || alamat.length > 500) {
    return res.status(400).json({
      error: 'Alamat 5-500 karakter',
      code: 'INVALID_ALAMAT_LENGTH',
    });
  }

  // 4b. Validate telepon (No. Telepon/WhatsApp — wajib, 10-15 digit)
  const teleponClean = String(telepon || '').replace(/[\s-]/g, '');
  if (!teleponClean) {
    return res.status(400).json({
      error: 'No. Telepon/WhatsApp wajib diisi',
      code: 'MISSING_TELEPON',
    });
  }
  if (!/^[0-9+]{10,15}$/.test(teleponClean)) {
    return res.status(400).json({
      error: 'Format telepon 10-15 digit',
      code: 'INVALID_TELEPON',
    });
  }

  // 5. Create user dengan status "menunggu" & madrasahData disimpan di database
  const user = await authService.createPendingUser({
    nip,
    name,
    email,
    password,
    telepon: teleponClean,
    madrasahData,
  });

  // 6. Create audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'register',
      entity: 'User',
      entityId: String(user.id),
      ipAddress: req.ip,
    },
  });

  res.status(201).json({
    status: 'menunggu_persetujuan',
    message: 'Pendaftaran berhasil. Menunggu persetujuan admin.',
    user: {
      id: user.id,
      nip: user.nip,
      name: user.name,
    },
  });
}

/**
 * POST /api/auth/login
 * Login NIP + password → access token + refresh token (httpOnly cookie)
 * 
 * Request body: { nip: "12345678", password: "SecurePass123" }
 * Response: { accessToken: "...", user: { id, nip, name, role, madrasahId } }
 * Cookie: refreshToken (httpOnly, secure, sameSite: strict)
 * 
 * Reference: PRD Section 5 (US3: only status "aktif" can login), Section 3 (JWT constraint)
 */
export async function login(req, res) {
  const { nip, password } = req.body;

  // 1. Validate input
  if (!nip || !password) {
    return res.status(400).json({
      error: 'NIP dan password wajib',
      code: 'MISSING_CREDENTIALS',
    });
  }

  // 2. Find active user
  const user = await authService.findActiveUser(nip);
  if (!user) {
    return res.status(401).json({
      error: 'NIP atau password salah',
      code: 'INVALID_CREDENTIALS',
    });
  }

  // 3. Compare password
  const isPasswordValid = await authService.comparePassword(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      error: 'NIP atau password salah',
      code: 'INVALID_CREDENTIALS',
    });
  }

  // 4. Generate tokens
  const accessToken = authService.generateAccessToken({
    userId: user.id,
    role: user.role,
    madrasahId: user.madrasahId,
  });

  const refreshToken = authService.generateRefreshToken({
    userId: user.id,
  });

  // 5. Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, AUTH_CONFIG.COOKIE_OPTIONS);

  // 6. Create audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'login',
      entity: 'User',
      entityId: String(user.id),
      ipAddress: req.ip,
    },
  });

  // 7. Return access token + user info
  res.status(200).json({
    accessToken,
    user: {
      id: user.id,
      nip: user.nip,
      name: user.name,
      email: user.email,
      telepon: user.telepon || null,
      role: user.role,
      madrasahId: user.madrasahId,
    },
  });
}

/**
 * POST /api/auth/refresh
 * Perbarui access token menggunakan refresh token dari cookie
 * 
 * Response: { accessToken: "..." }
 * Reference: PRD Section 13 (API endpoint), Section 3 (JWT constraint)
 */
export async function refresh(req, res) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      error: 'Refresh token tidak ditemukan',
      code: 'MISSING_REFRESH_TOKEN',
    });
  }

  // 1. Verify refresh token
  const decoded = authService.verifyRefreshToken(refreshToken);

  // 2. Find user to get latest role/madrasahId
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user || user.status !== 'aktif') {
    return res.status(401).json({
      error: 'User tidak aktif atau tidak ditemukan',
      code: 'INVALID_USER',
    });
  }

  // 3. Generate new access token
  const newAccessToken = authService.generateAccessToken({
    userId: user.id,
    role: user.role,
    madrasahId: user.madrasahId,
  });

  res.status(200).json({
    accessToken: newAccessToken,
  });
}

/**
 * POST /api/auth/logout
 * Logout & clear refresh token cookie
 * 
 * Response: { success: true }
 * Reference: PRD Section 13 (API endpoint)
 */
export async function logout(req, res) {
  // 1. Clear refresh token cookie
  res.clearCookie('refreshToken');

  // 2. Create audit log
  if (req.user) {
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'logout',
        entity: 'User',
        entityId: String(req.user.userId),
        ipAddress: req.ip,
      },
    });
  }

  res.status(200).json({
    success: true,
    message: 'Logout berhasil',
  });
}

/**
 * POST /api/admin/akun/:id/approve
 * Admin approve user & create Madrasah dengan BMU auto-generated
 * 
 * Note: madrasahData diambil dari user.madrasahData (JSON field yang di-set saat registrasi)
 * Response: { user: {...}, madrasah: {...} }
 * 
 * Protected: adminOnly
 * Reference: PRD Section 5 (US1 AC: Admin approve → BMU generated), Section 13 (API endpoint)
 */
export async function approveUser(req, res) {
  const userId = parseInt(req.params.id, 10);

  // 1. Find user (status harus "menunggu") dengan madrasahData
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nip: true,
      name: true,
      email: true,
      role: true,
      status: true,
      madrasahData: true, // Include madrasah data untuk approval
      madrasahId: true,
    },
  });

  if (!user) {
    return res.status(404).json({
      error: 'User tidak ditemukan',
      code: 'USER_NOT_FOUND',
    });
  }

  if (user.status !== 'menunggu') {
    return res.status(400).json({
      error: `User bukan dalam status menunggu (current: ${user.status})`,
      code: 'INVALID_USER_STATUS',
    });
  }

  if (user.role !== 'operator') {
    return res.status(400).json({
      error: 'Hanya operator yang bisa di-approve',
      code: 'INVALID_USER_ROLE',
    });
  }

  // 2. Check madrasahData ada
  if (!user.madrasahData) {
    return res.status(400).json({
      error: 'Data madrasah tidak ditemukan untuk user ini',
      code: 'MISSING_MADRASAH_DATA',
    });
  }

  // 3. Extract madrasahData dari database
  const madrasahData = user.madrasahData;

  // 4. Approve user & create madrasah
  const result = await authService.approveUserAndCreateMadrasah(userId, madrasahData);

  // 5. Create notification for operator
  await prisma.notification.create({
    data: {
      userId,
      tipe: 'account_approved',
      pesan: 'Akun Anda telah disetujui. Silakan login untuk mulai menginput capaian.',
      statusBaca: 'belum_dibaca',
    },
  });

  // 6. Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.userId,
      action: 'approve_account',
      entity: 'User',
      entityId: String(userId),
      dataSesudah: result.madrasah,
      ipAddress: req.ip,
    },
  });

  res.status(200).json({
    message: 'User berhasil disetujui',
    user: result.user,
    madrasah: result.madrasah,
  });
}

export default {
  register,
  login,
  refresh,
  logout,
  approveUser,
};

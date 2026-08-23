/**
 * Auth Middleware — BIMA UNGGUL Phase 3
 * Verify JWT access token dari header Authorization: Bearer <token>
 * Reference: PRD Section 3 (Auth system) & Context7 jsonwebtoken docs
 * Express 5.x: automatic error handling, no need for try-catch wrapper
 */

import jwt from 'jsonwebtoken';
import { AUTH_CONFIG } from '../constants/auth.constants.js';

/**
 * authMiddleware — Extract & verify JWT access token
 * Express 5.x automatically catches promise rejections
 * 
 * Flow:
 * 1. Extract token dari "Authorization: Bearer <token>"
 * 2. Verify token dengan JWT_SECRET
 * 3. Attach req.user = { userId, role, madrasahId }
 * 4. Call next() atau Express handles error
 */
export const authMiddleware = (req, res, next) => {
  const token = extractTokenFromHeader(req);

  if (!token) {
    return res.status(401).json({
      error: 'Token tidak ditemukan',
      code: 'MISSING_TOKEN',
    });
  }

  try {
    const decoded = jwt.verify(token, AUTH_CONFIG.JWT_SECRET);
    
    // Attach user info ke request object
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      madrasahId: decoded.madrasahId || null,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token sudah kadaluarsa',
        code: 'TOKEN_EXPIRED',
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token tidak valid',
        code: 'INVALID_TOKEN',
      });
    }

    // Fallback untuk error tidak terduga
    return res.status(401).json({
      error: 'Gagal verifikasi token',
      code: 'VERIFICATION_FAILED',
    });
  }
};

/**
 * Extract JWT token dari Authorization header
 * Format: "Bearer <token>"
 */
function extractTokenFromHeader(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}

export default authMiddleware;

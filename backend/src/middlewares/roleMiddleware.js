/**
 * Role Middleware — BIMA UNGGUL Phase 3
 * Check user role dan authorize access ke endpoint tertentu
 * Reference: PRD Section 3 (Auth system) & Section 16 (File Structure)
 */

/**
 * roleMiddleware — Factory function untuk check multiple roles
 * 
 * Usage:
 *   router.get('/admin-only', roleMiddleware(['admin']), adminController.getData)
 *   router.get('/operator-or-admin', roleMiddleware(['operator', 'admin']), controller.getData)
 * 
 * @param {string[]} allowedRoles — Array of allowed roles (e.g., ['admin'], ['operator', 'admin'])
 * @returns {Function} Express middleware
 */
export const roleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    // authMiddleware harus dipanggil terlebih dahulu
    if (!req.user) {
      return res.status(401).json({
        error: 'Tidak terautentikasi',
        code: 'NOT_AUTHENTICATED',
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Anda tidak memiliki akses ke resource ini',
        code: 'FORBIDDEN',
        requiredRoles: allowedRoles,
        userRole,
      });
    }

    next();
  };
};

/**
 * Convenience wrappers untuk role tertentu
 */
export const adminOnly = roleMiddleware(['admin']);
export const operatorOnly = roleMiddleware(['operator']);
export const operatorOrAdmin = roleMiddleware(['operator', 'admin']);

export default roleMiddleware;

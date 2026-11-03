/**
 * Admin Routes — BIMA UNGGUL Phase 3
 * Semua route di sini: authMiddleware + roleMiddleware(['admin'])
 */
import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';
import * as validationController from '../controllers/admin/validationController.js';
import * as deleteRequestController from '../controllers/admin/deleteRequestController.js';
import * as authController from '../controllers/authController.js';
import * as periodController from '../controllers/admin/periodController.js';
import * as bobotController from '../controllers/admin/bobotController.js';
import * as madrasahController from '../controllers/admin/madrasahController.js';
import * as accountController from '../controllers/admin/accountController.js';
import * as exportController from '../controllers/admin/exportController.js';
import * as auditLogController from '../controllers/admin/auditLogController.js';

const router = express.Router();

// Semua endpoint admin butuh admin role
router.use(authMiddleware, roleMiddleware(['admin']));

// Validasi queue
router.get('/validasi', validationController.getQueue);
router.post('/validasi/:id/approve', validationController.approve);
router.post('/validasi/:id/reject', validationController.reject);
router.post('/validasi/:id/revoke', validationController.revoke);

// Delete requests
router.get('/delete-requests', deleteRequestController.getQueue);
router.post('/delete-requests/:id/approve', deleteRequestController.approve);
router.post('/delete-requests/:id/reject', deleteRequestController.reject);

// Akun approve (dipindah dari auth.routes.js agar prefix konsisten)
router.post('/akun/:id/approve', authController.approveUser);

// Akun CRUD
router.get('/akun', accountController.list);
router.post('/akun', accountController.create);
router.patch('/akun/:id', accountController.update);
router.delete('/akun/:id', accountController.remove);

// Madrasah CRUD (soft/hard delete) — dropdown AkunForm pakai list ini (default aktif saja)
router.get('/madrasah', madrasahController.list);
router.post('/madrasah', madrasahController.create);
router.patch('/madrasah/:id', madrasahController.update);
router.patch('/madrasah/:id/soft-delete', madrasahController.softRemove);
router.patch('/madrasah/:id/activate', madrasahController.activate);
router.delete('/madrasah/:id', madrasahController.remove);

// Periode
router.get('/periode', periodController.list);
router.post('/periode', periodController.create);
router.patch('/periode/:id', periodController.update);
router.delete('/periode/:id', periodController.remove);
router.post('/periode/:id/finalisasi', periodController.finalize);
router.post('/periode/:id/reopen', periodController.reopen);

// Bobot
router.get('/bobot', bobotController.list);
router.patch('/bobot', bobotController.update);

// Export
router.get('/export/pdf', exportController.pdf);
router.get('/export/excel', exportController.excel);

// Audit log
router.get('/audit-log', auditLogController.list);

export default router;

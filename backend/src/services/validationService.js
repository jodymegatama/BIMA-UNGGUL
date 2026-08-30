/**
 * Validation Service — BIMA UNGGUL Phase 3
 * 7 endpoint Admin: validasi queue + approve/reject/revoke + delete-requests
 * Reference: PRD US5/US6/US7/US7b, Section 13 API
 * Prisma 5.18 interactive transaction: prisma.$transaction(async (tx) => { ... })
 * Semua write approve/reject/revoke + recalculate + auditLog atomic.
 */

import { prisma } from '../db/prisma.js';
import { TX_OPTS } from '../config/transaction.js';
import { HttpError } from '../utils/httpError.js';
import { recordAuditLog } from './auditService.js';
import { createNotification } from './notificationService.js';

// ---------- Helpers ----------
function parsePagination(query) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = 20;
  if (limit > 100) limit = 100;
  return { page, limit, skip: (page - 1) * limit };
}

function requireAlasan(alasan, field = 'alasan') {
  if (!alasan || String(alasan).trim().length === 0) {
    throw new HttpError(400, 'MISSING_ALASAN', `${field} wajib diisi`);
  }
  return String(alasan).trim();
}

// ---------- GET /api/admin/validasi ----------
export async function getValidasiQueue(query = {}) {
  const { status, madrasahId, indikatorId, periodeId, q, kelompok } = query;
  const { page, limit, skip } = parsePagination(query);

  const where = { deletedAt: null };
  if (status) where.status = status;
  if (madrasahId) where.madrasahId = parseInt(madrasahId, 10);
  if (indikatorId) where.indikatorId = parseInt(indikatorId, 10);
  if (periodeId) where.periodeId = parseInt(periodeId, 10);
  if (kelompok) {
    where.madrasah = { kelompok };
  }
  if (q && String(q).trim().length > 0) {
    const keyword = String(q).trim();
    where.OR = [
      { namaKegiatan: { contains: keyword } },
      { namaPeserta: { contains: keyword } },
      { institusi: { contains: keyword } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.submissionItem.findMany({
      where,
      include: {
        madrasah: { select: { id: true, nomorMadrasah: true, namaMadrasah: true, kelompok: true, slug: true } },
        indikator: { select: { id: true, kode: true, slug: true, nama: true, tipeFormula: true } },
        createdBy: { select: { id: true, nip: true, name: true } },
        periode: { select: { id: true, namaPeriode: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.submissionItem.count({ where }),
  ]);

  return { data, total, page, limit };
}

// ---------- POST /api/admin/validasi/:id/approve ----------
export async function approveSubmission({ id, adminId, ip }) {
  const itemId = parseInt(id, 10);
  if (!Number.isFinite(itemId)) throw new HttpError(400, 'INVALID_ID', 'ID tidak valid');

  return prisma.$transaction(async (tx) => {
    const item = await tx.submissionItem.findUnique({ where: { id: itemId } });
    if (!item) throw new HttpError(404, 'ITEM_NOT_FOUND', 'Submission tidak ditemukan');
    if (item.deletedAt) throw new HttpError(400, 'ALREADY_DELETED', 'Submission sudah dihapus');
    if (item.status !== 'menunggu') throw new HttpError(400, 'INVALID_STATUS', `Hanya status menunggu yang bisa di-approve (saat ini: ${item.status})`);

    const dataSebelum = { status: item.status };

    const updated = await tx.submissionItem.update({
      where: { id: itemId },
      data: { status: 'disetujui', alasanPenolakan: null },
    });

    await tx.validation.create({
      data: { submissionItemId: itemId, validatorId: adminId, aksi: 'approve' },
    });


    // Notifikasi operator pemilik capaian (PRD §12 — submission_approved) — atomic dalam tx
    await createNotification(
      item.createdById,
      'submission_approved',
      `Capaian "${item.namaKegiatan || 'tanpa judul'}" disetujui Admin dan masuk perhitungan skor.`,
      tx,
    );

    await recordAuditLog(
      {
        userId: adminId,
        action: 'approve_submission',
        entity: 'SubmissionItem',
        entityId: itemId,
        dataSebelum,
        dataSesudah: { status: 'disetujui' },
        ipAddress: ip,
      },
      tx,
    );

    return updated;
  }, TX_OPTS);
}

// ---------- POST /api/admin/validasi/:id/reject ----------
export async function rejectSubmission({ id, adminId, alasan, ip }) {
  const itemId = parseInt(id, 10);
  if (!Number.isFinite(itemId)) throw new HttpError(400, 'INVALID_ID', 'ID tidak valid');
  const cleanAlasan = requireAlasan(alasan, 'alasan');

  return prisma.$transaction(async (tx) => {
    const item = await tx.submissionItem.findUnique({ where: { id: itemId } });
    if (!item) throw new HttpError(404, 'ITEM_NOT_FOUND', 'Submission tidak ditemukan');
    if (item.deletedAt) throw new HttpError(400, 'ALREADY_DELETED', 'Submission sudah dihapus');
    if (item.status !== 'menunggu') throw new HttpError(400, 'INVALID_STATUS', `Hanya status menunggu yang bisa di-reject (saat ini: ${item.status})`);

    const dataSebelum = { status: item.status };

    const updated = await tx.submissionItem.update({
      where: { id: itemId },
      data: { status: 'ditolak', alasanPenolakan: cleanAlasan },
    });

    await tx.validation.create({
      data: { submissionItemId: itemId, validatorId: adminId, aksi: 'reject', alasan: cleanAlasan },
    });

    // reject dari menunggu tidak mengubah skor (hanya disetujui yang dihitung), jadi tidak recalculate

    // Notifikasi operator (PRD §12 — submission_rejected) — atomic dalam tx
    await createNotification(
      item.createdById,
      'submission_rejected',
      `Capaian "${item.namaKegiatan || 'tanpa judul'}" ditolak Admin. Alasan: ${cleanAlasan}`,
      tx,
    );

    await recordAuditLog(
      {
        userId: adminId,
        action: 'reject_submission',
        entity: 'SubmissionItem',
        entityId: itemId,
        dataSebelum,
        dataSesudah: { status: 'ditolak', alasanPenolakan: cleanAlasan },
        alasan: cleanAlasan,
        ipAddress: ip,
      },
      tx,
    );

    return updated;
  }, TX_OPTS);
}

// ---------- POST /api/admin/validasi/:id/revoke ----------
// Keputusan resmi: disetujui -> ditolak + alasanPenolakan = alasan revoke (agar Operator bisa edit-resubmit via US4)
export async function revokeSubmission({ id, adminId, alasan, ip }) {
  const itemId = parseInt(id, 10);
  if (!Number.isFinite(itemId)) throw new HttpError(400, 'INVALID_ID', 'ID tidak valid');
  const cleanAlasan = requireAlasan(alasan, 'alasan');

  return prisma.$transaction(async (tx) => {
    const item = await tx.submissionItem.findUnique({ where: { id: itemId } });
    if (!item) throw new HttpError(404, 'ITEM_NOT_FOUND', 'Submission tidak ditemukan');
    if (item.deletedAt) throw new HttpError(400, 'ALREADY_DELETED', 'Submission sudah dihapus');
    if (item.status !== 'disetujui') throw new HttpError(400, 'INVALID_STATUS', `Hanya status disetujui yang bisa di-revoke (saat ini: ${item.status})`);

    const dataSebelum = { status: item.status };

    const updated = await tx.submissionItem.update({
      where: { id: itemId },
      data: { status: 'ditolak', alasanPenolakan: cleanAlasan },
    });

    await tx.validation.create({
      data: { submissionItemId: itemId, validatorId: adminId, aksi: 'revoke', alasan: cleanAlasan },
    });


    // Notifikasi operator (PRD §12 — submission_revoked) — atomic dalam tx
    await createNotification(
      item.createdById,
      'submission_revoked',
      `Capaian "${item.namaKegiatan || 'tanpa judul'}" dicabut Admin. Alasan: ${cleanAlasan}`,
      tx,
    );

    await recordAuditLog(
      {
        userId: adminId,
        action: 'revoke_submission',
        entity: 'SubmissionItem',
        entityId: itemId,
        dataSebelum,
        dataSesudah: { status: 'ditolak', alasanPenolakan: cleanAlasan },
        alasan: cleanAlasan,
        ipAddress: ip,
      },
      tx,
    );

    return updated;
  }, TX_OPTS);
}

// ---------- GET /api/admin/delete-requests ----------
export async function getDeleteRequestsQueue(query = {}) {
  const { status, madrasahId, periodeId, q, page: qPage, limit: qLimit } = query;
  const { page, limit, skip } = parsePagination({ page: qPage, limit: qLimit });

  const where = {};
  if (status) where.status = status;
  if (q && String(q).trim().length > 0) {
    const keyword = String(q).trim();
    where.OR = [{ alasan: { contains: keyword } }, { alasanAdmin: { contains: keyword } }];
  }
  // Filter via relation submissionItem
  if (madrasahId || periodeId) {
    where.submissionItem = {};
    if (madrasahId) where.submissionItem.madrasahId = parseInt(madrasahId, 10);
    if (periodeId) where.submissionItem.periodeId = parseInt(periodeId, 10);
  }

  const [data, total] = await Promise.all([
    prisma.deleteRequest.findMany({
      where,
      include: {
        submissionItem: {
          include: {
            madrasah: { select: { id: true, nomorMadrasah: true, namaMadrasah: true, kelompok: true } },
            indikator: { select: { id: true, kode: true, slug: true, nama: true } },
            periode: { select: { id: true, namaPeriode: true } },
          },
        },
        requestedBy: { select: { id: true, nip: true, name: true } },
        reviewedBy: { select: { id: true, nip: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.deleteRequest.count({ where }),
  ]);

  return { data, total, page, limit };
}

// ---------- POST /api/admin/delete-requests/:id/approve ----------
export async function approveDeleteRequest({ id, adminId, ip }) {
  const reqId = parseInt(id, 10);
  if (!Number.isFinite(reqId)) throw new HttpError(400, 'INVALID_ID', 'ID tidak valid');

  return prisma.$transaction(async (tx) => {
    const req = await tx.deleteRequest.findUnique({
      where: { id: reqId },
      include: { submissionItem: true },
    });
    if (!req) throw new HttpError(404, 'REQUEST_NOT_FOUND', 'Permintaan hapus tidak ditemukan');
    if (req.status !== 'menunggu') throw new HttpError(400, 'INVALID_STATUS', `Hanya status menunggu yang bisa di-approve (saat ini: ${req.status})`);
    if (!req.submissionItem) throw new HttpError(404, 'ITEM_NOT_FOUND', 'Submission terkait tidak ditemukan');
    if (req.submissionItem.deletedAt) throw new HttpError(400, 'ALREADY_DELETED', 'Submission sudah dihapus sebelumnya');
    if (req.submissionItem.status !== 'disetujui') throw new HttpError(400, 'INVALID_ITEM_STATUS', 'Hanya submission berstatus disetujui yang bisa dihapus');

    const dataSebelum = { status: req.status, submissionItemDeletedAt: req.submissionItem.deletedAt };

    await tx.submissionItem.update({
      where: { id: req.submissionItemId },
      data: { deletedAt: new Date() },
    });

    const updatedReq = await tx.deleteRequest.update({
      where: { id: reqId },
      data: { status: 'disetujui', reviewedById: adminId, reviewedAt: new Date() },
    });


    // Notifikasi operator pengaju (delete_request_approved) — atomic dalam tx
    await createNotification(
      req.requestedById,
      'delete_request_approved',
      `Permintaan hapus capaian "${req.submissionItem.namaKegiatan || 'tanpa judul'}" disetujui — data dihapus dari perhitungan skor.`,
      tx,
    );

    await recordAuditLog(
      {
        userId: adminId,
        action: 'approve_delete_request',
        entity: 'DeleteRequest',
        entityId: reqId,
        dataSebelum,
        dataSesudah: { status: 'disetujui', submissionItemDeletedAt: 'now()' },
        ipAddress: ip,
      },
      tx,
    );

    return updatedReq;
  }, TX_OPTS);
}

// ---------- POST /api/admin/delete-requests/:id/reject ----------
export async function rejectDeleteRequest({ id, adminId, alasan, ip }) {
  const reqId = parseInt(id, 10);
  if (!Number.isFinite(reqId)) throw new HttpError(400, 'INVALID_ID', 'ID tidak valid');
  const cleanAlasan = requireAlasan(alasan, 'alasan');

  return prisma.$transaction(async (tx) => {
    const req = await tx.deleteRequest.findUnique({
      where: { id: reqId },
      include: { submissionItem: { select: { namaKegiatan: true } } },
    });
    if (!req) throw new HttpError(404, 'REQUEST_NOT_FOUND', 'Permintaan hapus tidak ditemukan');
    if (req.status !== 'menunggu') throw new HttpError(400, 'INVALID_STATUS', `Hanya status menunggu yang bisa di-reject (saat ini: ${req.status})`);

    const dataSebelum = { status: req.status };

    const updatedReq = await tx.deleteRequest.update({
      where: { id: reqId },
      data: { status: 'ditolak', alasanAdmin: cleanAlasan, reviewedById: adminId, reviewedAt: new Date() },
    });

    // Data tetap ada, skor tidak berubah — tanpa recalculate

    // Notifikasi operator pengaju (delete_request_rejected) — atomic dalam tx
    await createNotification(
      req.requestedById,
      'delete_request_rejected',
      `Permintaan hapus ditolak Admin.${req.submissionItem ? ` Capaian "${req.submissionItem.namaKegiatan || 'tanpa judul'}" tetap tersimpan.` : ''} Alasan: ${cleanAlasan}`,
      tx,
    );

    await recordAuditLog(
      {
        userId: adminId,
        action: 'reject_delete_request',
        entity: 'DeleteRequest',
        entityId: reqId,
        dataSebelum,
        dataSesudah: { status: 'ditolak', alasanAdmin: cleanAlasan },
        alasan: cleanAlasan,
        ipAddress: ip,
      },
      tx,
    );

    return updatedReq;
  }, TX_OPTS);
}

export default {
  getValidasiQueue,
  getDeleteRequestsQueue,
  approveSubmission,
  rejectSubmission,
  revokeSubmission,
  approveDeleteRequest,
  rejectDeleteRequest,
};

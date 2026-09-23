/**
 * Audit Service — BIMA UNGGUL Phase 3
 * Helper reusable untuk mencatat AuditLog secara konsisten di semua endpoint.
 * Reference: PRD Section 12 (AuditLog model), Section 17 US7b AC (aksi tercatat di audit log)
 *
 * Dipakai baik standalone maupun DI DALAM prisma.$transaction()
 * lewat param `client` — supaya audit log atomic bersama perubahan datanya.
 */

import { prisma } from '../db/prisma.js';

/**
 * Catat satu baris AuditLog.
 * @param {object} entry
 * @param {number} entry.userId - ID user pelaku aksi
 * @param {string} entry.action - contoh: "approve_submission", "revoke_submission"
 * @param {string} entry.entity - contoh: "SubmissionItem", "DeleteRequest"
 * @param {number|string} entry.entityId
 * @param {object} [entry.dataSebelum] - snapshot sebelum aksi
 * @param {object} [entry.dataSesudah] - snapshot sesudah aksi
 * @param {string} [entry.alasan] - alasan untuk reject/revoke/reopen
 * @param {string} entry.ipAddress
 * @param {object} client - Prisma client / transaction client (default: global)
 * @returns {Promise<object>} - created AuditLog
 */
export async function recordAuditLog(entry, client = prisma) {
  const {
    userId,
    action,
    entity,
    entityId,
    dataSebelum = undefined,
    dataSesudah = undefined,
    alasan = null,
    ipAddress = 'unknown',
  } = entry;

  return client.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId: String(entityId),
      dataSebelum,
      dataSesudah,
      alasan,
      ipAddress,
    },
  });
}

export default recordAuditLog;

/**
 * List AuditLog dengan filter + paginasi (untuk halaman Admin → Audit Log).
 * @param {object} [opts]
 * @param {number} [opts.userId]
 * @param {string} [opts.action]
 * @param {string} [opts.entity]
 * @param {Date}   [opts.from]
 * @param {Date}   [opts.to]
 * @param {number} [opts.page=1]
 * @param {number} [opts.limit=20]
 */
export async function listAuditLogs({
  userId,
  action,
  entity,
  from,
  to,
  page = 1,
  limit = 20,
} = {}) {
  const where = {};
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (entity) where.entity = entity;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, nip: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { data, total, page, limit };
}

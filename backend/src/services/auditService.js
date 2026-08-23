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

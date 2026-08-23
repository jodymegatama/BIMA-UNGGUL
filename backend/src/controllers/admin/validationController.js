/**
 * Validation Controller — Admin validasi queue + approve/reject/revoke
 * Thin HTTP layer, logic ada di validationService (atomic).
 */
import * as validationService from '../../services/validationService.js';

export async function getQueue(req, res) {
  const result = await validationService.getValidasiQueue(req.query);
  res.json(result);
}

export async function approve(req, res) {
  const result = await validationService.approveSubmission({
    id: req.params.id,
    adminId: req.user.userId,
    ip: req.ip || req.socket?.remoteAddress || 'unknown',
  });
  res.json({ data: result });
}

export async function reject(req, res) {
  const result = await validationService.rejectSubmission({
    id: req.params.id,
    adminId: req.user.userId,
    alasan: req.body?.alasan,
    ip: req.ip || req.socket?.remoteAddress || 'unknown',
  });
  res.json({ data: result });
}

export async function revoke(req, res) {
  const result = await validationService.revokeSubmission({
    id: req.params.id,
    adminId: req.user.userId,
    alasan: req.body?.alasan,
    ip: req.ip || req.socket?.remoteAddress || 'unknown',
  });
  res.json({ data: result });
}

export default { getQueue, approve, reject, revoke };

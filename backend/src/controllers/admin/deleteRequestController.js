/**
 * DeleteRequest Controller — Admin permintaan hapus
 */
import * as validationService from '../../services/validationService.js';

export async function getQueue(req, res) {
  const result = await validationService.getDeleteRequestsQueue(req.query);
  res.json(result);
}

export async function approve(req, res) {
  const result = await validationService.approveDeleteRequest({
    id: req.params.id,
    adminId: req.user.userId,
    ip: req.ip || req.socket?.remoteAddress || 'unknown',
  });
  res.json({ data: result });
}

export async function reject(req, res) {
  const result = await validationService.rejectDeleteRequest({
    id: req.params.id,
    adminId: req.user.userId,
    alasan: req.body?.alasan,
    ip: req.ip || req.socket?.remoteAddress || 'unknown',
  });
  res.json({ data: result });
}

export default { getQueue, approve, reject };

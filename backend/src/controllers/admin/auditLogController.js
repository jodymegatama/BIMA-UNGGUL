import { listAuditLogs } from '../../services/auditService.js';

export async function list(req, res) {
  try {
    let { userId, action, entity, from, to, page = '1', limit = '20' } = req.query;
    let p = parseInt(page, 10);
    let l = parseInt(limit, 10);
    if (!Number.isFinite(p) || p < 1) p = 1;
    if (!Number.isFinite(l) || l < 1) l = 20;
    if (l > 100) l = 100;

    const result = await listAuditLogs({
      userId: userId ? parseInt(userId, 10) : undefined,
      action: action ? String(action) : undefined,
      entity: entity ? String(entity) : undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: p,
      limit: l,
    });
    res.json(result);
  } catch (err) {
    console.error('[GET /admin/audit-log]', err);
    res.status(err.status || 500).json({ error: err.message || 'Gagal mengambil audit log' });
  }
}

export default { list };

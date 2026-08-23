import { PrismaClient } from '@prisma/client';
import { resolveAktifPeriode } from '../services/periodService.js';
import * as submissionService from '../services/submissionService.js';

const prisma = new PrismaClient();

/**
 * GET /api/operator/madrasah
 * Profil madrasah milik operator yang sedang login (read-only).
 * Dipakai halaman Profil Madrasah & sidebar Operator.
 */
export const getMadrasah = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.madrasahId) return res.status(400).json({ error: 'Operator belum terikat ke madrasah', code: 'NO_MADRASAH_BOUND' });

    const madrasah = await prisma.madrasah.findUnique({
      where: { id: user.madrasahId },
      select: {
        id: true, namaMadrasah: true, nomorMadrasah: true, jenjang: true,
        statusKepemilikan: true, kelompok: true, jumlahSiswa: true,
        alamat: true, slug: true, createdAt: true, updatedAt: true,
      },
    });
    if (!madrasah) return res.status(404).json({ error: 'Madrasah tidak ditemukan', code: 'MADRASAH_NOT_FOUND' });

    return res.status(200).json(madrasah);
  } catch (err) {
    console.error('[getMadrasah]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PATCH /api/operator/madrasah
 * Update profil madrasah milik operator — hanya 3 field editable:
 * - namaMadrasah (3-120 char)
 * - alamat (5-500 char)
 * - jumlahSiswa (integer >0)
 * Lainnya (nomorMadrasah, jenjang, statusKepemilikan, slug, kelompok) = 400
 * Slug TIDAK regenerate saat nama berubah.
 */
export const updateMadrasah = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Ambil user untuk cek madrasahId (JWT mungkin hanya berisi id/role)
    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.madrasahId) return res.status(400).json({ error: 'Operator belum terikat ke madrasah' });

    const allowed = ['namaMadrasah', 'alamat', 'jumlahSiswa'];
    const bodyKeys = Object.keys(req.body || {});
    const invalid = bodyKeys.filter((k) => !allowed.includes(k));
    if (invalid.length) {
      return res.status(400).json({ error: `Field tidak diizinkan: ${invalid.join(', ')}`, allowed });
    }
    if (bodyKeys.length === 0) {
      return res.status(400).json({ error: 'Tidak ada field untuk diupdate' });
    }

    const data = {};
    const errors = {};

    if ('namaMadrasah' in req.body) {
      const v = String(req.body.namaMadrasah || '').trim();
      if (v.length < 3 || v.length > 120) errors.namaMadrasah = 'Nama madrasah 3-120 karakter';
      else data.namaMadrasah = v;
    }
    if ('alamat' in req.body) {
      const v = String(req.body.alamat || '').trim();
      if (v.length < 5 || v.length > 500) errors.alamat = 'Alamat 5-500 karakter';
      else data.alamat = v;
    }
    if ('jumlahSiswa' in req.body) {
      const v = Number(req.body.jumlahSiswa);
      if (!Number.isInteger(v) || v <= 0) errors.jumlahSiswa = 'Jumlah siswa harus integer >0';
      else if (v > 10000) errors.jumlahSiswa = 'Jumlah siswa terlalu besar (max 10000)';
      else data.jumlahSiswa = v;
    }

    if (Object.keys(errors).length) {
      return res.status(400).json({ error: 'Validasi gagal', details: errors });
    }

    const updated = await prisma.madrasah.update({
      where: { id: user.madrasahId },
      data,
    });

    // Audit log minimal (console) — nanti bisa masuk ke AuditLog table
    console.log(`[Audit] Operator ${userId} update madrasah ${updated.id}:`, data);

    return res.status(200).json(updated);
  } catch (err) {
    console.error('[updateMadrasah]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/operator/indikator
 * 9 indikator master + status pengisian milik madrasah operator untuk periode efektif.
 * Ref PRD §13: GET /api/operator/indikator → IndikatorStatus[]
 * Response: { periode, indikators: [{id,kode,slug,nama,tipeFormula,status{draft,menunggu,disetujui,ditolak},total}], stats }
 */
export const getIndikatorStatus = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.madrasahId) return res.status(400).json({ error: 'Operator belum terikat ke madrasah', code: 'NO_MADRASAH_BOUND' });

    const periode = await resolveAktifPeriode();
    const periodeId = periode?.id ?? null;

    const [indikators, groups] = await Promise.all([
      prisma.indikator.findMany({ orderBy: { kode: 'asc' } }),
      periodeId
        ? prisma.submissionItem.groupBy({
            by: ['indikatorId', 'status'],
            where: { madrasahId: user.madrasahId, periodeId, deletedAt: null },
            _count: { id: true },
          })
        : Promise.resolve([]),
    ]);

    const statByInd = {};
    for (const g of groups) {
      if (!statByInd[g.indikatorId]) statByInd[g.indikatorId] = { draft: 0, menunggu: 0, disetujui: 0, ditolak: 0 };
      if (statByInd[g.indikatorId][g.status] !== undefined) statByInd[g.indikatorId][g.status] += g._count.id;
    }

    const stats = { draft: 0, menunggu: 0, disetujui: 0, ditolak: 0 };
    const data = indikators.map((ind) => {
      const s = statByInd[ind.id] || { draft: 0, menunggu: 0, disetujui: 0, ditolak: 0 };
      stats.draft += s.draft;
      stats.menunggu += s.menunggu;
      stats.disetujui += s.disetujui;
      stats.ditolak += s.ditolak;
      return {
        id: ind.id,
        kode: ind.kode,
        slug: ind.slug,
        nama: ind.nama,
        tipeFormula: ind.tipeFormula,
        status: s,
        total: s.draft + s.menunggu + s.disetujui + s.ditolak,
      };
    });
    stats.total = stats.draft + stats.menunggu + stats.disetujui + stats.ditolak;

    return res.status(200).json({
      periode: periode
        ? { id: periode.id, namaPeriode: periode.namaPeriode, status: periode.status, tanggalCutoff: periode.tanggalCutoff }
        : null,
      indikators: data,
      stats,
    });
  } catch (err) {
    console.error('[getIndikatorStatus]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const VALID_ITEM_STATUS = ['draft', 'menunggu', 'disetujui', 'ditolak'];

/**
 * GET /api/operator/submission-item?status=
 * Daftar submission item milik madrasah operator (periode efektif; tanpa filter jika tidak ada).
 * Dipakai Riwayat Submission, Dashboard (fallback), dan Hapus Data (?status=disetujui).
 */
export const listSubmissionItems = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.madrasahId) return res.status(400).json({ error: 'Operator belum terikat ke madrasah', code: 'NO_MADRASAH_BOUND' });

    const { status } = req.query;
    const where = { madrasahId: user.madrasahId, deletedAt: null };
    if (status && VALID_ITEM_STATUS.includes(String(status))) where.status = String(status);

    const periode = await resolveAktifPeriode();
    if (periode) where.periodeId = periode.id;

    const items = await prisma.submissionItem.findMany({
      where,
      include: {
        indikator: { select: { id: true, kode: true, slug: true, nama: true } },
        periode: { select: { id: true, namaPeriode: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    return res.status(200).json({
      data: items,
      total: items.length,
      periode: periode ? { id: periode.id, namaPeriode: periode.namaPeriode, status: periode.status } : null,
    });
  } catch (err) {
    console.error('[listSubmissionItems]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ==================== Write endpoints (US2/US3/US4/US7b) ====================

function requireOperatorContext(req) {
  const userId = req.user?.userId;
  if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  return userId;
}

async function getMadrasahIdFor(userId) {
  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!user) {
    const e = new Error('User not found');
    e.status = 404;
    throw e;
  }
  if (!user.madrasahId) {
    const e = new Error('Operator belum terikat ke madrasah');
    e.status = 400;
    e.code = 'NO_MADRASAH_BOUND';
    throw e;
  }
  return { madrasahId: user.madrasahId, userId };
}

/**
 * POST /api/operator/indikator/:id/draft
 * Body: { items: [ {field dinamis...} ] } — PRD US2. Draft boleh parsial (validasi tipe saja).
 */
export async function draftIndikatorItems(req, res) {
  try {
    const userId = requireOperatorContext(req);
    const { madrasahId } = await getMadrasahIdFor(userId);
    const result = await submissionService.saveItems({
      indikatorId: req.params.id,
      items: req.body?.items,
      targetStatus: 'draft',
      userId,
      madrasahId,
      ip: req.ip,
    });
    return res.status(201).json(result);
  } catch (err) {
    if (err?.status) return res.status(err.status).json({ error: err.message, code: err.code || undefined, fields: err.fields });
    console.error('[draftIndikatorItems]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/operator/indikator/:id/submit
 * Body: { items: [ {id?, field dinamis...} ] } — PRD US3 → status menunggu, validasi penuh.
 */
export async function submitIndikatorItems(req, res) {
  try {
    const userId = requireOperatorContext(req);
    const { madrasahId } = await getMadrasahIdFor(userId);
    const result = await submissionService.saveItems({
      indikatorId: req.params.id,
      items: req.body?.items,
      targetStatus: 'menunggu',
      userId,
      madrasahId,
      ip: req.ip,
    });
    return res.status(201).json(result);
  } catch (err) {
    if (err?.status) return res.status(err.status).json({ error: err.message, code: err.code || undefined, fields: err.fields });
    console.error('[submitIndikatorItems]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /api/operator/submission-item/:id
 * Edit baris milik operator (draft/ditolak) → kirim ulang jadi menunggu (PRD US4).
 */
export async function updateSubmissionItem(req, res) {
  try {
    const userId = requireOperatorContext(req);
    const { madrasahId } = await getMadrasahIdFor(userId);
    const updated = await submissionService.updateOwnItem({
      id: req.params.id,
      body: req.body,
      userId,
      madrasahId,
      ip: req.ip,
    });
    return res.status(200).json(updated);
  } catch (err) {
    if (err?.status) return res.status(err.status).json({ error: err.message, code: err.code || undefined, fields: err.fields });
    console.error('[updateSubmissionItem]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/operator/submission-item/:id/request-delete
 * Ajukan hapus data Disetujui dengan alasan wajib (PRD US7b) → DeleteRequest menunggu.
 */
export async function requestDeleteSubmissionItem(req, res) {
  try {
    const userId = requireOperatorContext(req);
    const { madrasahId } = await getMadrasahIdFor(userId);
    const created = await submissionService.requestDeleteItem({
      id: req.params.id,
      alasan: req.body?.alasan,
      userId,
      madrasahId,
      ip: req.ip,
    });
    return res.status(201).json(created);
  } catch (err) {
    if (err?.status) return res.status(err.status).json({ error: err.message, code: err.code || undefined });
    console.error('[requestDeleteSubmissionItem]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default { getMadrasah, updateMadrasah, getIndikatorStatus, listSubmissionItems };
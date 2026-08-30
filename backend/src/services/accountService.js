/**
 * Account Service — BIMA UNGGUL Phase 3 Final
 * GET/POST/PATCH /api/admin/akun (list, create, edit, activate/deactivate)
 * approve akun sudah ada di authService.approveUserAndCreateMadrasah — jangan duplikat
 */
import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';
import { recordAuditLog } from './auditService.js';
import { recalculateAfterAction } from './scoringService.js';
import bcrypt from 'bcryptjs';

const TX_OPTS = { timeout: 15000, maxWait: 5000 };

export async function listAkun({ status, q, page='1', limit='20' }) {
  let p = parseInt(page,10); let l = parseInt(limit,10);
  if (!Number.isFinite(p)||p<1) p=1; if(!Number.isFinite(l)||l<1) l=20; if(l>100) l=100;
  const where = {};
  if (status) where.status = status;
  if (q && String(q).trim()) {
    const kw = String(q).trim();
    where.OR = [{ nip:{contains:kw}},{ name:{contains:kw}},{ email:{contains:kw}}];
  }
  const [data,total]=await Promise.all([
    prisma.user.findMany({ where, select:{ id:true,nip:true,name:true,email:true,role:true,status:true,madrasahId:true,createdAt:true, madrasah:{select:{id:true,nomorMadrasah:true,namaMadrasah:true}}}, orderBy:{createdAt:'desc'}, skip:(p-1)*l, take:l }),
    prisma.user.count({where}),
  ]);
  return { data, total, page:p, limit:l };
}

export async function createAkun({ nip,name,email,password,role='operator', madrasahId }, { userId, ip }) {
  if (!nip||!name||!email||!password) throw new HttpError(400,'MISSING_FIELDS','nip,name,email,password wajib');
  if (String(password).length < 8) throw new HttpError(400,'WEAK_PASSWORD','Password minimal 8 karakter');
  const exists = await prisma.user.findFirst({ where:{ OR:[{nip},{email}] } });
  if (exists) throw new HttpError(409,'DUPLICATE','NIP atau email sudah terdaftar');
  const hash = await bcrypt.hash(String(password), 10);
  const created = await prisma.user.create({ data:{ nip, name, email, password:hash, role, status:'aktif', madrasahId: madrasahId ? parseInt(madrasahId,10): null } , select:{id:true,nip:true,name:true,email:true,role:true,status:true,madrasahId:true,createdAt:true}});
  await recordAuditLog({ userId, action:'create_account', entity:'User', entityId:created.id, dataSesudah:created, ipAddress:ip});
  return created;
}

export async function updateAkun(id, patch, { userId, ip }) {
  const uid = parseInt(id,10); if(!Number.isFinite(uid)) throw new HttpError(400,'INVALID_ID','ID tidak valid');
  const existing = await prisma.user.findUnique({where:{id:uid}});
  if(!existing) throw new HttpError(404,'NOT_FOUND','User tidak ditemukan');
  const data={};
  if (patch.name!==undefined) data.name = String(patch.name);
  if (patch.email!==undefined) data.email = String(patch.email);
  if (patch.role!==undefined) {
    if (!['operator','admin'].includes(patch.role)) throw new HttpError(400,'INVALID_ROLE','role harus operator/admin');
    data.role = patch.role;
  }
  if (patch.status!==undefined) {
    if (!['menunggu','aktif','nonaktif'].includes(patch.status)) throw new HttpError(400,'INVALID_STATUS','status tidak valid');
    data.status = patch.status;
  }
  if (patch.madrasahId!==undefined) data.madrasahId = patch.madrasahId ? parseInt(patch.madrasahId,10) : null;
  if (patch.password!==undefined && String(patch.password).trim()) {
    if (String(patch.password).length < 8) throw new HttpError(400,'WEAK_PASSWORD','Password minimal 8');
    data.password = await bcrypt.hash(String(patch.password),10);
  }
  const before = { status: existing.status, role: existing.role };
  const updated = await prisma.user.update({ where:{id:uid}, data, select:{id:true,nip:true,name:true,email:true,role:true,status:true,madrasahId:true,createdAt:true}});
  await recordAuditLog({ userId, action:'update_account', entity:'User', entityId:uid, dataSebelum:before, dataSesudah:{status:updated.status, role:updated.role}, ipAddress:ip});
  return updated;
}

export async function deleteAkun(id, { userId, ip }) {
  const uid = parseInt(id, 10);
  if (!Number.isFinite(uid)) throw new HttpError(400, 'INVALID_ID', 'ID tidak valid');
  if (uid === userId) throw new HttpError(400, 'SELF_DELETE', 'Tidak bisa menghapus akun sendiri');
  const existing = await prisma.user.findUnique({ where: { id: uid } });
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'User tidak ditemukan');

  // Keputusan user (2026-08-30): hard delete boleh — SEMUA data terkait ikut
  // terhapus, warning sudah tampil di modal. Counts dikembalikan utk toast.
  return prisma.$transaction(async (tx) => {
    const [sub, val, dlc, dlr, notif] = await Promise.all([
      tx.submissionItem.count({ where: { createdById: uid } }),
      tx.validation.count({ where: { validatorId: uid } }),
      tx.deleteRequest.count({ where: { requestedById: uid } }),
      tx.deleteRequest.count({ where: { reviewedById: uid } }),
      tx.notification.count({ where: { userId: uid } }),
    ]);

    // Madrasah & periode terdampak — untuk recalc skor setelah data hilang
    const affected = await tx.submissionItem.findMany({
      where: { createdById: uid },
      select: { madrasahId: true, periodeId: true },
      distinct: ['madrasahId', 'periodeId'],
    });

    // Hapus data dependen EKSPLISIT (Validation.validatorId TANPA onDelete -> wajib manual)
    await tx.validation.deleteMany({ where: { validatorId: uid } });
    await tx.deleteRequest.deleteMany({ where: { requestedById: uid } });
    await tx.notification.deleteMany({ where: { userId: uid } });
    // SubmissionItem & AuditLog & DeleteRequest.reviewedBy: onDelete Cascade/SetNull otomatis.
    await tx.submissionItem.deleteMany({ where: { createdById: uid } });
    await tx.auditLog.deleteMany({ where: { userId: uid } });

    await recordAuditLog({ userId, action: 'delete_account', entity: 'User', entityId: uid,
      dataSebelum: { nip: existing.nip, role: existing.role, status: existing.status }, dataSesudah: null, ipAddress: ip }, tx);

    const deleted = await tx.user.delete({ where: { id: uid }, select: { id: true, nip: true, role: true } });

    // Recalc skor madrasah yang kehilangan submission
    for (const a of affected) {
      await recalculateAfterAction(a.madrasahId, a.periodeId, tx);
    }

    return { ...deleted, deletedCounts: { submissions: sub, validations: val, deleteRequests: dlc + dlr, notifications: notif, madrasahAffected: affected.length } };
  }, TX_OPTS);
}

export async function listMadrasahDropdown() {
  return prisma.madrasah.findMany({
    select: { id: true, namaMadrasah: true, nomorMadrasah: true, jenjang: true },
    orderBy: { namaMadrasah: 'asc' },
  });
}

export default { listAkun, createAkun, updateAkun, deleteAkun, listMadrasahDropdown };

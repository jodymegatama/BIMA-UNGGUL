/**
 * Madrasah Service — BIMA UNGGUL Phase 3
 * CRUD madrasah untuk admin: list, create, update, soft delete (nonaktifkan),
 * hard delete (cascade submission & skor). Audit log di semua aksi.
 */
import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';
import { recordAuditLog } from './auditService.js';
import { generateBMUNumber, generateSlug, deriveKelompok } from './authService.js';

const TX_OPTS = { timeout: 20000, maxWait: 5000 };

const JENJANG = ['MI', 'MTs', 'MA'];
const KEPEMILIKAN = ['Negeri', 'Swasta'];

// Helper: slug unik — append -2, -3 jika bentrok
async function uniqueSlug(base, excludeId = null) {
  let slug = base;
  let n = 2;
  let exists = await prisma.madrasah.findFirst({ where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) } });
  while (exists) {
    slug = `${base}-${n}`;
    n += 1;
    exists = await prisma.madrasah.findFirst({ where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) } });
  }
  return slug;
}

export async function listMadrasah({ q, kelompok, status, page = '1', limit = '20', includeNonaktif = '0' } = {}) {
  let p = parseInt(page, 10); let l = parseInt(limit, 10);
  if (!Number.isFinite(p) || p < 1) p = 1;
  if (!Number.isFinite(l) || l < 1) l = 20;
  if (l > 1000) l = 1000; // limit 1000: dropdown AkunForm butuh semua madrasah (default 20 utk tabel) — clamp 100 memotong >100 madrasah

  const where = {};
  if (status === 'nonaktif') {
    where.deletedAt = { not: null };
  } else if (status === 'aktif') {
    where.deletedAt = null;
  } else if (includeNonaktif !== '1') {
    // default: hanya aktif (kompatibel dgn dropdown AkunForm)
    where.deletedAt = null;
  }
  if (kelompok) where.kelompok = kelompok;
  if (q && String(q).trim()) {
    const kw = String(q).trim();
    where.OR = [
      { namaMadrasah: { contains: kw } },
      { nomorMadrasah: { contains: kw } },
      { alamat: { contains: kw } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.madrasah.findMany({
      where,
      select: {
        id: true, nomorMadrasah: true, namaMadrasah: true, jenjang: true,
        statusKepemilikan: true, jumlahSiswa: true, alamat: true, slug: true,
        kelompok: true, deletedAt: true, createdAt: true,
        _count: { select: { submissions: true, users: true } },
      },
      orderBy: { nomorMadrasah: 'asc' },
      skip: (p - 1) * l,
      take: l,
    }),
    prisma.madrasah.count({ where }),
  ]);

  return { data, total, page: p, limit: l };
}

export async function createMadrasah({ namaMadrasah, jenjang, statusKepemilikan, jumlahSiswa, alamat }, { userId, ip }) {
  if (!namaMadrasah || !String(namaMadrasah).trim()) throw new HttpError(400, 'MISSING_NAME', 'Nama madrasah wajib');
  if (!JENJANG.includes(jenjang)) throw new HttpError(400, 'INVALID_JENJANG', 'Jenjang harus MI/MTs/MA');
  if (!KEPEMILIKAN.includes(statusKepemilikan)) throw new HttpError(400, 'INVALID_KEPEMILIKAN', 'Status kepemilikan harus Negeri/Swasta');
  const siswa = parseInt(jumlahSiswa, 10);
  if (!Number.isFinite(siswa) || siswa <= 0) throw new HttpError(400, 'INVALID_SISWA', 'Jumlah siswa harus angka > 0');

  const nomor = await generateBMUNumber();
  const slug = await uniqueSlug(generateSlug(namaMadrasah));
  const kelompok = deriveKelompok(jenjang, statusKepemilikan);

  try {
    const created = await prisma.madrasah.create({
      data: {
        nomorMadrasah: nomor, namaMadrasah: namaMadrasah.trim(), jenjang,
        statusKepemilikan, jumlahSiswa: siswa, alamat: alamat || '', slug, kelompok,
      },
      select: { id: true, nomorMadrasah: true, namaMadrasah: true, jenjang: true, statusKepemilikan: true, jumlahSiswa: true, slug: true, kelompok: true },
    });
    await recordAuditLog({ userId, action: 'create_madrasah', entity: 'Madrasah', entityId: created.id, dataSesudah: created, ipAddress: ip });
    return created;
  } catch (err) {
    if (err.code === 'P2002') throw new HttpError(409, 'DUPLICATE', 'Nomor madrasah atau slug bentrok — coba lagi');
    throw err;
  }
}

export async function updateMadrasah(id, patch, { userId, ip }) {
  const mid = parseInt(id, 10);
  if (!Number.isFinite(mid)) throw new HttpError(400, 'INVALID_ID', 'ID tidak valid');
  const existing = await prisma.madrasah.findUnique({ where: { id: mid } });
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Madrasah tidak ditemukan');

  // Immutable: nomorMadrasah, jenjang, statusKepemilikan (sesuai schema comment)
  if (patch.jenjang !== undefined && patch.jenjang !== existing.jenjang) throw new HttpError(400, 'IMMUTABLE_JENJANG', 'Jenjang tidak dapat diubah');
  if (patch.statusKepemilikan !== undefined && patch.statusKepemilikan !== existing.statusKepemilikan) throw new HttpError(400, 'IMMUTABLE_KEPEMILIKAN', 'Status kepemilikan tidak dapat diubah');
  if (patch.nomorMadrasah !== undefined && patch.nomorMadrasah !== existing.nomorMadrasah) throw new HttpError(400, 'IMMUTABLE_BMU', 'Nomor madrasah tidak dapat diubah');

  const data = {};
  if (patch.namaMadrasah !== undefined) {
    const nama = String(patch.namaMadrasah).trim();
    if (!nama) throw new HttpError(400, 'INVALID_NAME', 'Nama madrasah tidak boleh kosong');
    data.namaMadrasah = nama;
  }
  if (patch.jumlahSiswa !== undefined) {
    const siswa = parseInt(patch.jumlahSiswa, 10);
    if (!Number.isFinite(siswa) || siswa <= 0) throw new HttpError(400, 'INVALID_SISWA', 'Jumlah siswa harus angka > 0');
    data.jumlahSiswa = siswa;
  }
  if (patch.alamat !== undefined) data.alamat = String(patch.alamat);

  const before = { namaMadrasah: existing.namaMadrasah, jumlahSiswa: existing.jumlahSiswa };
  const updated = await prisma.madrasah.update({
    where: { id: mid }, data,
    select: { id: true, nomorMadrasah: true, namaMadrasah: true, jenjang: true, statusKepemilikan: true, jumlahSiswa: true, alamat: true, slug: true, kelompok: true },
  });
  await recordAuditLog({ userId, action: 'update_madrasah', entity: 'Madrasah', entityId: mid, dataSebelum: before, dataSesudah: { namaMadrasah: updated.namaMadrasah, jumlahSiswa: updated.jumlahSiswa }, ipAddress: ip });
  return updated;
}

export async function softDeleteMadrasah(id, { userId, ip, alasan }) {
  const mid = parseInt(id, 10);
  if (!Number.isFinite(mid)) throw new HttpError(400, 'INVALID_ID', 'ID tidak valid');
  const existing = await prisma.madrasah.findUnique({ where: { id: mid } });
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Madrasah tidak ditemukan');
  if (existing.deletedAt) throw new HttpError(400, 'ALREADY_INACTIVE', 'Madrasah sudah nonaktif');

  const updated = await prisma.madrasah.update({
    where: { id: mid }, data: { deletedAt: new Date() },
    select: { id: true, nomorMadrasah: true, namaMadrasah: true, deletedAt: true },
  });
  await recordAuditLog({ userId, action: 'soft_delete_madrasah', entity: 'Madrasah', entityId: mid, dataSebelum: { deletedAt: null }, dataSesudah: { deletedAt: updated.deletedAt }, alasan: alasan || null, ipAddress: ip });
  return updated;
}

export async function activateMadrasah(id, { userId, ip }) {
  const mid = parseInt(id, 10);
  if (!Number.isFinite(mid)) throw new HttpError(400, 'INVALID_ID', 'ID tidak valid');
  const existing = await prisma.madrasah.findUnique({ where: { id: mid } });
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Madrasah tidak ditemukan');
  if (!existing.deletedAt) throw new HttpError(400, 'ALREADY_ACTIVE', 'Madrasah sudah aktif');

  const updated = await prisma.madrasah.update({
    where: { id: mid }, data: { deletedAt: null },
    select: { id: true, nomorMadrasah: true, namaMadrasah: true, deletedAt: true },
  });
  await recordAuditLog({ userId, action: 'activate_madrasah', entity: 'Madrasah', entityId: mid, dataSebelum: { deletedAt: existing.deletedAt }, dataSesudah: { deletedAt: null }, ipAddress: ip });
  return updated;
}

export async function hardDeleteMadrasah(id, { userId, ip }) {
  const mid = parseInt(id, 10);
  if (!Number.isFinite(mid)) throw new HttpError(400, 'INVALID_ID', 'ID tidak valid');
  const existing = await prisma.madrasah.findUnique({ where: { id: mid } });
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Madrasah tidak ditemukan');

  return prisma.$transaction(async (tx) => {
    const sub = await tx.submissionItem.count({ where: { madrasahId: mid } });

    // Hapus data submission milik madrasah (User operator: putuskan relasi, bukan hapus akun)
    await tx.submissionItem.deleteMany({ where: { madrasahId: mid } });
    await tx.user.updateMany({ where: { madrasahId: mid }, data: { madrasahId: null } });

    await recordAuditLog({ userId, action: 'delete_madrasah', entity: 'Madrasah', entityId: mid,
      dataSebelum: { nomorMadrasah: existing.nomorMadrasah, namaMadrasah: existing.namaMadrasah },
      dataSesudah: null, ipAddress: ip }, tx);

    const deleted = await tx.madrasah.delete({ where: { id: mid }, select: { id: true, nomorMadrasah: true } });

    return { ...deleted, deletedCounts: { submissions: sub } };
  }, TX_OPTS);
}

export default { listMadrasah, createMadrasah, updateMadrasah, softDeleteMadrasah, activateMadrasah, hardDeleteMadrasah };

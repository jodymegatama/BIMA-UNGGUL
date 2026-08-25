/**
 * Verifikasi bug duplikasi: save draft DENGAN id → harus UPDATE (jumlah tidak bertambah).
 * Jalankan dari folder backend: node scripts/verify-no-duplicate.mjs
 */
import { PrismaClient } from '@prisma/client';
import authService from '../src/services/authService.js';

const prisma = new PrismaClient();
const BASE = 'http://localhost:3000';

async function main() {
  const user = await prisma.user.findFirst({ where: { role: 'operator', status: 'aktif' } });
  const indikator = await prisma.indikator.findUnique({ where: { slug: 'diklat' } });
  const token = authService.generateAccessToken({ userId: user.id, role: 'operator', madrasahId: user.madrasahId });
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const before = await prisma.submissionItem.count({ where: { madrasahId: user.madrasahId, status: 'draft', deletedAt: null } });

  // buat 1 draft
  const mk = await fetch(`${BASE}/api/operator/indikator/${indikator.id}/draft`, {
    method: 'POST', headers, body: JSON.stringify({ items: [{ namaKegiatan: 'NoDup Test', institusi: 'X', namaPeserta: 'Y', statusPegawai: 'asn', linkBukti: 'https://x.co/n' }] }),
  });
  const created = (await mk.json()).data[0];
  const afterCreate = await prisma.submissionItem.count({ where: { madrasahId: user.madrasahId, status: 'draft', deletedAt: null } });

  // simpan LAGI dengan id (skenario user edit draf lama) — payload tanpa id di sisi lama = duplikat
  const resave = await fetch(`${BASE}/api/operator/indikator/${indikator.id}/draft`, {
    method: 'POST', headers,
    body: JSON.stringify({ items: [{ id: created.id, namaKegiatan: 'NoDup Test EDITED', institusi: 'X', namaPeserta: 'Y', statusPegawai: 'asn', linkBukti: 'https://x.co/n2' }] }),
  });
  console.log('resave status:', resave.status);

  const after = await prisma.submissionItem.count({ where: { madrasahId: user.madrasahId, status: 'draft', deletedAt: null } });
  const edited = await prisma.submissionItem.findUnique({ where: { id: created.id } });
  console.log('count afterCreate/afterResave:', afterCreate, '→', after, after === afterCreate ? '(OK — update, bukan duplikat)' : '(FAIL — duplikat!)');
  console.log('nama ter-update:', edited.namaKegiatan === 'NoDup Test EDITED' ? 'OK' : 'FAIL');

  // cleanup
  await prisma.submissionItem.delete({ where: { id: created.id } });
  await prisma.auditLog.deleteMany({ where: { entity: 'SubmissionItem', entityId: String(created.id) } });
  console.log('cleanup OK');
}

main().finally(() => prisma.$disconnect());

/**
 * Smoke test Draft Lifecycle (HTTP end-to-end).
 * Token dibuat langsung via authService (tidak butuh password).
 * Jalankan dari folder backend: node scripts/smoke-draft-lifecycle.mjs
 */
import { PrismaClient } from '@prisma/client';
import authService from '../src/services/authService.js';

const prisma = new PrismaClient();
const BASE = 'http://localhost:3000';

async function main() {
  const user = await prisma.user.findFirst({ where: { role: 'operator', status: 'aktif' }, include: { madrasah: true } });
  if (!user?.madrasahId) return console.log('SKIP — tidak ada operator aktif dengan madrasah');
  const indikator = await prisma.indikator.findUnique({ where: { slug: 'diklat' } });

  const token = authService.generateAccessToken({ userId: user.id, role: 'operator', madrasahId: user.madrasahId });
  const auth = { Authorization: `Bearer ${token}` };

  // 1) buat 2 draft
  const mk = await fetch(`${BASE}/api/operator/indikator/${indikator.id}/draft`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [
      { namaKegiatan: 'Lifecycle A', institusi: 'BDK', namaPeserta: 'T1', statusPegawai: 'asn', linkBukti: 'https://x.co/a' },
      { namaKegiatan: 'Lifecycle B', institusi: 'BDK', namaPeserta: 'T2', statusPegawai: 'non_asn', linkBukti: 'https://x.co/b' },
    ] }),
  });
  const mkJ = await mk.json();
  console.log('CREATE', mk.status, '| total:', mkJ.total);
  if (!mk.ok) return;
  const ids = mkJ.data.map((d) => d.id);

  // 2) list draft
  const ls = await (await fetch(`${BASE}/api/operator/submission-item?status=draft`, { headers: auth })).json();
  const mine = (ls.data || ls).filter((x) => ids.includes(x.id));
  console.log('LIST draft uji:', mine.length === 2 ? 'OK' : `FAIL (${mine.length})`);

  // 3) DELETE satu
  const del = await fetch(`${BASE}/api/operator/submission-item/${ids[0]}`, { method: 'DELETE', headers: auth });
  const delBody = await del.text();
  console.log('DELETE', del.status, delBody.slice(0, 60));

  // 4) verifikasi hilang & satunya utuh
  const after = await (await fetch(`${BASE}/api/operator/submission-item?status=draft`, { headers: auth })).json();
  const afterIds = (after.data || after).map((x) => x.id);
  console.log('hilang:', !afterIds.includes(ids[0]) ? 'OK' : 'FAIL', '| sisa ada:', afterIds.includes(ids[1]) ? 'OK' : 'FAIL');

  // 5) DELETE non-draft → harus ditolak 400
  await prisma.submissionItem.update({ where: { id: ids[1] }, data: { status: 'menunggu' } });
  const del2 = await fetch(`${BASE}/api/operator/submission-item/${ids[1]}`, { method: 'DELETE', headers: auth });
  console.log('DELETE non-draft ditolak:', del2.status === 400 ? 'OK' : `FAIL (${del2.status})`);

  // cleanup
  await prisma.submissionItem.deleteMany({ where: { id: { in: ids } } });
  await prisma.auditLog.deleteMany({ where: { entity: 'SubmissionItem', entityId: { in: ids.map(String) } } });
  console.log('cleanup OK');
}

main().finally(() => prisma.$disconnect());

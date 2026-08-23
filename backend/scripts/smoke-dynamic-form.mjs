/**
 * Smoke test DynamicIndicatorForm backend — jalankan dari folder backend.
 * Bukan pengganti E2E penuh; memverifikasi: validasi per indikator, cutoff guard, persist draft/submit.
 */
import { PrismaClient } from '@prisma/client';
import submissionService from '../src/services/submissionService.js';

const prisma = new PrismaClient();

async function main() {
  // 1) Pure validation checks
  const cases = [
    ['diklat', { namaKegiatan: 'Diklat X', institusi: 'BDK Surabaya', namaPeserta: 'Jody', statusPegawai: 'asn', linkBukti: 'https://a.co/1' }, 'submit', 0],
    ['diklat', { namaKegiatan: 'Diklat X', linkBukti: 'https://a.co/1' }, 'submit', 3], // missing institusi, namaPeserta, statusPegawai
    ['diklat', { namaKegiatan: 'Diklat X', institusi: 'I', namaPeserta: 'P', statusPegawai: 'pns', linkBukti: 'https://a.co/1' }, 'submit', 1], // invalid enum
    ['lulus_jenjang_lanjutan', { jenjangPendidikan: 's2', jumlah: 2, linkBukti: 'https://a.co/2' }, 'submit', 0],
    ['rapor_rata_rata', { pembilang: 50, penyebut: 40, linkBukti: 'https://a.co/3' }, 'submit', 1], // pembilang > penyebut
    ['rasio_penerimaan', { pembilang: 112, penyebut: 90, linkBukti: 'https://a.co/4' }, 'submit', 1], // same rule
    ['giat_inovatif', { namaKegiatan: 'Literasi Digital', linkBukti: 'ftp://x' }, 'submit', 1], // url invalid
  ];
  let pass = 0;
  for (const [kode, payload, mode, expectErr] of cases) {
    const errs = submissionService.validateItem(kode, payload, mode);
    const ok = errs.length === expectErr;
    console.log(ok ? 'PASS' : 'FAIL', `${kode} (${mode}) errors=${errs.length} expected=${expectErr}`, ok ? '' : JSON.stringify(errs));
    if (ok) pass++;
  }
  console.log(`validation: ${pass}/${cases.length} passed`);

  // 2) DB-dependent flow
  const user = await prisma.user.findFirst({ where: { role: 'operator', status: 'aktif' }, include: { madrasah: true } });
  if (!user || !user.madrasahId) {
    console.log('SKIP DB flow — tidak ada operator aktif dengan madrasah');
    return;
  }
  const indikator = await prisma.indikator.findUnique({ where: { slug: 'diklat' } });
  console.log('operator:', user.nip, '| madrasah:', user.madrasah?.namaMadrasah, '| indikator:', indikator?.slug);

  try {
    const res = await submissionService.saveItems({
      indikatorId: indikator.id,
      items: [{ namaKegiatan: 'Smoke Draft Diklat', institusi: 'BDK Surabaya', namaPeserta: 'Tester', statusPegawai: 'asn', linkBukti: 'https://example.com/bukti', catatan: 'smoke test' }],
      targetStatus: 'draft',
      userId: user.id,
      madrasahId: user.madrasahId,
      ip: '127.0.0.1',
    });
    console.log('DRAFT OK:', res.total, 'baris, id=', res.data[0].id);

    const submitted = await submissionService.saveItems({
      indikatorId: indikator.id,
      items: [{ id: res.data[0].id, namaKegiatan: 'Smoke Submit Diklat', institusi: 'BDK Surabaya', namaPeserta: 'Tester', statusPegawai: 'non_asn', linkBukti: 'https://example.com/bukti2' }],
      targetStatus: 'menunggu',
      userId: user.id,
      madrasahId: user.madrasahId,
      ip: '127.0.0.1',
    });
    console.log('SUBMIT OK: status=', submitted.data[0].status);

    // cleanup data uji
    await prisma.submissionItem.delete({ where: { id: submitted.data[0].id } });
    await prisma.auditLog.deleteMany({ where: { entity: 'SubmissionItem', entityId: String(submitted.data[0].id) } });
    console.log('cleanup OK');
  } catch (e) {
    console.log('DB FLOW:', e.status || '', e.code || '', e.message);
  }
}

main().finally(() => prisma.$disconnect());

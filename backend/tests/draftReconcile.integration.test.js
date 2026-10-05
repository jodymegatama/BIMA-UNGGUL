/**
 * Rekonsiliasi draft nyangkut — integrasi.
 *
 * Masalah yang diuji: submissionService.updateOwnItem() menolak baris yang
 * periodenya bukan periode aktif (403 PERIOD_CLOSED). Begitu periode ditutup dan
 * periode baru dibuka, setiap draft lama jadi tidak bisa dilanjutkan sama sekali
 * dan tidak ada jalan keluar dari UI.
 *
 * Skenario di file ini:
 *   1. Draft di periode lama -> `Lanjutkan` benar-benar 403 (bukti masalah nyata)
 *   2. Rekonsiliasi memindahkannya ke periode aktif -> `Lanjutkan` berhasil lagi
 *   3. Draft dengan riwayat validasi TIDAK dipindah (mengubah skor itu bahaya)
 *   4. Draft yang sudah di periode aktif tidak disentuh, dan jalan dua kali idempotent
 *
 * Data fixture: prefix E2E-REC, dibersihkan sebelum & sesudah.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/db/prisma.js';
import * as submissionService from '../src/services/submissionService.js';
import { reconcileLegacyDrafts } from '../src/services/draftReconcile.js';
import { resolveAktifPeriode } from '../src/services/periodService.js';
import { dbGate } from './helpers/dbGate.js';

const NS = 'E2E-REC';
const ip = '127.0.0.1-e2e-rec';

async function cleanup() {
  const per = await prisma.periodePenilaian.findMany({ where: { namaPeriode: { startsWith: NS } }, select: { id: true } });
  const ids = per.map((p) => p.id);
  for (const id of ids) {
    await prisma.validation.deleteMany({ where: { submissionItem: { periodeId: id } } }).catch(() => {});
    await prisma.deleteRequest.deleteMany({ where: { submissionItem: { periodeId: id } } }).catch(() => {});
    await prisma.submissionItem.deleteMany({ where: { periodeId: id } }).catch(() => {});
    await prisma.bobotIndikator.deleteMany({ where: { periodeId: id } }).catch(() => {});
  }
  await prisma.periodePenilaian.deleteMany({ where: { id: { in: ids } } }).catch(() => {});
  await prisma.madrasah.deleteMany({ where: { nomorMadrasah: { startsWith: `BMU-${NS}` } } }).catch(() => {});
  await prisma.user.deleteMany({ where: { email: { contains: '@e2e-rec.local' } } }).catch(() => {});
  await prisma.auditLog.deleteMany({ where: { action: 'reconcile_legacy_draft' } }).catch(() => {});
}

let ctx;

async function setup() {
  // Periode lama: status historis (arsip) sehingga tidak pernah dipilih sebagai
  // periode aktif, meski tanggalnya sudah lewat.
  const periodeLama = await prisma.periodePenilaian.create({
    data: {
      namaPeriode: `${NS}/2025`,
      tahunCapaian: 2025,
      tanggalMulai: new Date('2025-01-01'),
      tanggalCutoff: new Date('2025-12-31'),
      status: 'arsip',
    },
  });

  const operator = await prisma.user.create({
    data: {
      password: 'hash', name: 'E2E REC Operator',
      email: `rec-op-${Date.now()}@e2e-rec.local`, role: 'operator', status: 'aktif',
    },
  });
  const madrasah = await prisma.madrasah.create({
    data: {
      nomorMadrasah: `BMU-${NS}-001`, namaMadrasah: `Madrasah ${NS}`, jenjang: 'MI',
      statusKepemilikan: 'Negeri', jumlahSiswa: 100, alamat: 'Jl E2E REC',
      slug: `madrasah-${NS.toLowerCase()}-${Date.now()}`, kelompok: 'MI Negeri',
    },
  });
  await prisma.user.update({ where: { id: operator.id }, data: { madrasahId: madrasah.id } });

  const diklat = await prisma.indikator.findFirst({ where: { slug: 'diklat' } });
  if (!diklat) throw new Error('Indikator diklat belum ada. Jalankan prisma seed dulu.');

  const buatDraft = (nama, periodeId, tahun) => prisma.submissionItem.create({
    data: {
      namaKegiatan: nama, indikatorId: diklat.id, madrasahId: madrasah.id, createdById: operator.id,
      periodeId, tahun, status: 'draft',
    },
  });

  const draftNyangkut = await buatDraft(`${NS} draft nyangkut`, periodeLama.id, 2025);

  // Draft pembanding yang SUDAH benar-benar di periode aktif: harus dibiarkan utuh.
  const aktif = await resolveAktifPeriode();
  if (!aktif) throw new Error('Butuh minimal satu periode aktif di DB untuk fixture.');
  const draftSehat = await buatDraft(`${NS} draft sehat`, aktif.id, aktif.tahunCapaian);

  return { periodeLama, operator, madrasah, diklat, draftNyangkut, draftSehat, aktif };
}

describe.skipIf(!dbGate())('Rekonsiliasi draft nyangkut (E2E-REC)', () => {
  beforeAll(async () => {
    await cleanup();
    ctx = await setup();
  });

  afterAll(async () => {
    await cleanup();
  });

  it('draft di periode lama DITOLAK saat dilanjutkan (403) — ini masalahnya', async () => {
    const { aktif } = ctx;
    expect(aktif, 'butuh minimal satu periode aktif di DB').toBeTruthy();
    // Draft milik periode lama tidak bisa diapa-apakan sama sekali.
    await expect(
      submissionService.updateOwnItem({
        id: ctx.draftNyangkut.id,
        body: { namaKegiatan: `${NS} draft nyangkut` },
        userId: ctx.operator.id,
        madrasahId: ctx.madrasah.id,
        ip,
      }),
    ).rejects.toMatchObject({ status: 403, code: 'PERIOD_CLOSED' });
  });

  it('dry-run melaporkan draft nyangkut tanpa mengubah apa pun', async () => {
    const laporan = await reconcileLegacyDrafts({ apply: false });
    const entri = laporan.perluTindakanAdmin.find((d) => d.id === ctx.draftNyangkut.id);
    expect(entri, 'draft nyangkut harus dilaporkan di dry-run').toBeTruthy();
    expect(entri.alasan).toBe('periode_lama');

    const setelah = await prisma.submissionItem.findUnique({ where: { id: ctx.draftNyangkut.id } });
    expect(setelah.periodeId, 'dry-run tidak boleh memindahkan draft').toBe(ctx.periodeLama.id);
  });

  it('apply memindahkan draft ke periode aktif lalu bisa dilanjutkan lagi', async () => {
    const laporan = await reconcileLegacyDrafts({ apply: true, userId: ctx.operator.id, ip });
    expect(laporan.diperbaiki.map((d) => d.id)).toContain(ctx.draftNyangkut.id);

    const pindah = await prisma.submissionItem.findUnique({ where: { id: ctx.draftNyangkut.id } });
    expect(pindah.periodeId).toBe(ctx.aktif.id);
    expect(pindah.tahun, 'tahun harus ikut pindah, kalau tidak skor ikut salah').toBe(ctx.aktif.tahunCapaian);

    // Inilah bukti akhirnya: operator bisa melanjutkan lagi. Edit dikirim sebagai
    // draft (bukan submit) supaya mode validasi 'draft' yang dipakai — kolom
    // wajibnya belum, itu memang wajar untuk draft.
    const updated = await submissionService.updateOwnItem({
      id: ctx.draftNyangkut.id,
      body: { namaKegiatan: `${NS} draft nyangkut`, status: 'draft' },
      userId: ctx.operator.id,
      madrasahId: ctx.madrasah.id,
      ip,
    });
    expect(updated.id).toBe(ctx.draftNyangkut.id);
    expect(updated.status).toBe('draft');

    const jejak = await prisma.auditLog.count({
      where: { action: 'reconcile_legacy_draft', entityId: String(ctx.draftNyangkut.id) },
    });
    expect(jejak, 'pemindahan harus tercatat di audit trail').toBe(1);
  });

  it('draft di periode aktif tidak disentuh, dan jalan dua kali = idempotent', async () => {
    const sebelum = await prisma.submissionItem.findUnique({ where: { id: ctx.draftSehat.id } });
    const laporan = await reconcileLegacyDrafts({ apply: true, userId: ctx.operator.id, ip });

    expect(laporan.diperbaiki.map((d) => d.id)).not.toContain(ctx.draftSehat.id);
    const sesudah = await prisma.submissionItem.findUnique({ where: { id: ctx.draftSehat.id } });
    expect(sesudah.periodeId).toBe(sebelum.periodeId);
    expect(sesudah.tahun).toBe(sebelum.tahun);
  });

  it('draft berhistori validasi TIDAK dipindah diam-diam', async () => {
    // Baris yang sudah pernah menyentuh validasi punya skor di baliknya —
    // memindahkannya diam-diam mengubah rapor, jadi hanya dilaporkan.
    const drafAdaRiwayat = await prisma.submissionItem.create({
      data: {
        namaKegiatan: `${NS} draft berriwayat`, indikatorId: ctx.diklat.id,
        madrasahId: ctx.madrasah.id, createdById: ctx.operator.id,
        periodeId: ctx.periodeLama.id, tahun: 2025, status: 'draft',
      },
    });
    await prisma.validation.create({
      data: {
        submissionItemId: drafAdaRiwayat.id,
        validatorId: ctx.operator.id,
        aksi: 'reject',
        alasan: `riwayat ${NS}`,
      },
    });

    const laporan = await reconcileLegacyDrafts({ apply: true, userId: ctx.operator.id, ip });
    const entri = laporan.perluTindakanAdmin.find((d) => d.id === drafAdaRiwayat.id);
    expect(entri?.alasan).toBe('punya_riwayat_validasi');

    const setelah = await prisma.submissionItem.findUnique({ where: { id: drafAdaRiwayat.id } });
    expect(setelah.periodeId, 'tidak boleh dipindah').toBe(ctx.periodeLama.id);
  });
});
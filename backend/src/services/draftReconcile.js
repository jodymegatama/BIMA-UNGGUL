/**
 * Rekonsiliasi draft lama ("draft nyangkut").
 *
 * LATAR BELAKANG
 * submissionService.updateOwnItem() menolak mengedit baris yang periodenya bukan
 * periode aktif:
 *
 *   if (item.periodeId !== periode.id) throw HttpError(403, 'PERIOD_CLOSED', ...)
 *
 * Jadi begitu satu periode ditutup (cutoff/finalisasi) dan periode berikutnya
 * dibuka, SETIAP draft dari periode lama berubah jadi_rows yang tidak bisa
 * dilanjutkan: tombol "Lanjutkan" selalu 403, dan tidak ada jalan keluar dari
 * UI. Operator terkunci dengan pekerjaan yang tidak pernah bisa dikirim.
 *
 * Draft yang lewat JALUR LAIN (Simpan Draft ulang) akan membuat baris BARU di
 * periode aktif, jadi isinya menggantung sebagai duplikat tak berguna — bukan
 * solutions, tapi kebocoran data.
 *
 * YANG DIPERBAIKI
 * Hanya baris `status = 'draft'` yang belum PERNAH menyentuh validasi (nol baris
 * di tabel Validation). Baris 'menunggu' / 'disetujui' / 'ditolak' punya
 * riwayat validasi dan skor; memindahkannya diam-diam mengubah angka rapor,
 * jadi itu TIDAK disentuh dan hanya dilaporkan.
 *
 * Draft dengan pemilik hilang / nonaktif juga tidak diubah: itu keputusan admin,
 * bukan sesuatu yang boleh ditebak skrip.
 *
 * linkBukti kosong TIDAK termasuk kasus ini — sejak kolomnya nullable, draft
 * seperti itu tetap bisa dibuka dan diisi operator. Yang membuat draft nyangkut
 * adalah periode, bukan link bukti.
 */

import { prisma } from '../db/prisma.js';
import { resolveAktifPeriode, deriveStatus } from './periodService.js';
import { recordAuditLog } from './auditService.js';

/**
 * Klasifikasikan satu draft.
 * @returns {{alasan: string, bisaDiperbaiki: boolean, detail?: object}}
 */
function klasifikasi(item, { periodeAktif, indikatorIds, madrasahIds, periodeIds, userAktifIds }) {
  if (!item.indikatorId || !indikatorIds.has(item.indikatorId)) {
    return { alasan: 'indikator_hilang', bisaDiperbaiki: false };
  }
  if (!item.madrasahId || !madrasahIds.has(item.madrasahId)) {
    return { alasan: 'madrasah_hilang', bisaDiperbaiki: false };
  }
  if (!item.createdById || !userAktifIds.has(item.createdById)) {
    return { alasan: 'pemilik_tidak_aktif', bisaDiperbaiki: false };
  }
  if (!periodeAktif) {
    // Tanpa periode aktif tidak ada tujuan pemindahan — reports only, don't touch.
    return { alasan: 'tidak_ada_periode_aktif', bisaDiperbaiki: false };
  }
  if (item.periodeId === periodeAktif.id) {
    return { alasan: 'sehat', bisaDiperbaiki: false };
  }
  if (!item.periodeId || !periodeIds.has(item.periodeId)) {
    return { alasan: 'periode_lama_dihapus', bisaDiperbaiki: true };
  }
  return {
    alasan: 'periode_lama',
    bisaDiperbaiki: true,
    detail: { dari: item.periodeId, ke: periodeAktif.id },
  };
}

/**
 * Rekonsiliasi draft nyangkut.
 *
 * Idempotent: baris yang sudah ada di periode aktif dilaporkan `sehat` dan
 * tidak disentuh, jadi aman dijalankan berkali-kali.
 *
 * @param {object} opsi
 * @param {boolean} [opsi.apply=false] — default hanya melaporkan, tidak menulis.
 * @param {number}  [opsi.userId] — dicatat pada audit log saat apply.
 * @returns {Promise<object>} laporan
 */
export async function reconcileLegacyDrafts({ apply = false, userId = null, ip = null } = {}) {
  const periodeAktif = await resolveAktifPeriode();
  const statusAktif = periodeAktif ? deriveStatus(periodeAktif) : null;
  // Hanya periode yang benar-benar bisa menerima tulisan yang jadi tujuan.
  const tujuan = periodeAktif && statusAktif === 'aktif' ? periodeAktif : null;

  const [indikatorIds, madrasahIds, periodeIds, usersAktif] = await Promise.all([
    prisma.indikator.findMany({ select: { id: true } }).then((r) => new Set(r.map((x) => x.id))),
    prisma.madrasah.findMany({ where: { deletedAt: null }, select: { id: true } }).then((r) => new Set(r.map((x) => x.id))),
    prisma.periodePenilaian.findMany({ select: { id: true } }).then((r) => new Set(r.map((x) => x.id))),
    prisma.user.findMany({ where: { status: 'aktif' }, select: { id: true } }).then((r) => new Set(r.map((x) => x.id))),
  ]);

  const drafts = await prisma.submissionItem.findMany({
    where: { status: 'draft', deletedAt: null },
    select: { id: true, periodeId: true, tahun: true, indikatorId: true, madrasahId: true, createdById: true, namaKegiatan: true },
  });

  const laporan = {
    apply,
    periodeAktif: periodeAktif ? { id: periodeAktif.id, nama: periodeAktif.namaPeriode, status: statusAktif } : null,
    totalDraft: drafts.length,
    diperbaiki: [],
    perluTindakanAdmin: [],
    sehat: 0,
  };

  for (const draft of drafts) {
    const hasil = klasifikasi(draft, {
      periodeAktif: tujuan,
      indikatorIds,
      madrasahIds,
      periodeIds,
      userAktifIds: usersAktif,
    });

    if (hasil.alasan === 'sehat') {
      laporan.sehat += 1;
      continue;
    }

    if (!hasil.bisaDiperbaiki) {
      laporan.perluTindakanAdmin.push({ id: draft.id, namaKegiatan: draft.namaKegiatan, alasan: hasil.alasan });
      continue;
    }

    // Yang punya riwayat validasi tidak boleh dipindah diam-diam.
    const riwayat = await prisma.validation.count({ where: { submissionItemId: draft.id } });
    if (riwayat > 0) {
      laporan.perluTindakanAdmin.push({
        id: draft.id,
        namaKegiatan: draft.namaKegiatan,
        alasan: 'punya_riwayat_validasi',
      });
      continue;
    }

    if (!apply) {
      laporan.perluTindakanAdmin.push({
        id: draft.id,
        namaKegiatan: draft.namaKegiatan,
        alasan: hasil.alasan,
        aksi: `pindahkan ke periode ${tujuan.namaPeriode}`,
      });
      continue;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.submissionItem.update({
        where: { id: draft.id },
        data: { periodeId: tujuan.id, tahun: tujuan.tahunCapaian },
        select: { id: true, periodeId: true, tahun: true },
      });
      // AuditLog.userId wajib (foreign key). Dijalankan dari CLI tidak ada
      // Tidak ada "user yang menjalankan" saat dipanggil dari CLI, jadi jejak
      // audit hanya ditulis kalau pemanggil menyertakan userId.
      if (userId) await recordAuditLog(
        {
          userId,
          action: 'reconcile_legacy_draft',
          entity: 'SubmissionItem',
          entityId: draft.id,
          dataSebelum: { periodeId: draft.periodeId, tahun: draft.tahun },
          dataSesudah: { periodeId: row.periodeId, tahun: row.tahun },
          alasan: `Draft nyangkut di periode lama, dipindahkan ke ${tujuan.namaPeriode} oleh rekonsiliasi`,
          ipAddress: ip,
        },
        tx,
      );
      return row;
    });
    laporan.diperbaiki.push({ id: updated.id, dari: draft.periodeId, ke: updated.periodeId, denganAudit: Boolean(userId) });
  }

  return laporan;
}

export default reconcileLegacyDrafts;
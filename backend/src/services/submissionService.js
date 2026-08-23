/**
 * Submission Service — BIMA UNGGUL (Operator write endpoints)
 * Endpoint: PRD §13 —
 *   POST /api/operator/indikator/:id/draft        (US2 draft)
 *   POST /api/operator/indikator/:id/submit       (US3 submit → menunggu)
 *   PATCH /api/operator/submission-item/:id       (US4 edit ditolak/draft → menunggu)
 *   POST /api/operator/submission-item/:id/request-delete  (US7b soft delete request)
 *
 * Aturan:
 * - Validasi field dinamis per indikator (mirror PRD §11) di SERVER — tidak percaya client.
 * - Cutoff: tulis baru/edit diblok setelah periode cutoff (PRD US3/US4) via resolveAktifPeriode().
 * - Tahun berjalan: implicit dari periode aktif (tahunCapaian) — keputusan desain.
 * - Semua aksi tercatat AuditLog.
 * Reference Context7 /prisma/web: prisma.$transaction(async tx => ...) untuk atomicity.
 */

import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';
import { recordAuditLog } from './auditService.js';
import { resolveAktifPeriode, deriveStatus } from './periodService.js';

const TX_OPTS = { timeout: 15000, maxWait: 5000 };

// ==================== Field rules per indikator (PRD §11) ====================

const TINGKAT = ['kabupaten', 'provinsi', 'nasional', 'internasional'];
const JENJANG = ['s1', 's2', 's3'];
const STATUS_PEGAWAI = ['asn', 'non_asn'];

/**
 * required : wajib saat SUBMIT (draft boleh parsial)
 * type     : string | url | enum | int
 */
export const FIELD_RULES = {
  diklat: {
    namaKegiatan: { required: true, type: 'string', maxLen: 255 },
    institusi: { required: true, type: 'string', maxLen: 255 },
    namaPeserta: { required: true, type: 'string', maxLen: 255 },
    statusPegawai: { required: true, type: 'enum', values: STATUS_PEGAWAI },
    linkBukti: { required: true, type: 'url' },
    catatan: { required: false, type: 'string', maxLen: 2000 },
  },
  penghargaan_individu: {
    namaKegiatan: { required: true, type: 'string', maxLen: 255 },
    institusi: { required: true, type: 'string', maxLen: 255 },
    namaPeserta: { required: true, type: 'string', maxLen: 255 },
    statusPegawai: { required: true, type: 'enum', values: STATUS_PEGAWAI },
    linkBukti: { required: true, type: 'url' },
    catatan: { required: false, type: 'string', maxLen: 2000 },
  },
  penghargaan_institusi: {
    namaKegiatan: { required: true, type: 'string', maxLen: 255 },
    institusi: { required: true, type: 'string', maxLen: 255 },
    tingkatWilayah: { required: true, type: 'enum', values: TINGKAT },
    linkBukti: { required: true, type: 'url' },
    catatan: { required: false, type: 'string', maxLen: 2000 },
  },
  prestasi_siswa: {
    namaKegiatan: { required: true, type: 'string', maxLen: 255 },
    institusi: { required: true, type: 'string', maxLen: 255 },
    namaPeserta: { required: true, type: 'string', maxLen: 255 },
    tingkatWilayah: { required: true, type: 'enum', values: TINGKAT },
    linkBukti: { required: true, type: 'url' },
    catatan: { required: false, type: 'string', maxLen: 2000 },
  },
  lulus_jenjang_lanjutan: {
    jenjangPendidikan: { required: true, type: 'enum', values: JENJANG },
    jumlah: { required: true, type: 'int', min: 1, max: 10000 },
    linkBukti: { required: true, type: 'url' },
    catatan: { required: false, type: 'string', maxLen: 2000 },
  },
  rapor_rata_rata: {
    pembilang: { required: true, type: 'int', min: 0, max: 1000000 },
    penyebut: { required: true, type: 'int', min: 1, max: 1000000 },
    linkBukti: { required: true, type: 'url' },
    catatan: { required: false, type: 'string', maxLen: 2000 },
  },
  siswa_lanjutan_unggulan: {
    namaKegiatan: { required: true, type: 'string', maxLen: 255 },
    namaPeserta: { required: true, type: 'string', maxLen: 255 },
    linkBukti: { required: true, type: 'url' },
    catatan: { required: false, type: 'string', maxLen: 2000 },
  },
  giat_inovatif: {
    namaKegiatan: { required: true, type: 'string', maxLen: 255 },
    linkBukti: { required: true, type: 'url' },
    catatan: { required: false, type: 'string', maxLen: 2000 },
  },
  rasio_penerimaan: {
    pembilang: { required: true, type: 'int', min: 0, max: 1000000 },
    penyebut: { required: true, type: 'int', min: 1, max: 1000000 },
    linkBukti: { required: true, type: 'url' },
    catatan: { required: false, type: 'string', maxLen: 2000 },
  },
};

// Whitelist key yang boleh masuk DB per indikator
function allowedKeys(kode) {
  const keys = new Set(Object.keys(FIELD_RULES[kode] || {}));
  keys.add('id'); // optional id existing item saat submit (edit-resubmit)
  return keys;
}

/** Bersihkan payload: hanya key whitelist; trim string; number utk int. */
function sanitizePayload(kode, raw) {
  const allowed = allowedKeys(kode);
  const out = {};
  for (const [k, v] of Object.entries(raw || {})) {
    if (!allowed.has(k)) continue;
    if (k === 'id') {
      const n = parseInt(v, 10);
      if (Number.isFinite(n)) out.id = n;
      continue;
    }
    const rule = FIELD_RULES[kode][k];
    if (!rule) continue;
    if (v === undefined || v === null) { out[k] = null; continue; }
    if (rule.type === 'int') {
      const n = Number(v);
      out[k] = Number.isFinite(n) ? n : v;
    } else if (typeof v === 'string') {
      out[k] = v.trim();
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Validasi payload satu item.
 * @param mode 'submit' (semua required dicek) | 'draft' (hanya validasi tipe field yang terisi)
 * @returns array pesan error per field {field, message}
 */
export function validateItem(kode, payload, mode = 'submit') {
  const rules = FIELD_RULES[kode];
  if (!rules) return [{ field: '_', message: `Indikator ${kode} tidak dikenal` }];

  const errors = [];
  // ratio cross-field: pembilang <= penyebut
  for (const [key, rule] of Object.entries(rules)) {
    const val = payload[key];
    const isEmpty = val === undefined || val === null || String(val).trim() === '';

    if (isEmpty) {
      if (mode === 'submit' && rule.required) errors.push({ field: key, message: `${key} wajib diisi` });
      continue;
    }
    switch (rule.type) {
      case 'string':
        if (typeof val !== 'string') errors.push({ field: key, message: `${key} harus teks` });
        else if (rule.maxLen && val.length > rule.maxLen) errors.push({ field: key, message: `${key} maksimal ${rule.maxLen} karakter` });
        break;
      case 'url':
        if (!/^https?:\/\/\S+$/i.test(String(val))) errors.push({ field: key, message: `${key} harus URL http(s)` });
        break;
      case 'enum':
        if (!rule.values.includes(val)) errors.push({ field: key, message: `${key} harus salah satu dari: ${rule.values.join(', ')}` });
        break;
      case 'int': {
        const n = Number(val);
        if (!Number.isInteger(n)) errors.push({ field: key, message: `${key} harus bilangan bulat` });
        else if (n < (rule.min ?? -Infinity)) errors.push({ field: key, message: `${key} minimal ${rule.min}` });
        else if (n > (rule.max ?? Infinity)) errors.push({ field: key, message: `${key} maksimal ${rule.max}` });
        break;
      }
      default:
        break;
    }
  }
  if (rules.pembilang && rules.penyebut && payload.pembilang != null && payload.penyebut != null && payload.pembilang !== '' && payload.penyebut !== '') {
    const p = Number(payload.pembilang);
    const s = Number(payload.penyebut);
    if (Number.isInteger(p) && Number.isInteger(s) && p > s) {
      errors.push({ field: 'pembilang', message: 'pembilang tidak boleh melebihi penyebut' });
    }
  }
  return errors;
}

// ==================== Period guard ====================

async function requireWritablePeriod() {
  const periode = await resolveAktifPeriode();
  if (!periode) throw new HttpError(403, 'NO_ACTIVE_PERIOD', 'Tidak ada periode penilaian aktif');
  const st = deriveStatus(periode);
  if (st !== 'aktif') {
    throw new HttpError(403, 'PERIOD_CLOSED', 'Periode penilaian sudah berakhir (cutoff) — tidak bisa mengubah data.');
  }
  return periode;
}

async function getOwnedItem(itemId, madrasahId) {
  const item = await prisma.submissionItem.findUnique({ where: { id: itemId } });
  if (!item) throw new HttpError(404, 'ITEM_NOT_FOUND', 'Submission tidak ditemukan');
  if (item.madrasahId !== Number(madrasahId)) throw new HttpError(403, 'FORBIDDEN', 'Submission bukan milik madrasah Anda');
  if (item.deletedAt) throw new HttpError(400, 'ALREADY_DELETED', 'Submission sudah dihapus');
  return item;
}

// ==================== Draft & Submit (bulk) ====================

/**
 * Simpan banyak baris sekaligus untuk satu indikator.
 * @param {'draft'|'menunggu'} targetStatus
 * items: [{ id?, ...fields }]
 */
export async function saveItems({ indikatorId, kodeSlug, items, targetStatus, userId, madrasahId, ip }) {
  const iid = parseInt(indikatorId, 10);
  if (!Number.isFinite(iid)) throw new HttpError(400, 'INVALID_ID', 'ID indikator tidak valid');

  const indikator = await prisma.indikator.findUnique({ where: { id: iid } });
  if (!indikator) throw new HttpError(404, 'INDIKATOR_NOT_FOUND', 'Indikator tidak ditemukan');
  if (kodeSlug && indikator.slug !== kodeSlug) throw new HttpError(400, 'INDIKATOR_MISMATCH', 'Indikator tidak cocok');

  if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, 'MISSING_ITEMS', 'items array wajib diisi');
  if (items.length > 100) throw new HttpError(400, 'TOO_MANY_ITEMS', 'Maksimal 100 baris per permintaan');

  const periode = await requireWritablePeriod();

  // validasi semua dulu — all-or-nothing
  for (let i = 0; i < items.length; i++) {
    const clean = sanitizePayload(indikator.slug, items[i]);
    const errs = validateItem(indikator.slug, clean, targetStatus === 'menunggu' ? 'submit' : 'draft');
    if (errs.length) {
      const e = new HttpError(400, 'VALIDATION_ERROR', `Baris ${i + 1}: ${errs.map((er) => er.message).join('; ')}`);
      e.fields = errs;
      e.index = i;
      throw e;
    }
  }

  return prisma.$transaction(async (tx) => {
    const results = [];
    for (const raw of items) {
      const clean = sanitizePayload(indikator.slug, raw);
      const { id: existingId, ...fields } = clean;

      let saved;
      if (existingId) {
        const item = await tx.submissionItem.findUnique({ where: { id: existingId } });
        if (!item) throw new HttpError(404, 'ITEM_NOT_FOUND', `Submission ID ${existingId} tidak ditemukan`);
        if (item.madrasahId !== Number(madrasahId)) throw new HttpError(403, 'FORBIDDEN', `Submission ID ${existingId} bukan milik madrasah Anda`);
        if (item.indikatorId !== iid) throw new HttpError(400, 'INDIKATOR_MISMATCH', `Submission ID ${existingId} bukan milik indikator ini`);
        if (item.deletedAt) throw new HttpError(400, 'ALREADY_DELETED', `Submission ID ${existingId} sudah dihapus`);
        if (!['draft', 'ditolak'].includes(item.status)) {
          throw new HttpError(400, 'INVALID_STATUS', `Baris ID ${existingId} berstatus ${item.status} — hanya draft/ditolak yang bisa diubah`);
        }
        saved = await tx.submissionItem.update({
          where: { id: existingId },
          data: { ...fields, status: targetStatus, alasanPenolakan: targetStatus === 'menunggu' ? null : undefined },
        });
      } else {
        saved = await tx.submissionItem.create({
          data: {
            ...fields,
            status: targetStatus,
            madrasahId: Number(madrasahId),
            indikatorId: iid,
            periodeId: periode.id,
            createdById: userId,
            tahun: periode.tahunCapaian,
          },
        });
      }
      results.push(saved);

      await recordAuditLog(
        {
          userId,
          action: existingId ? 'update_submission_item' : (targetStatus === 'menunggu' ? 'submit_submission' : 'draft_submission'),
          entity: 'SubmissionItem',
          entityId: saved.id,
          dataSesudah: { status: saved.status, indikatorId: iid, periodeId: periode.id },
          ipAddress: ip,
        },
        tx,
      );
    }
    return { data: results, total: results.length };
  }, TX_OPTS);
}

// ==================== PATCH /api/operator/submission-item/:id (US4) ====================

/**
 * Edit baris milik operator (status draft/ditolak).
 * Default hasil = menunggu (kirim ulang); body.status='draft' untuk simpan sebagai draft lagi.
 * Full validation (submit-level) karena akan masuk antrian validasi.
 */
export async function updateOwnItem({ id, body = {}, userId, madrasahId, ip }) {
  const itemId = parseInt(id, 10);
  if (!Number.isFinite(itemId)) throw new HttpError(400, 'INVALID_ID', 'ID tidak valid');

  const item = await getOwnedItem(itemId, madrasahId);
  if (!['draft', 'ditolak'].includes(item.status)) {
    throw new HttpError(400, 'INVALID_STATUS', `Hanya baris draft/ditolak yang bisa diedit (saat ini: ${item.status})`);
  }

  const periode = await requireWritablePeriod();
  // item lama mungkin dari periode beda — paksa tetap di periode aktif agar window konsisten
  if (item.periodeId !== periode.id) {
    throw new HttpError(403, 'PERIOD_CLOSED', 'Baris ini berasal dari periode lain yang sudah ditutup.');
  }

  const indikator = await prisma.indikator.findUnique({ where: { id: item.indikatorId } });
  if (!indikator) throw new HttpError(404, 'INDIKATOR_NOT_FOUND', 'Indikator tidak ditemukan');

  const merged = { ...item, ...(body || {}) };
  const clean = sanitizePayload(indikator.slug, merged);
  delete clean.id;

  const targetStatus = body.status === 'draft' ? 'draft' : 'menunggu';
  const errs = validateItem(indikator.slug, clean, targetStatus === 'menunggu' ? 'submit' : 'draft');
  if (errs.length) {
    throw Object.assign(new HttpError(400, 'VALIDATION_ERROR', errs.map((e) => e.message).join('; ')), { fields: errs });
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.submissionItem.update({
      where: { id: itemId },
      data: { ...clean, status: targetStatus, alasanPenolakan: targetStatus === 'menunggu' ? null : undefined },
    });
    await recordAuditLog(
      {
        userId,
        action: 'edit_resubmit_submission',
        entity: 'SubmissionItem',
        entityId: itemId,
        dataSebelum: { status: item.status },
        dataSesudah: { status: updated.status },
        ipAddress: ip,
      },
      tx,
    );
    return updated;
  }, TX_OPTS);
}

// ==================== POST /api/operator/submission-item/:id/request-delete (US7b) ====================

export async function requestDeleteItem({ id, alasan, userId, madrasahId, ip }) {
  const itemId = parseInt(id, 10);
  if (!Number.isFinite(itemId)) throw new HttpError(400, 'INVALID_ID', 'ID tidak valid');
  if (!alasan || String(alasan).trim().length === 0) throw new HttpError(400, 'MISSING_ALASAN', 'Alasan penghapusan wajib diisi');
  const cleanAlasan = String(alasan).trim();

  const item = await getOwnedItem(itemId, madrasahId);
  if (item.status !== 'disetujui') {
    throw new HttpError(400, 'INVALID_ITEM_STATUS', 'Hanya data berstatus disetujui yang bisa diajukan hapus');
  }

  const dup = await prisma.deleteRequest.findFirst({ where: { submissionItemId: itemId, status: 'menunggu' } });
  if (dup) throw new HttpError(409, 'REQUEST_PENDING', 'Sudah ada permintaan hapus menunggu untuk baris ini');

  return prisma.$transaction(async (tx) => {
    const req = await tx.deleteRequest.create({
      data: {
        submissionItemId: itemId,
        requestedById: userId,
        alasan: cleanAlasan,
        status: 'menunggu',
      },
    });
    await recordAuditLog(
      {
        userId,
        action: 'request_delete_submission',
        entity: 'DeleteRequest',
        entityId: req.id,
        dataSebelum: { submissionStatus: item.status },
        dataSesudah: { status: 'menunggu', alasan: cleanAlasan },
        alasan: cleanAlasan,
        ipAddress: ip,
      },
      tx,
    );
    return req;
  }, TX_OPTS);
}

export default {
  FIELD_RULES,
  validateItem,
  saveItems,
  updateOwnItem,
  requestDeleteItem,
};

import { prisma } from '../db/prisma.js';
import { Prisma } from '@prisma/client';
import { HttpError } from '../utils/httpError.js';
import { TX_OPTS } from '../config/transaction.js';
import { recordAuditLog } from './auditService.js';
import { validateConfig, completeConfig, defaultFields, rulesFromFields } from './indikatorConfig.js';
import { computeSkorBreakdown } from './scoringService.js';

export const parseId = (v) => {
  if (!/^\d+$/.test(String(v)) || !Number.isSafeInteger(Number(v)) || Number(v) < 1) throw new HttpError(400, 'INVALID_ID', 'ID tidak valid');
  return Number(v);
};
const fail = (message) => { throw new HttpError(400, 'INVALID_CONFIG', message); };
const META = ['nama', 'deskripsi', 'short', 'urutan', 'tipeFormula', 'fields'];
export function snapshot(ind) { return Object.fromEntries(META.map((k) => [k, ind[k]])); }

function validateMeta(data) {
  for (const [key, max] of [['nama', 191], ['deskripsi', 10000], ['short', 191]]) {
    if (typeof data[key] !== 'string' || data[key].length > max || (key === 'nama' && !data[key].trim())) fail(`${key} wajib berupa teks, maksimal ${max} karakter`);
    data[key] = data[key].trim();
  }
  if (!Number.isSafeInteger(data.urutan) || data.urutan < 0 || data.urutan > 100000) fail('Urutan harus bilangan bulat 0–100000');
  const errors = validateConfig(data);
  if (errors.length) fail(errors.join('; '));
}

function checkRevision(before, revision) {
  if (revision !== before.revision) throw new HttpError(409, 'CONFIG_CHANGED', 'Konfigurasi telah berubah. Muat ulang sebelum menyimpan.');
}

export async function lockPeriod(tx, periodeId, writable = true) {
  const id = parseId(periodeId);
  await tx.$queryRaw`SELECT id FROM PeriodePenilaian WHERE id = ${id} FOR UPDATE`;
  const p = await tx.periodePenilaian.findUnique({ where: { id } });
  if (!p) throw new HttpError(404, 'PERIODE_NOT_FOUND', 'Periode tidak ditemukan');
  if (writable && ['finalisasi', 'arsip'].includes(p.status)) throw new HttpError(423, 'PERIOD_LOCKED', 'Periode finalisasi/arsip terkunci');
  return p;
}

export async function listMaster() {
  return prisma.indikator.findMany({ orderBy: [{ urutan: 'asc' }, { id: 'asc' }], include: { _count: { select: { bobots: true, submissions: true } } } });
}

export async function createMaster(body, actor) {
  const data = { ...Object.fromEntries(META.map((k) => [k, body[k]])), aktif: false };
  data.short ??= '';
  data.deskripsi ??= '';
  data.urutan ??= 0;
  data.fields ??= defaultFields(data.tipeFormula);
  for (const key of ['kode', 'slug']) {
    if (typeof body[key] !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,79}$/.test(body[key])) fail(`${key} harus unik, maksimal 80 karakter huruf kecil/angka/_/-`);
    data[key] = body[key];
  }
  validateMeta(data);
  if (body.aktif !== undefined && typeof body.aktif !== 'boolean') fail('Status aktif harus boolean');
  data.aktif = body.aktif ?? false;
  if (data.aktif && !data.deskripsi) fail('Deskripsi Indikator wajib sebelum dipublikasikan');
  return prisma.$transaction(async (tx) => {
    const created = await tx.indikator.create({ data });
    await audit(tx, actor, 'create_indikator', 'Indikator', created.id, null, created);
    return created;
  }, TX_OPTS);
}

export async function updateMaster(id, body, actor) {
  const iid = parseId(id);
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM Indikator WHERE id = ${iid} FOR UPDATE`;
    const before = await tx.indikator.findUnique({ where: { id: iid } });
    if (!before) throw new HttpError(404, 'INDIKATOR_NOT_FOUND', 'Indikator tidak ditemukan');
    checkRevision(before, body.revision);
    if ((body.slug !== undefined && body.slug !== before.slug) || (body.kode !== undefined && body.kode !== before.kode)) fail('Kode dan slug permanen');
    const next = { ...snapshot(before), ...Object.fromEntries(META.filter((k) => body[k] !== undefined).map((k) => [k, body[k]])) };
    validateMeta(next);
    if (body.aktif !== undefined && typeof body.aktif !== 'boolean') fail('Status aktif harus boolean');
    if ((body.aktif ?? before.aktif) && !next.deskripsi) fail('Deskripsi Indikator wajib sebelum dipublikasikan');
    const updated = await tx.indikator.update({ where: { id: iid }, data: { ...next, aktif: body.aktif ?? before.aktif, revision: { increment: 1 } } });
    await audit(tx, actor, 'update_indikator', 'Indikator', iid, before, updated);
    return updated;
  }, TX_OPTS);
}

export async function deleteMaster(id, actor) {
  const iid = parseId(id);
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM Indikator WHERE id = ${iid} FOR UPDATE`;
    const before = await tx.indikator.findUnique({ where: { id: iid }, include: { _count: { select: { bobots: true, submissions: true } } } });
    if (!before) throw new HttpError(404, 'INDIKATOR_NOT_FOUND', 'Indikator tidak ditemukan');
    if (before._count.bobots || before._count.submissions) throw new HttpError(409, 'INDIKATOR_USED', 'Indikator sudah digunakan. Nonaktifkan untuk mempertahankan histori.');
    await tx.indikator.delete({ where: { id: iid } });
    await audit(tx, actor, 'delete_indikator', 'Indikator', iid, before, null);
    return { deleted: true };
  }, TX_OPTS);
}

export async function listPeriod(periodeId, db = prisma) {
  const pid = parseId(periodeId);
  const rows = await db.bobotIndikator.findMany({ where: { periodeId: pid }, include: { indikator: true }, orderBy: [{ urutan: 'asc' }, { id: 'asc' }] });
  const counts = await db.submissionItem.groupBy({ by: ['indikatorId'], where: { periodeId: pid }, _count: { id: true } });
  const used = new Map(counts.map((r) => [r.indikatorId, r._count.id]));
  return rows.map((r) => ({ ...r, id: r.indikatorId, configId: r.id, kode: r.indikator.kode, slug: r.indikator.slug,
    nama: r.nama ?? r.indikator.nama, deskripsi: r.deskripsi ?? r.indikator.deskripsi, short: r.short ?? r.indikator.short,
    tipeFormula: r.tipeFormula ?? r.indikator.tipeFormula, fields: r.fields ?? r.indikator.fields,
    lengkap: completeConfig(r), capaianCount: used.get(r.indikatorId) || 0, indikator: undefined }));
}

export async function attachPeriodConfig(items, db = prisma) {
  if (!items.length) return items;
  const rows = await db.bobotIndikator.findMany({ where: { periodeId: { in: [...new Set(items.map((i) => i.periodeId))] } } });
  const configs = new Map(rows.map((r) => [`${r.periodeId}:${r.indikatorId}`, r]));
  return items.map((item) => {
    const config = configs.get(`${item.periodeId}:${item.indikatorId}`);
    if (!config) return item;
    return { ...item, indikator: { ...item.indikator, ...snapshot(config), id: item.indikatorId, revision: config.revision, menerimaInput: config.menerimaInput } };
  });
}

export async function addPeriod(periodeId, body, actor) {
  return prisma.$transaction(async (tx) => {
    const p = await lockPeriod(tx, periodeId);
    const indikatorId = parseId(body.indikatorId);
    await tx.$queryRaw`SELECT id FROM Indikator WHERE id = ${indikatorId} FOR UPDATE`;
    const ind = await tx.indikator.findUnique({ where: { id: indikatorId } });
    if (!ind?.aktif) throw new HttpError(400, 'INDIKATOR_INACTIVE', 'Pilih indikator master aktif');
    const created = await tx.bobotIndikator.create({ data: { indikatorId, periodeId: p.id, ...snapshot(ind), menerimaInput: false } });
    await audit(tx, actor, 'add_indikator_periode', 'BobotIndikator', created.id, null, created);
    return created;
  }, TX_OPTS);
}

export async function updatePeriod(tx, periodeId, indikatorId, body, actor, requireRevision = true) {
  const p = await lockPeriod(tx, periodeId);
  const iid = parseId(indikatorId);
  const where = { indikatorId_periodeId: { indikatorId: iid, periodeId: p.id } };
  const before = await tx.bobotIndikator.findUnique({ where, include: { indikator: true } });
  if (!before) throw new HttpError(404, 'CONFIG_NOT_FOUND', 'Tambahkan indikator ke periode terlebih dahulu');
  if (before.terkunci) throw new HttpError(423, 'BOBOT_LOCKED', 'Konfigurasi terkunci');
  if (requireRevision) checkRevision(before, body.revision);
  const data = Object.fromEntries([...META, 'nilaiBobot', 'bobotTingkatWilayah', 'bobotJenjang', 'menerimaInput'].filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));
  const fallback = Object.fromEntries(META.filter((k) => before[k] == null).map((k) => [k, before.indikator[k]]));
  const next = { ...before, ...fallback, ...data };
  validateMeta(next);
  const structural = ['fields', 'tipeFormula'].some((k) => Object.hasOwn(data, k) && JSON.stringify(data[k]) !== JSON.stringify(before[k]));
  if (structural && await tx.submissionItem.count({ where: { indikatorId: iid, periodeId: p.id } })) throw new HttpError(409, 'CONFIG_IN_USE', 'Formulir/metode sudah digunakan capaian. Ubah pada periode berikutnya.');
  for (const k of ['nilaiBobot', 'bobotTingkatWilayah', 'bobotJenjang']) {
    if (data[k] === undefined || data[k] === null) continue;
    const entries = k === 'nilaiBobot' ? [data[k]] : Object.values(data[k]);
    const allowed = k === 'bobotTingkatWilayah' ? ['kabupaten', 'provinsi', 'nasional', 'internasional'] : ['s1', 's2', 's3'];
    if (k !== 'nilaiBobot' && (Array.isArray(data[k]) || typeof data[k] !== 'object' || Object.keys(data[k]).some((key) => !allowed.includes(key)))) fail('Kategori bobot tidak dikenal');
    if (entries.some((v) => typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1000000)) fail('Bobot harus angka terbatas 0–1000000');
  }
  if (data.menerimaInput !== undefined && typeof data.menerimaInput !== 'boolean') fail('Status input harus boolean');
  if (next.menerimaInput && !completeConfig(next)) fail('Lengkapi deskripsi, formulir dan seluruh bobot sebelum mengaktifkan input');
  // Prisma JSON columns: explicit null is represented as DbNull by the caller if needed;
  // empty weights can remain unchanged until a concrete valid value is supplied.
  const write = { ...fallback, ...data, revision: { increment: 1 } };
  for (const key of ['fields', 'bobotJenjang', 'bobotTingkatWilayah']) if (write[key] === null) write[key] = Prisma.DbNull;
  const updated = await tx.bobotIndikator.update({ where, data: write });
  await audit(tx, actor, 'update_indikator_periode', 'BobotIndikator', updated.id, before, updated);
  return updated;
}

export async function previewPeriod(periodeId, indikatorId, body) {
  const config = (await listPeriod(periodeId)).find((r) => r.id === parseId(indikatorId));
  if (!config) throw new HttpError(404, 'CONFIG_NOT_FOUND', 'Konfigurasi tidak ditemukan');
  checkRevision(config, body.revision);
  if (!completeConfig(config)) fail('Konfigurasi belum lengkap');
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 100) fail('Masukkan 1–100 contoh capaian');
  const rules = rulesFromFields(config.fields);
  // Preview requires only scoring fields, not dummy names or evidence URLs.
  for (const item of body.items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) fail('Contoh capaian harus berupa objek');
    for (const key of ['jumlah', 'pembilang', 'penyebut', 'tingkatWilayah', 'jenjangPendidikan']) {
      if (!rules[key]) continue;
      const value = item[key];
      if (rules[key].type === 'int' && (!Number.isInteger(value) || value < rules[key].min || value > rules[key].max)) fail(`Contoh ${key} tidak valid`);
      if (rules[key].type === 'enum' && !rules[key].values.includes(value)) fail(`Contoh ${key} tidak valid`);
    }
    if (config.tipeFormula === 'persentase' && item.pembilang > item.penyebut) fail('Pembilang tidak boleh melebihi penyebut');
  }
  const items = body.items.map((i) => ({ ...i, indikatorId: config.id, indikator: { slug: config.slug, tipeFormula: config.tipeFormula } }));
  return { ...computeSkorBreakdown(items, [{ ...config, indikatorId: config.id }]), tipeFormula: config.tipeFormula, periodeId: Number(periodeId), revision: config.revision };
}

export async function copyWeights(periodeId, body, actor) {
  const sourceId = parseId(body.sourcePeriodeId);
  if (sourceId === parseId(periodeId)) fail('Pilih periode sumber yang berbeda');
  return prisma.$transaction(async (tx) => {
    const p = await lockPeriod(tx, periodeId);
    const source = await tx.bobotIndikator.findMany({ where: { periodeId: sourceId } });
    const dest = await tx.bobotIndikator.findMany({ where: { periodeId: p.id } });
    const byId = new Map(source.map((s) => [s.indikatorId, s]));
    const revisions = body.revisions;
    if (!revisions || typeof revisions !== 'object') fail('Revisi konfigurasi tujuan wajib');
    let copied = 0;
    for (const row of dest) {
      const src = byId.get(row.indikatorId);
      if (!src || src.tipeFormula !== row.tipeFormula) continue;
      if (!completeConfig(src)) fail('Konfigurasi periode sumber belum lengkap');
      await updatePeriod(tx, p.id, row.indikatorId, { revision: revisions[row.indikatorId], nilaiBobot: src.nilaiBobot, bobotTingkatWilayah: src.bobotTingkatWilayah, bobotJenjang: src.bobotJenjang }, actor);
      copied++;
    }
    if (!copied) fail('Tidak ada indikator dengan metode yang sama pada kedua periode');
    return { copied, skipped: dest.length - copied };
  }, TX_OPTS);
}

async function audit(tx, actor, action, entity, entityId, before, after) {
  await recordAuditLog({ userId: actor.userId, ipAddress: actor.ip, action, entity, entityId, dataSebelum: before, dataSesudah: after }, tx);
}

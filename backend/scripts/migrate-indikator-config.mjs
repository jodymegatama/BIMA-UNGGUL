import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';
import { completeConfig, validateConfig } from '../src/services/indikatorConfig.js';

const db = new PrismaClient();
const apply = process.argv.includes('--apply');
const defaults = JSON.parse(await readFile(new URL('../prisma/indikator-defaults.json', import.meta.url), 'utf8'));
try {
  let masters = 0;
  let configs = 0;
  const anomalies = [];
  for (const d of defaults) {
    const errors = validateConfig({ tipeFormula: ['diklat', 'penghargaan_individu', 'siswa_lanjutan_unggulan', 'giat_inovatif'].includes(d.slug) ? 'per_capaian' : ['penghargaan_institusi', 'prestasi_siswa'].includes(d.slug) ? 'per_tingkat_wilayah' : d.slug === 'lulus_jenjang_lanjutan' ? 'per_jenjang' : 'persentase', fields: d.fields });
    if (errors.length) throw new Error(`${d.slug}: ${errors.join('; ')}`);
  }
  const inds = await db.indikator.findMany({ orderBy: { id: 'asc' } });
  const periods = await db.periodePenilaian.findMany({ orderBy: { id: 'asc' } });
  for (const ind of inds) {
    const d = defaults.find((d) => d.slug === ind.slug);
    const masterData = !ind.fields && d ? { fields: d.fields, deskripsi: ind.deskripsi || d.deskripsi, short: ind.short || d.short, urutan: ind.urutan || d.urutan } : {};
    if (Object.keys(masterData).length) {
      masters++;
      if (apply) await db.indikator.update({ where: { id: ind.id }, data: masterData });
    }
    const source = { ...ind, ...masterData };
    if (!source.fields) { anomalies.push({ indikatorId: ind.id, reason: 'Formulir master belum tersedia' }); continue; }
    for (const p of periods.filter((p) => !p.configInitialized)) {
      const where = { indikatorId_periodeId: { indikatorId: ind.id, periodeId: p.id } };
      const old = await db.bobotIndikator.findUnique({ where });
      if (old?.tipeFormula) continue;
      const snapshot = { nama: source.nama, deskripsi: source.deskripsi, short: source.short, urutan: source.urutan, tipeFormula: source.tipeFormula, fields: source.fields };
      const complete = completeConfig({ ...old, ...snapshot });
      const data = { ...snapshot, menerimaInput: complete, terkunci: ['finalisasi', 'arsip'].includes(p.status) || old?.terkunci === true };
      configs++;
      if (!complete) anomalies.push({ indikatorId: ind.id, periodeId: p.id, reason: 'Konfigurasi belum lengkap; input tidak diaktifkan' });
      if (apply) await db.bobotIndikator.upsert({ where, create: { indikatorId: ind.id, periodeId: p.id, ...data }, update: data });
    }
  }
  if (apply && !anomalies.some((a) => !a.periodeId)) await db.periodePenilaian.updateMany({ where: { id: { in: periods.filter((p) => !p.configInitialized).map((p) => p.id) } }, data: { configInitialized: true } });
  console.log(JSON.stringify({ apply, masters, configs, anomalies }));
} finally { await db.$disconnect(); }

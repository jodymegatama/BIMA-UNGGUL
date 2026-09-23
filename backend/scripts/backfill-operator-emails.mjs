/**
 * backfill-operator-emails.mjs - Isi email asli untuk akun Operator eksisting SEBELUM migrasi
 * operator_email_login (yang akan NULL-kan NIP operator).
 *
 * Latar: registrasi lama via DaftarForm membuat email sintetis <nip>@madrasah.local. Setelah
 * NIP di-NULL, NIP tidak bisa dipakai mengenali akun - pastikan email asli sudah terpasang.
 *
 * Pakai:
 *   node scripts/backfill-operator-emails.mjs --list
 *   node scripts/backfill-operator-emails.mjs --map mapping.json
 *   node scripts/backfill-operator-emails.mjs --verify
 *
 * Format mapping.json: [{ "nip": "1978...", "email": "nama@madrasah.sch.id" }, ...]
 */
import { prisma } from '../src/db/prisma.js';
import { readFileSync, existsSync } from 'node:fs';

const SYNTHETIC_SUFFIXES = ['@madrasah.local', '@operator.legacy.local'];

const isSynthetic = (email) => {
  const s = String(email || '').toLowerCase();
  return SYNTHETIC_SUFFIXES.some((suf) => s.endsWith(suf));
};

// validasi email sederhana tanpa regex (gate utama tetap validateEmail di authService)
const validEmail = (e) => {
  const s = String(e || '').trim().toLowerCase();
  const at = s.indexOf('@');
  const dot = s.lastIndexOf('.');
  return at > 0 && dot > at + 1 && dot < s.length - 1 && !s.includes(' ');
};

async function list() {
  const ops = await prisma.user.findMany({
    where: { role: 'operator' },
    select: { id: true, nip: true, name: true, email: true, status: true },
    orderBy: { id: 'asc' },
  });
  console.log('Daftar operator (' + ops.length + '):');
  for (const u of ops) {
    const flag = isSynthetic(u.email) ? ' [SINTETIS - perlu email asli]' : '';
    console.log('- id=' + u.id + ' | nip=' + (u.nip ?? 'NULL') + ' | email=' + u.email + flag);
  }
  console.log();
  console.log('Buat mapping.json dari daftar di atas, lalu jalankan dengan --map mapping.json');
}

async function map(file) {
  if (!file || !existsSync(file)) {
    console.error('File mapping tidak ditemukan: ' + file);
    process.exit(1);
  }
  let entries;
  try {
    entries = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    console.error('mapping.json tidak valid JSON: ' + e.message);
    process.exit(1);
  }
  if (!Array.isArray(entries)) {
    console.error('mapping.json harus array [{ nip, email }, ...]');
    process.exit(1);
  }

  let updated = 0, skipped = 0;
  for (const { nip, email } of entries) {
    if (!nip || !email) { console.warn('SKIP baris tanpa nip/email: ' + JSON.stringify({ nip, email })); skipped++; continue; }
    const norm = String(email).trim().toLowerCase();
    if (!validEmail(norm)) { console.warn('SKIP email tidak valid untuk nip ' + nip + ': ' + email); skipped++; continue; }
    const user = await prisma.user.findUnique({ where: { nip } });
    if (!user || user.role !== 'operator') { console.warn('SKIP operator nip=' + nip + ' tidak ditemukan'); skipped++; continue; }
    if (!isSynthetic(user.email)) { console.log('LEWATI ' + nip + ' - email sudah bukan sintetis: ' + user.email); skipped++; continue; }
    try {
      await prisma.user.update({ where: { id: user.id }, data: { email: norm } });
      console.log('OK ' + nip + ' -> ' + norm);
      updated++;
    } catch (e) {
      if (e.code === 'P2002') { console.warn('DUP email ' + norm + ' (sudah dipakai user lain) - nip ' + nip + ' dilewati'); skipped++; }
      else throw e;
    }
  }
  console.log();
  console.log('Selesai: ' + updated + ' email diupdate, ' + skipped + ' dilewati.');
}

async function verify() {
  const syn = await prisma.user.findMany({
    where: { role: 'operator', email: { endsWith: '@madrasah.local' } },
    select: { id: true, name: true, email: true },
  });
  if (syn.length === 0) {
    console.log('VERIFY OK - tidak ada operator dengan email sintetis @madrasah.local');
  } else {
    console.log('VERIFY: ' + syn.length + ' operator masih ber-email sintetis:');
    for (const u of syn) console.log('- id=' + u.id + ' | ' + u.name + ' | ' + u.email);
  }
  const noEmail = await prisma.user.count({ where: { role: 'operator', email: null } });
  console.log('Operator tanpa email: ' + noEmail);
}

const args = process.argv.slice(2);
if (args.includes('--list')) await list();
else if (args.includes('--map')) await map(args[args.indexOf('--map') + 1]);
else if (args.includes('--verify')) await verify();
else {
  console.log('Pakai: node scripts/backfill-operator-emails.mjs --list | --map mapping.json | --verify');
}
await prisma.$disconnect();

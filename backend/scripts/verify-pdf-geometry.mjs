/**
 * Verifikasi geometri PDF export (alat cek manual, bukan bagian dari `npm test`).
 * Generate buffer export semua kelompok, dekompres content stream PDF,
 * lalu cetak koordinat x setiap teks "KELOMPOK:" — harus selalu 52 (indentasi judul section).
 *
 * Latar belakang: pdfkit melanjutkan posisi-x teks terakhir bila `text()` tanpa
 * koordinat eksplisit — judul section ke-2 dst. bisa tergeser ke kanan halaman.
 * Pakai: node scripts/verify-pdf-geometry.mjs <periodeId>
 */
import zlib from 'node:zlib';
import * as exportService from '../src/services/exportService.js';

const periodeId = process.argv[2] || '11';
const buf = await exportService.buildPdfBuffer({ periodeId });

// Kumpulkan semua stream yang bisa di-inflate (content stream pdfkit = FlateDecode)
const streams = [...buf.toString('latin1').matchAll(/stream\r?\n([\s\S]*?)endstream/g)].map((m) => m[1]);
let inflated = 0, rawUsed = 0;
if (process.argv[3] === 'debug') {
  const first = streams[0] || '';
  try {
    const c = zlib.inflateSync(Buffer.from(first, 'latin1')).toString('latin1');
    console.log('=== stream pertama (inflated, 600 char) ===\n' + c.slice(0, 600));
  } catch (e) {
    console.log('inflate gagal:', e.message, '\n=== raw 300 char ===\n' + first.slice(0, 300));
  }
}
const texts = [];
for (const raw of streams) {
  let content;
  try {
    content = zlib.inflateSync(Buffer.from(raw, 'latin1')).toString('latin1');
    inflated++;
  } catch {
    content = raw; // stream tidak terkompresi
    rawUsed++;
  }
  // Format pdfkit aktual: "BT 1 0 0 1 X Y Tm ... [<hex> n <hex> 0] TJ ET" per fragmen.
  const blockRe = /BT\s+1 0 0 1\s+([-\d.]+)\s+([-\d.]+)\s+Tm[\s\S]*?\[([\s\S]*?)\]\s*TJ/g;
  for (const m of content.matchAll(blockRe)) {
    const hex = (m[3].match(/<([0-9a-fA-F]*)>/g) || []).join('').replace(/[<>]/g, '');
    let str = '';
    for (let i = 0; i + 1 < hex.length; i += 2) str += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
    texts.push({ x: parseFloat(m[1]), y: parseFloat(m[2]), str });
  }
}

const interesting = texts.filter((t) => t.str.includes('KELOMPOK') || t.str.includes('Diperbarui') || t.str.includes('BIMA UNGGUL'));
console.log(`streams: ${streams.length} (inflated ${inflated}, raw ${rawUsed}), fragmen teks terdeteksi: ${texts.length}`);
for (const t of interesting) console.log(`x=${t.x} y=${t.y} :: ${t.str.slice(0, 60)}`);

const titles = texts.filter((t) => t.str.startsWith('KELOMPOK'));
const bad = titles.filter((t) => t.x !== 52);
console.log(`\nTotal judul KELOMPOK: ${titles.length}, salah posisi: ${bad.length}`);
process.exit(bad.length ? 1 : 0);

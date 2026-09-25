/**
 * Export Service — BIMA UNGGUL Phase 3 Final
 * Generate PDF (pdfkit) & Excel (exceljs) dari leaderboard — hanya data disetujui.
 *
 * Revisi 2026-09-24: export dikelompokkan per jenjang kelompok madrasah.
 * - Tanpa kelompok/jenjang → satu section per kelompok (MI Negeri … MA Swasta),
 *   rank di-reset per section, kelompok tanpa data dilewati.
 * - `jenjang=MI|MTs|MA` → hanya 2 kelompok jenjang tsb.
 * - `kelompok="MI Negeri"` → satu tabel seperti sebelumnya (back-compatible).
 */
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { calculateRanking, calculateRankingAllGroups } from './scoringService.js';
import { KELOMPOKS_LIST } from '../constants/periode.constants.js';
import { prisma } from '../db/prisma.js';

const JENJANGS = ['MI', 'MTs', 'MA'];

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

/**
 * Validasi filter export → daftar kelompok yang akan dirender (urut KELOMPOKS_LIST).
 * @returns {{ kelompok: string|null, jenjang: string|null, kelompoks: string[] }}
 */
export function resolveKelompoks({ kelompok, jenjang } = {}) {
  if (kelompok && jenjang) throw httpError(400, 'Pilih kelompok ATAU jenjang, bukan keduanya');
  if (kelompok) {
    if (!KELOMPOKS_LIST.includes(kelompok)) throw httpError(400, `Kelompok tidak dikenal: ${kelompok}`);
    return { kelompok, jenjang: null, kelompoks: [kelompok] };
  }
  if (jenjang) {
    if (!JENJANGS.includes(jenjang)) throw httpError(400, `Jenjang tidak dikenal: ${jenjang}`);
    return { kelompok: null, jenjang, kelompoks: KELOMPOKS_LIST.filter((k) => k.startsWith(`${jenjang} `)) };
  }
  return { kelompok: null, jenjang: null, kelompoks: [...KELOMPOKS_LIST] };
}

export async function getLeaderboardData({ periodeId, kelompok, jenjang }) {
  if (!periodeId) throw httpError(400, 'periodeId wajib');
  const pid = parseInt(periodeId, 10);
  if (!Number.isFinite(pid)) throw httpError(400, 'periodeId tidak valid');
  const periode = await prisma.periodePenilaian.findUnique({ where: { id: pid } });
  if (!periode) throw httpError(404, 'Periode tidak ditemukan');

  const filter = resolveKelompoks({ kelompok, jenjang });

  // Kelompok spesifik → bentuk lama (back-compatible dengan pemanggil/test lama)
  if (filter.kelompok) {
    const rankings = await calculateRanking(filter.kelompok, pid);
    return { periode, kelompok: filter.kelompok, jenjang: null, groups: [{ kelompok: filter.kelompok, rankings }], rankings };
  }

  // Semua kelompok / per jenjang → satu section per kelompok (yang kosong dilewati)
  const all = await calculateRankingAllGroups(pid);
  const groups = filter.kelompoks
    .map((k) => ({ kelompok: k, rankings: all[k] || [] }))
    .filter((g) => g.rankings.length > 0);
  return { periode, kelompok: null, jenjang: filter.jenjang, groups, rankings: groups.flatMap((g) => g.rankings) };
}

const PDF_HEADERS = ['Rank', 'BMU', 'Madrasah', 'Kelompok', 'Skor'];
const PDF_COL_WIDTHS = [40, 90, 220, 90, 60];
const PDF_NAVY = '#1e3a8a';
const PDF_STRIPE = '#f4f4f5';
const PDF_ROW_LINE = '#e4e4e7';
const PDF_SECTION_DIVIDER = '#a1a1aa';

// Header tabel: kotak navy + teks putih bold. Dipanggil ulang saat pindah halaman.
function drawPdfTableHeader(doc, y) {
  doc.save();
  doc.rect(40, y, 515, 13).fill(PDF_NAVY);
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(7);
  let x = 40;
  PDF_HEADERS.forEach((h, i) => {
    doc.text(h, x, y + 3.5, { width: PDF_COL_WIDTHS[i], align: i === 0 || i === 4 ? 'center' : 'left' });
    x += PDF_COL_WIDTHS[i];
  });
  doc.restore();
  doc.fillColor('#000');
}

// Judul section: bar aksen navy di kiri + teks ter-indentasi (x=52, width eksplisit
// agar tidak mewarisi posisi teks sebelumnya — pdfkit melanjutkan posisi terakhir).
function drawPdfSectionTitle(doc, kelompok) {
  const titleY = doc.y + 10;
  doc.save();
  doc.rect(40, titleY, 3.5, 13).fill(PDF_NAVY);
  doc.restore();
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827')
    .text(`KELOMPOK: ${kelompok}`, 52, titleY + 0.5, { width: 503, align: 'left', lineBreak: false });
  doc.y = titleY + 17;
  doc.x = 40;
}

export async function buildPdfBuffer({ periodeId, kelompok, jenjang }) {
  const data = await getLeaderboardData({ periodeId, kelompok, jenjang });
  const { periode, groups } = data;
  const filterLabel = data.kelompok || (data.jenjang ? `Jenjang ${data.jenjang}` : 'Semua kelompok');

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve, reject) => { doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject); });

  // Semua teks selebar halaman diberi x + width eksplisit — tanpa itu pdfkit
  // melanjutkan posisi & lebar dari teks sebelumnya (sel kolom terakhir),
  // sehingga judul section berikutnya render di kanan halaman (bug terlihat di PDF).
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#000')
    .text('Kementerian Agama Kabupaten Pasuruan — Seksi Pendma', 40, 40, { width: 515, align: 'center' });
  doc.fontSize(16).font('Helvetica-Bold')
    .text('BIMA UNGGUL — Leaderboard Madrasah', 40, doc.y + 4, { width: 515, align: 'center' });
  doc.fontSize(10).font('Helvetica')
    .text(`Periode: ${periode.namaPeriode}  |  ${filterLabel}  |  Tanggal: ${new Date().toLocaleString('id-ID')}`, 40, doc.y + 4, { width: 515, align: 'center' });
  doc.x = 40;
  doc.moveDown();

  for (const g of groups) {
    const rankings = [...g.rankings].sort((a, b) => a.ranking - b.ranking || b.totalScore - a.totalScore);

    // Mulai section di halaman baru kalau sisa ruang tidak layak untuk judul + header + beberapa baris
    if (doc.y > 660) doc.addPage();

    drawPdfSectionTitle(doc, g.kelompok);

    let y = doc.y + 3;
    drawPdfTableHeader(doc, y);
    y += 17;
    rankings.forEach((r, idx) => {
      if (y > 765) {
        doc.addPage();
        y = 40;
        drawPdfTableHeader(doc, y);
        y += 17;
      }
      // striping baris genap
      if (idx % 2 === 1) {
        doc.save();
        doc.rect(40, y - 3, 515, 12).fill(PDF_STRIPE);
        doc.restore();
      }
      doc.font('Helvetica').fontSize(7).fillColor('#000');
      let x = 40;
      const row = [
        String(r.ranking),
        r.madrasah?.nomorMadrasah || '-',
        r.madrasah?.namaMadrasah || '-',
        r.madrasah?.kelompok || g.kelompok || '-',
        Number(r.totalScore).toFixed(2),
      ];
      row.forEach((cell, i) => {
        doc.text(cell, x, y, { width: PDF_COL_WIDTHS[i], align: i === 0 || i === 4 ? 'center' : 'left', lineBreak: false });
        x += PDF_COL_WIDTHS[i];
      });
      y += 12;
      doc.moveTo(40, y - 2).lineTo(555, y - 2).strokeColor(PDF_ROW_LINE).lineWidth(0.5).stroke();
    });

    // Divider antar kelompok (kecuali setelah grup terakhir)
    const isLast = g === groups[groups.length - 1];
    if (!isLast) {
      doc.save();
      doc.moveTo(40, y + 10).lineTo(555, y + 10).strokeColor(PDF_SECTION_DIVIDER).lineWidth(0.75).stroke();
      doc.restore();
      doc.y = y + 16;
    } else {
      doc.y = y + 6;
    }
    doc.x = 40;
  }

  doc.font('Helvetica').fontSize(7).fillColor('#666')
    .text(`Diperbarui: ${new Date().toISOString()} | Hanya data berstatus disetujui & tidak soft-deleted (scoringService)`, 40, doc.y + 8, { width: 515, align: 'center' });

  doc.end();
  return done;
}

const XLSX_COLUMNS = [
  { header: 'Rank', key: 'ranking', width: 8 },
  { header: 'BMU', key: 'bmu', width: 16 },
  { header: 'Madrasah', key: 'nama', width: 36 },
  { header: 'Kelompok', key: 'kelompok', width: 16 },
  { header: 'Skor', key: 'skor', width: 12 },
];

function addExcelRankingRows(ws, group) {
  group.rankings.forEach((r) => {
    ws.addRow({
      ranking: r.ranking,
      bmu: r.madrasah?.nomorMadrasah || '-',
      nama: r.madrasah?.namaMadrasah || '-',
      kelompok: r.madrasah?.kelompok || group.kelompok || '-',
      skor: Number(r.totalScore.toFixed(2)),
    });
  });
}

export async function buildExcelBuffer({ periodeId, kelompok, jenjang }) {
  const data = await getLeaderboardData({ periodeId, kelompok, jenjang });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'BIMA UNGGUL';
  wb.created = new Date();
  const ws = wb.addWorksheet('Leaderboard');

  if (data.kelompok) {
    // Satu kelompok — bentuk lama: header kolom di row 1
    ws.columns = XLSX_COLUMNS;
    ws.getRow(1).font = { bold: true };
    addExcelRankingRows(ws, data.groups[0]);
  } else {
    // Multi-kelompok — baris judul grup (bold, merged) + header kolom + baris ranking per section
    ws.columns = XLSX_COLUMNS.map(({ key, width }) => ({ key, width }));
    for (const g of data.groups) {
      const title = ws.addRow([`LEADERBOARD — ${g.kelompok}`]);
      const rowNo = title.number;
      ws.mergeCells(rowNo, 1, rowNo, XLSX_COLUMNS.length);
      title.font = { bold: true, size: 12 };
      title.alignment = { vertical: 'middle' };

      const header = ws.addRow(XLSX_COLUMNS.map((c) => c.header));
      header.font = { bold: true };

      addExcelRankingRows(ws, g);
      ws.addRow([]);
    }
  }

  // Baris metadata
  ws.addRow([]);
  const scopeLabel = data.kelompok || (data.jenjang ? `Jenjang ${data.jenjang}` : 'Semua');
  ws.addRow([`Periode: ${data.periode.namaPeriode} | Kelompok: ${scopeLabel} | ${new Date().toLocaleString('id-ID')}`]);

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export default { resolveKelompoks, getLeaderboardData, buildPdfBuffer, buildExcelBuffer };

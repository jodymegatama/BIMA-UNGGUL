/**
 * Export Service — BIMA UNGGUL Phase 3 Final
 * Generate PDF (pdfkit) & Excel (exceljs) dari leaderboard — hanya data disetujui
 */
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { calculateRanking, recalculateRankingAllGroups } from './scoringService.js';
import { prisma } from '../db/prisma.js';

export async function getLeaderboardData({ periodeId, kelompok }) {
  if (!periodeId) throw Object.assign(new Error('periodeId wajib'), { status:400, code:'MISSING_PERIODE' });
  const pid = parseInt(periodeId,10);
  if (!Number.isFinite(pid)) throw Object.assign(new Error('periodeId tidak valid'), { status:400 });
  const periode = await prisma.periodePenilaian.findUnique({ where:{id:pid}});
  if (!periode) throw Object.assign(new Error('Periode tidak ditemukan'), { status:404 });
  if (kelompok) {
    const rankings = await calculateRanking(kelompok, pid);
    return { periode, kelompok, rankings };
  }
  const all = await recalculateRankingAllGroups(pid);
  // flatten top? for export default first kelompok
  return { periode, kelompok: kelompok||'Semua', rankings: all };
}

export async function buildPdfBuffer({ periodeId, kelompok }) {
  const { periode, rankings: raw } = await getLeaderboardData({ periodeId, kelompok });
  const rankings = Array.isArray(raw) ? raw : Object.values(raw).flat();
  // sort already done by calculateRanking, but flatten needs sort
  rankings.sort((a,b)=> a.ranking - b.ranking || b.totalScore - a.totalScore);

  const doc = new PDFDocument({ margin: 40, size:'A4' });
  const chunks = [];
  doc.on('data', c=>chunks.push(c));
  const done = new Promise((resolve,reject)=>{ doc.on('end', ()=> resolve(Buffer.concat(chunks))); doc.on('error', reject); });

  doc.fontSize(16).text('BIMA UNGGUL — Leaderboard', { align:'center' });
  doc.fontSize(10).text(`Periode: ${periode.namaPeriode}  |  Kelompok: ${kelompok||'Semua'}  |  Tanggal: ${new Date().toLocaleString('id-ID')}`, { align:'center' });
  doc.moveDown();

  // table header
  const headers = ['Rank','BMU','Madrasah','Kelompok','Skor'];
  const colWidths = [40, 90, 220, 90, 60];
  const startX = 40;
  let y = doc.y;
  doc.fontSize(7).font('Helvetica-Bold');
  let x = startX;
  headers.forEach((h,i)=>{ doc.text(h, x, y, { width: colWidths[i], align: i===0||i===4?'center':'left' }); x+=colWidths[i]; });
  doc.moveTo(startX, y+12).lineTo(555, y+12).strokeColor('#999').stroke();
  y += 16;
  doc.font('Helvetica').fontSize(7);
  rankings.forEach((r)=>{
    if (y > 770) { doc.addPage(); y = 40; }
    x = startX;
    const row = [String(r.ranking), r.madrasah?.nomorMadrasah||'-', r.madrasah?.namaMadrasah||'-', r.madrasah?.kelompok||kelompok||'-', Number(r.totalScore).toFixed(2)];
    row.forEach((cell,i)=>{ doc.text(cell, x, y, { width: colWidths[i], align: i===0||i===4?'center':'left' }); x+=colWidths[i]; });
    y += 12;
    doc.moveTo(startX, y-2).lineTo(555, y-2).strokeColor('#eee').lineWidth(0.5).stroke();
  });

  doc.moveDown();
  doc.fontSize(7).fillColor('#666').text(`Diperbarui: ${new Date().toISOString()} | Hanya data berstatus disetujui & tidak soft-deleted (scoringService)`, { align:'center' });

  doc.end();
  return done;
}

export async function buildExcelBuffer({ periodeId, kelompok }) {
  const { periode, rankings: raw } = await getLeaderboardData({ periodeId, kelompok });
  const rankings = Array.isArray(raw) ? raw : Object.values(raw).flat();
  rankings.sort((a,b)=> a.ranking - b.ranking || b.totalScore - a.totalScore);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'BIMA UNGGUL';
  wb.created = new Date();
  const ws = wb.addWorksheet('Leaderboard');
  ws.columns = [
    { header:'Rank', key:'ranking', width:8 },
    { header:'BMU', key:'bmu', width:16 },
    { header:'Madrasah', key:'nama', width:36 },
    { header:'Kelompok', key:'kelompok', width:16 },
    { header:'Skor', key:'skor', width:12 },
  ];
  ws.getRow(1).font = { bold:true };
  ws.getRow(1).commit();
  rankings.forEach(r=>{
    ws.addRow({ ranking: r.ranking, bmu: r.madrasah?.nomorMadrasah||'-', nama: r.madrasah?.namaMadrasah||'-', kelompok: r.madrasah?.kelompok||kelompok||'-', skor: Number(r.totalScore.toFixed(2)) });
  });
  // metadata row
  ws.addRow([]);
  ws.addRow([`Periode: ${periode.namaPeriode} | Kelompok: ${kelompok||'Semua'} | ${new Date().toLocaleString('id-ID')}`]);
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export default { getLeaderboardData, buildPdfBuffer, buildExcelBuffer };

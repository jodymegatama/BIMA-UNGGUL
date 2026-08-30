/**
 * Public Controller — leaderboard & madrasah profil (tanpa auth, tanpa linkBukti)
 */
import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';
import { calculateRanking, calculateSkorMadrasah } from '../services/scoringService.js';
import { resolveAktifPeriode, deriveStatus } from '../services/periodService.js';

export async function leaderboard(req,res){
  const { periodeId, kelompok } = req.query;
  // periodeId optional? resolve periode efektif (jendela tanggal) jika missing
  let pid = periodeId ? parseInt(periodeId,10) : null;
  if (!pid) {
    const latest = await resolveAktifPeriode();
    if (!latest) throw new HttpError(404,'NO_PERIODE','Tidak ada periode aktif');
    pid = latest.id;
  }
  const periode = await prisma.periodePenilaian.findUnique({ where:{ id: pid }});
  if (!periode) throw new HttpError(404,'PERIODE_NOT_FOUND','Periode tidak ditemukan');
  // statusEfektif — derived dari jendela tanggal, bukan status mentah DB yang bisa stale
  const periodeWithStatus = { ...periode, statusEfektif: deriveStatus(periode) };
  // jumlah madrasah aktif (soft-deleted tidak dihitung) — untuk badge statistik publik
  const madrasahCount = await prisma.madrasah.count({ where: { deletedAt: null } });
  if (kelompok) {
    const allowed = ['MI Negeri','MI Swasta','MTs Negeri','MTs Swasta','MA Negeri','MA Swasta'];
    if (!allowed.includes(kelompok)) throw new HttpError(400,'INVALID_KELOMPOK','kelompok tidak valid');
    const rankings = await calculateRanking(kelompok, pid);
    return res.json({ periode: periodeWithStatus, kelompok, rankings, madrasahCount });
  }
  // all groups
  const kelompokList = ['MI Negeri','MI Swasta','MTs Negeri','MTs Swasta','MA Negeri','MA Swasta'];
  const all = {};
  for (const k of kelompokList) all[k] = await calculateRanking(k, pid);
  res.json({ periode: periodeWithStatus, rankings: all, madrasahCount });
}

export async function madrasahDetail(req,res){
  const { slug } = req.params;
  const madrasah = await prisma.madrasah.findUnique({ where:{ slug, deletedAt: null } });
  if (!madrasah) throw new HttpError(404,'NOT_FOUND','Madrasah tidak ditemukan');
  // cari periode: query param ?periodeId= diprioritaskan untuk testing, fallback aktif terbaru
  let periode = null;
  if (req.query?.periodeId) {
    const pid = parseInt(req.query.periodeId,10);
    if (Number.isFinite(pid)) periode = await prisma.periodePenilaian.findUnique({ where:{ id: pid }});
  }
  if (!periode) periode = await resolveAktifPeriode();
  if (!periode) periode = await prisma.periodePenilaian.findFirst({ orderBy:{ tanggalMulai:'desc' } });
  let skor = null;
  let prestasi = [];
  if (periode) {
    skor = await calculateSkorMadrasah(madrasah.id, periode.id);
    // prestasi terverifikasi: hanya disetujui, deletedAt null, tanpa linkBukti
    const items = await prisma.submissionItem.findMany({
      where:{ madrasahId: madrasah.id, periodeId: periode.id, status:'disetujui', deletedAt: null },
      select:{
        id:true, namaKegiatan:true, institusi:true, namaPeserta:true, tingkatWilayah:true, jenjangPendidikan:true, jumlah:true, pembilang:true, penyebut:true, tahun:true, catatan:true, skorBaris:true, status:true, createdAt:true,
        indikator:{ select:{ id:true, kode:true, slug:true, nama:true } },
        // linkBukti sengaja TIDAK di-select
      },
      orderBy:{ createdAt:'desc' },
    });
    prestasi = items;
  }
  res.json({ madrasah, periode, skor, prestasi });
}

export default { leaderboard, madrasahDetail, listPeriodePublik, statsPublik };
/**
 * GET /api/periode — daftar periode untuk FilterBar publik (id + nama + statusEfektif).
 * Publik hanya melihat periode yang masih relevan (tidak finalisasi/arsip) —
 * histori diarsip tidak tampil di leaderboard publik.
 */
export async function listPeriodePublik(req,res){
  const rows = await prisma.periodePenilaian.findMany({
    where: { status: { notIn: ['finalisasi', 'arsip'] } },
    orderBy: { tanggalMulai: 'desc' },
    select: { id: true, namaPeriode: true, tahunCapaian: true, tanggalMulai: true, tanggalCutoff: true, status: true },
  });
  const data = rows.map((r) => ({ ...r, statusEfektif: deriveStatus(r) }));
  res.json({ data });
}

/**
 * GET /api/stats — statistik HeroSection Home (jumlah madrasah aktif + jumlah kelompok).
 */
export async function statsPublik(req,res){
  const [madrasahCount] = await Promise.all([
    prisma.madrasah.count({ where: { deletedAt: null } }),
  ]);
  res.json({ madrasahCount, kelompokCount: 6 });
}

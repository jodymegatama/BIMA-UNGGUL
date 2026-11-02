import 'dotenv/config';
import { writeFile, readFile } from 'node:fs/promises';
import { prisma } from '../src/db/prisma.js';
import { calculateRanking, calculateSkorMadrasah } from '../src/services/scoringService.js';
import { KELOMPOKS_LIST } from '../src/constants/periode.constants.js';

// Read-only measurement; no names, email, credentials, or evidence links in output.
const path = process.argv[3] || '../tasks/indikator-baseline.json';
try {
  const periods = await prisma.periodePenilaian.findMany({ orderBy: { id: 'asc' } });
  const schools = await prisma.madrasah.findMany({ select: { id: true }, orderBy: { id: 'asc' } });
  const result = {
    counts: {
      indikator: await prisma.indikator.count(),
      periode: periods.length,
      madrasah: schools.length,
      capaian: await prisma.submissionItem.count(),
      status: await prisma.submissionItem.groupBy({ by: ['status'], _count: { id: true } }),
    },
    periods: [],
  };
  for (const p of periods) {
    const scores = [];
    for (const m of schools) scores.push({ id: m.id, ...await calculateSkorMadrasah(m.id, p.id) });
    const rankings = {};
    for (const k of KELOMPOKS_LIST) rankings[k] = (await calculateRanking(k, p.id)).map((r) => ({ id: r.madrasah.id, score: r.totalScore, rank: r.ranking }));
    result.periods.push({ id: p.id, status: p.status, scores, rankings });
  }
  if (process.argv[2] === '--check') {
    const before = JSON.parse(await readFile(path, 'utf8'));
    if (JSON.stringify(before) !== JSON.stringify(result)) throw new Error('Baseline berbeda: periksa jumlah, subtotal, skor dan ranking.');
    console.log('Baseline MATCH: jumlah, subtotal, skor dan ranking seluruh periode sama.');
  } else {
    await writeFile(path, JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ counts: result.counts, periods: result.periods.length, output: path }));
  }
} finally {
  await prisma.$disconnect();
}

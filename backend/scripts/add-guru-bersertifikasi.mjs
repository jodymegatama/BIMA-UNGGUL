import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { addGuruBersertifikasi } from '../src/services/indikatorService.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });
const prisma = new PrismaClient();
try {
  const result = await addGuruBersertifikasi(prisma);
  console.log(`Indikator ${result.indikator.kode}: ${result.indikator.nama}; ${result.bobotsCreated} bobot awal ditambahkan.`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

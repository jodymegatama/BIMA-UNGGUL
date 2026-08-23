/**
 * Prisma Client — BIMA UNGGUL Phase 3
 * Single instance for database access
 */

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

export default prisma;

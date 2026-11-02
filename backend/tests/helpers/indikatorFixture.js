import { snapshot } from '../../src/services/indikatorService.js';
import { prisma } from '../../src/db/prisma.js';
// Fixtures use real period metadata; test bootstrap must not implicitly change production defaults.
export async function prepareConfig(periodeId, indikator, bobot = {}) {
  return prisma.bobotIndikator.upsert({
    where: { indikatorId_periodeId: { indikatorId: indikator.id, periodeId } },
    create: { indikatorId: indikator.id, periodeId, ...snapshot(indikator), nilaiBobot: 10, ...bobot, menerimaInput: true },
    update: { ...snapshot(indikator), ...bobot, menerimaInput: true },
  });
}

export const GURU_BERSERTIFIKASI = {
  kode: '10',
  slug: 'guru_bersertifikasi',
  nama: 'Jumlah Guru Bersertifikasi',
  tipeFormula: 'persentase',
};

export function sortIndikators(indikators) {
  return [...indikators].sort((a, b) => a.kode.localeCompare(b.kode, 'id', { numeric: true }));
}

/** Additive rollout: existing master/configuration and closed periods stay untouched. */
export async function addGuruBersertifikasi(client, now = new Date()) {
  return client.$transaction(async (tx) => {
    const indikator = await tx.indikator.upsert({
      where: { slug: GURU_BERSERTIFIKASI.slug }, update: {}, create: GURU_BERSERTIFIKASI,
    });
    const periodes = await tx.periodePenilaian.findMany();
    const open = periodes.filter((p) => ['aktif', 'belum_dimulai'].includes(p.status) && new Date(p.tanggalCutoff) >= now);
    const result = open.length ? await tx.bobotIndikator.createMany({
      data: open.map((p) => ({ indikatorId: indikator.id, periodeId: p.id, nilaiBobot: 0 })),
      skipDuplicates: true,
    }) : { count: 0 };
    return { indikator, bobotsCreated: result.count };
  });
}

/**
 * Helper murni untuk mode "Lanjutkan semua draft" di Input Capaian.
 * Mengumpulkan seluruh draft server (id numerik) dari semua indikator,
 * diberi atribut indikatorKode grupnya masing-masing.
 */
export function collectServerDrafts(data) {
  return Object.entries(data || {}).flatMap(([kode, list]) =>
    (list || [])
      .filter((r) => typeof r.id === 'number')
      .map((r) => ({ ...r, indikatorKode: r.indikatorKode || kode }))
  );
}

/** Kelompokkan draft per kode indikator (urutan keys = urutan tab). */
export function groupDraftsByKode(drafts) {
  const map = new Map();
  (drafts || []).forEach((r) => {
    const kode = r.indikatorKode || 'diklat';
    if (!map.has(kode)) map.set(kode, []);
    map.get(kode).push(r);
  });
  return map;
}

export default { collectServerDrafts, groupDraftsByKode };

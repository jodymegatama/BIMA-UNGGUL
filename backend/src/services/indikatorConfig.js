// Only existing SubmissionItem columns are configurable. JSON is metadata, never executable code.
export const FORMULAS = ['per_capaian', 'per_tingkat_wilayah', 'per_jenjang', 'persentase'];
export const WILAYAH = ['kabupaten', 'provinsi', 'nasional', 'internasional'];
export const JENJANG = ['s1', 's2', 's3'];
export const FIELD_CATALOG = {
  namaKegiatan: { type: 'text', label: 'Nama Kegiatan', maxLen: 255 },
  institusi: { type: 'text', label: 'Institusi', maxLen: 255 },
  namaPeserta: { type: 'text', label: 'Nama Peserta', maxLen: 255 },
  statusPegawai: { type: 'select', label: 'Status Pegawai', options: ['asn', 'non_asn'].map((value) => ({ value, label: value })) },
  tingkatWilayah: { type: 'select', label: 'Tingkat Wilayah', options: WILAYAH.map((value) => ({ value, label: value })) },
  jenjangPendidikan: { type: 'select', label: 'Jenjang Pendidikan', options: JENJANG.map((value) => ({ value, label: value.toUpperCase() })) },
  jumlah: { type: 'number', label: 'Jumlah', min: 1, max: 10000 },
  ratio: { type: 'ratio', label: 'Perbandingan Jumlah', pembilangLabel: 'Pembilang', penyebutLabel: 'Penyebut', min: 0, max: 1000000 },
  linkBukti: { type: 'text', label: 'Link Bukti Fisik', required: true },
  catatan: { type: 'textarea', label: 'Catatan Tambahan', maxLen: 2000 },
};
const REQUIRED = { per_capaian: [], per_tingkat_wilayah: ['tingkatWilayah'], per_jenjang: ['jenjangPendidikan', 'jumlah'], persentase: ['ratio'] };

export function defaultFields(tipeFormula) {
  return ['namaKegiatan', ...(REQUIRED[tipeFormula] || []), 'linkBukti', 'catatan'].map((key) => ({
    key, ...structuredClone(FIELD_CATALOG[key]), required: key !== 'catatan',
  }));
}

export function validateConfig({ tipeFormula, fields }) {
  const errors = [];
  if (!FORMULAS.includes(tipeFormula)) errors.push('Metode perhitungan tidak dikenal');
  if (!Array.isArray(fields) || fields.length > Object.keys(FIELD_CATALOG).length) return [...errors, 'Daftar field tidak valid'];
  const keys = new Set();
  for (const f of fields) {
    if (!f || typeof f !== 'object' || !Object.hasOwn(FIELD_CATALOG, f.key)) { errors.push('Field tidak dikenal'); continue; }
    const catalog = FIELD_CATALOG[f.key];
    if (keys.has(f.key)) errors.push(`Field ${f.key} duplikat`);
    keys.add(f.key);
    if (f.type !== catalog.type || typeof f.required !== 'boolean') errors.push(`Tipe field ${f.key} tidak valid`);
    for (const prop of ['label', 'help', 'placeholder', 'pembilangLabel', 'penyebutLabel']) {
      if (f[prop] !== undefined && (typeof f[prop] !== 'string' || f[prop].length > 1000)) errors.push(`${prop} ${f.key} tidak valid`);
    }
    if (typeof f.label !== 'string' || !f.label.trim()) errors.push(`Label ${f.key} wajib`);
    if (catalog.options && (!Array.isArray(f.options) || f.options.some((o) => !o || typeof o.label !== 'string' || !o.label.trim() || o.label.length > 100) || JSON.stringify(f.options.map((o) => o.value).sort()) !== JSON.stringify(catalog.options.map((o) => o.value).sort()))) errors.push(`Opsi ${f.key} tidak valid`);
    for (const prop of ['min', 'max', 'maxLen']) {
      if (f[prop] !== undefined && (!Number.isFinite(f[prop]) || f[prop] < 0 || (catalog[prop] === undefined) || (prop === 'min' ? f[prop] < catalog[prop] : f[prop] > catalog[prop]))) errors.push(`Batas ${f.key} tidak valid`);
    }
  }
  for (const key of ['linkBukti', ...(REQUIRED[tipeFormula] || [])]) {
    if (!fields.some((f) => f?.key === key && f.required === true)) errors.push(`${key} wajib untuk metode ini`);
  }
  return errors;
}

export function rulesFromFields(fields) {
  const rules = {};
  for (const f of fields) {
    const catalog = FIELD_CATALOG[f.key];
    if (!catalog) continue;
    if (f.type === 'ratio') {
      for (const key of ['pembilang', 'penyebut']) rules[key] = { required: f.required, type: 'int', min: 0, max: 1000000 };
    } else {
      rules[f.key] = { required: f.required, type: f.key === 'linkBukti' ? 'url' : f.type === 'select' ? 'enum' : f.type === 'number' ? 'int' : 'string',
        ...(catalog.options ? { values: catalog.options.map((o) => o.value) } : {}),
        min: f.min ?? catalog.min, max: f.max ?? catalog.max, maxLen: f.maxLen ?? catalog.maxLen };
    }
  }
  return rules;
}

export function completeConfig(c) {
  if (!c || typeof c.deskripsi !== 'string' || !c.deskripsi.trim() || c.deskripsi.length > 10000 || validateConfig(c).length) return false;
  const finite = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
  if (c.tipeFormula === 'per_tingkat_wilayah') return WILAYAH.every((k) => finite(c.bobotTingkatWilayah?.[k]));
  if (c.tipeFormula === 'per_jenjang') return JENJANG.every((k) => finite(c.bobotJenjang?.[k]));
  return finite(c.nilaiBobot);
}

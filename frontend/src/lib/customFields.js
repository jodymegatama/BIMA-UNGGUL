export const customTypeLabels = { text: 'Teks pendek', textarea: 'Teks panjang', integer: 'Bilangan bulat', decimal: 'Angka desimal', date: 'Tanggal', select: 'Pilihan tunggal', multiselect: 'Pilihan jamak', boolean: 'Ya/Tidak', url: 'URL' };
export const isEmpty = (v) => v == null || v === '' || (Array.isArray(v) && !v.length);
export const legacyScoreRefs = { per_capaian: {}, persentase: { numerator: { source: 'builtin', key: 'pembilang' }, denominator: { source: 'builtin', key: 'penyebut' } }, per_tingkat_wilayah: { category: { source: 'builtin', key: 'tingkatWilayah' } }, per_jenjang: { category: { source: 'builtin', key: 'jenjangPendidikan' }, quantity: { source: 'builtin', key: 'jumlah' } } };
export const sourceLabels = { quantity: 'Jumlah / pengali', category: 'Kategori', numerator: 'Pembilang', denominator: 'Penyebut' };
export function scoringSources(config) {
  return Object.entries(config?.scoringConfig || legacyScoreRefs[config?.tipeFormula] || {}).filter(([role]) => Object.hasOwn(sourceLabels, role)).map(([role, ref]) => ({ role, field: config.fields?.find((f) => f.key === ref.key && (f.source || 'builtin') === ref.source) || { key: ref.key, label: config.fields?.find((f) => f.key === 'ratio')?.[`${ref.key}Label`] || ref.key, source: ref.source } }));
}
export function customPayload(fields, values = {}) {
  return Object.fromEntries(fields.filter((f) => f.source === 'custom').map((f) => {
    const v = values[f.key];
    return [f.key, isEmpty(v) ? null : ['integer', 'decimal'].includes(f.type) ? Number(v) : typeof v === 'string' ? v.trim() : v];
  }));
}
export function customError(f, v, mode) {
  if (isEmpty(v)) return f.required && mode === 'submit' ? `${f.label} wajib diisi.` : null;
  if (['integer', 'decimal'].includes(f.type)) {
    const n = Number(v), scale = 10 ** (f.precision ?? 6);
    if (!Number.isFinite(n) || n < (f.min ?? -1e9) || n > (f.max ?? 1e9)) return `${f.label}: angka di luar batas.`;
    if (f.type === 'integer' && !Number.isSafeInteger(n)) return 'Harus bilangan bulat.';
    if (f.type === 'decimal' && Math.abs(n * scale - Math.round(n * scale)) > 1e-5) return 'Presisi desimal melebihi batas.';
  } else if (f.type === 'boolean') {
    if (typeof v !== 'boolean') return 'Pilih Ya atau Tidak.';
  } else if (f.type === 'date') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(Date.parse(v)) || new Date(v).toISOString().slice(0, 10) !== v) return 'Tanggal kalender tidak valid.';
  } else if (f.type === 'select') {
    if (!f.options?.some((o) => o.value === v)) return 'Pilihan tidak valid.';
  } else if (f.type === 'multiselect') {
    if (!Array.isArray(v) || new Set(v).size !== v.length || v.some((x) => !f.options?.some((o) => o.value === x))) return 'Pilihan jamak tidak valid.';
  } else {
    if (typeof v !== 'string' || v.length > (f.maxLen ?? (f.type === 'textarea' ? 4000 : 2000))) return 'Teks melebihi batas.';
    if (f.type === 'url') { try { if (!['http:', 'https:'].includes(new URL(v).protocol)) return 'URL harus http(s).'; } catch { return 'URL tidak valid.'; } }
  }
  return null;
}
export function fieldValue(field, row) { return field.source === 'custom' ? row.customValues?.[field.key] : row[field.key]; }
export function formatFieldValue(field, row) {
  const v = fieldValue(field, row);
  if (isEmpty(v)) return '—';
  if (field.type === 'boolean') return v === true ? 'Ya' : 'Tidak';
  if (['select', 'multiselect'].includes(field.type)) return (Array.isArray(v) ? v : [v]).map((id) => field.options?.find((o) => o.value === id)?.label || id).join(', ');
  return String(v);
}

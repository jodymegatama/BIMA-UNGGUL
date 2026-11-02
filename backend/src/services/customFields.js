import { HttpError } from '../utils/httpError.js';

export const CUSTOM_TYPES = ['text', 'textarea', 'integer', 'decimal', 'date', 'select', 'multiselect', 'boolean', 'url'];
export const CUSTOM_LIMITS = Object.freeze({ fields: 25, options: 50, definitionBytes: 32768, valueBytes: 16384, numeric: 1e9, precision: 6, score: 1e12 });
const own = (obj, key) => Object.hasOwn(obj, key);
const record = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && [Object.prototype, null].includes(Object.getPrototypeOf(v));
const empty = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length);
const fieldId = (v) => typeof v === 'string' && /^cf_[a-z0-9_]{1,64}$/.test(v);
const optionId = (v) => typeof v === 'string' && /^opt_[a-z0-9_]{1,64}$/.test(v);
const bytes = (v) => Buffer.byteLength(JSON.stringify(v), 'utf8');
const numeric = (v) => typeof v === 'number' && Number.isFinite(v);
const issue = (field, message) => ({ field, message });
function invalid(errors) {
  throw Object.assign(new HttpError(400, 'INVALID_CUSTOM_FIELDS', errors.map((e) => e.message).join('; ')), { fields: errors });
}

// Definitions are deliberately independent of the catalog of fixed SQL columns.
export function validateCustomFields(fields) {
  if (!Array.isArray(fields)) return [issue('fields', 'Daftar field wajib berupa array')];
  const errors = [];
  if (fields.length > CUSTOM_LIMITS.fields || bytes(fields) > CUSTOM_LIMITS.definitionBytes) errors.push(issue('fields', 'Definisi field melebihi batas'));
  const keys = new Set();
  for (const f of fields) {
    if (!record(f)) { errors.push(issue('fields', 'Definisi field tidak valid')); continue; }
    const key = typeof f.key === 'string' ? f.key : 'fields';
    const properties = ['source', 'key', 'type', 'label', 'required', 'visibility', 'help', 'placeholder', 'min', 'max', 'maxLen', 'precision', 'options'];
    if (Object.keys(f).some((p) => !properties.includes(p))) errors.push(issue(key, 'Properti field tidak dikenal'));
    if (f.source !== 'custom' || !fieldId(f.key) || keys.has(f.key)) errors.push(issue(key, 'ID field kustom tidak valid atau duplikat'));
    keys.add(f.key);
    if (!CUSTOM_TYPES.includes(f.type)) errors.push(issue(key, 'Tipe field tidak didukung'));
    if (typeof f.required !== 'boolean' || !['internal', 'public'].includes(f.visibility)) errors.push(issue(key, 'Aturan wajib/visibilitas tidak valid'));
    for (const prop of ['label', 'help', 'placeholder']) if ((prop === 'label' || own(f, prop)) && (typeof f[prop] !== 'string' || f[prop].length > 1000 || (prop === 'label' && !f[prop].trim()))) errors.push(issue(key, `${prop} field tidak valid`));
    for (const prop of ['min', 'max']) if (own(f, prop) && (!['integer', 'decimal'].includes(f.type) || !numeric(f[prop]) || Math.abs(f[prop]) > CUSTOM_LIMITS.numeric)) errors.push(issue(key, 'Batas angka tidak valid'));
    if (f.min !== undefined && f.max !== undefined && f.min > f.max) errors.push(issue(key, 'Minimum melebihi maksimum'));
    if (f.type === 'integer' && ['min', 'max'].some((p) => own(f, p) && !Number.isSafeInteger(f[p]))) errors.push(issue(key, 'Batas bilangan bulat harus integer'));
    if (own(f, 'precision') && (f.type !== 'decimal' || !Number.isInteger(f.precision) || f.precision < 0 || f.precision > CUSTOM_LIMITS.precision)) errors.push(issue(key, 'Presisi desimal tidak valid'));
    const maxLength = f.type === 'textarea' ? 4000 : 2000;
    if (own(f, 'maxLen') && (!['text', 'textarea', 'url'].includes(f.type) || !Number.isInteger(f.maxLen) || f.maxLen < 1 || f.maxLen > maxLength)) errors.push(issue(key, 'Batas panjang tidak valid'));
    if (['select', 'multiselect'].includes(f.type)) {
      if (!Array.isArray(f.options) || !f.options.length || f.options.length > CUSTOM_LIMITS.options) { errors.push(issue(key, 'Pilihan wajib berisi 1–50 opsi')); continue; }
      const seen = new Set();
      for (const o of f.options) {
        if (!record(o) || !optionId(o.value) || seen.has(o.value) || typeof o.label !== 'string' || !o.label.trim() || o.label.length > 100) errors.push(issue(key, 'ID atau label opsi tidak valid/duplikat'));
        if (record(o)) seen.add(o.value);
      }
    }
  }
  return errors;
}

function valueError(f, value) {
  if (['integer', 'decimal'].includes(f.type)) {
    if (!numeric(value) || Math.abs(value) > CUSTOM_LIMITS.numeric || value < (f.min ?? -CUSTOM_LIMITS.numeric) || value > (f.max ?? CUSTOM_LIMITS.numeric)) return 'Angka di luar batas';
    if (f.type === 'integer' && !Number.isSafeInteger(value)) return 'Harus bilangan bulat';
    const scale = 10 ** (f.precision ?? CUSTOM_LIMITS.precision);
    if (f.type === 'decimal' && Math.abs(value * scale - Math.round(value * scale)) > 1e-5) return 'Presisi desimal melebihi batas';
  } else if (f.type === 'boolean') {
    if (typeof value !== 'boolean') return 'Harus Ya atau Tidak';
  } else if (f.type === 'date') {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) return 'Tanggal kalender tidak valid';
  } else if (f.type === 'select') {
    if (!f.options.some((o) => o.value === value)) return 'Pilihan tidak valid';
  } else if (f.type === 'multiselect') {
    if (!Array.isArray(value) || value.length > CUSTOM_LIMITS.options || new Set(value).size !== value.length || value.some((v) => !f.options.some((o) => o.value === v))) return 'Pilihan jamak tidak valid';
  } else {
    if (typeof value !== 'string' || value.length > (f.maxLen ?? (f.type === 'textarea' ? 4000 : 2000))) return 'Teks melebihi batas atau bukan teks';
    if (f.type === 'url') {
      try { if (!['http:', 'https:'].includes(new URL(value).protocol)) return 'URL harus http(s)'; } catch { return 'URL tidak valid'; }
    }
  }
  return null;
}

export function mergeCustomValues(fields, before = {}, patch = {}, mode = 'draft') {
  const definitionErrors = validateCustomFields(fields);
  if (definitionErrors.length) invalid(definitionErrors);
  if (before == null) before = {};
  if (!record(before) || !record(patch) || bytes(patch) > CUSTOM_LIMITS.valueBytes) invalid([issue('customValues', 'Jawaban kustom tidak valid atau melebihi batas')]);
  const byKey = new Map(fields.map((f) => [f.key, f]));
  const errors = [];
  for (const key of Object.keys(before)) if (!byKey.has(key)) errors.push(issue(`customValues.${key}`, 'Jawaban tersimpan tidak memiliki definisi field; data tidak ditimpa'));
  for (const key of Object.keys(patch)) if (!byKey.has(key)) errors.push(issue(`customValues.${key}`, 'Field tidak dikenal'));
  const result = {};
  for (const f of fields) {
    let v = own(patch, f.key) ? patch[f.key] : before[f.key];
    if (typeof v === 'string') v = v.trim();
    if (empty(v)) {
      if (mode === 'submit' && f.required) errors.push(issue(`customValues.${f.key}`, `${f.label} wajib diisi`));
      continue;
    }
    const error = valueError(f, v);
    if (error) errors.push(issue(`customValues.${f.key}`, `${f.label}: ${error}`));
    else result[f.key] = v;
  }
  if (bytes(result) > CUSTOM_LIMITS.valueBytes) errors.push(issue('customValues', 'Total jawaban melebihi 16 KiB'));
  if (errors.length) invalid(errors);
  return result;
}

const roles = { per_capaian: [], per_jumlah: ['quantity'], per_kategori: ['category'], persentase: ['numerator', 'denominator'], per_tingkat_wilayah: ['category'], per_jenjang: ['category', 'quantity'] };
const columns = { jumlah: 'number', pembilang: 'number', penyebut: 'number', tingkatWilayah: 'select', jenjangPendidikan: 'select' };
export function validateScoringConfig(method, fields, config) {
  if (!own(roles, method)) return [issue('tipeFormula', 'Metode tidak dikenal')];
  if (config == null && !['per_jumlah', 'per_kategori'].includes(method)) return [];
  if (!record(config)) return [issue('scoringConfig', 'Pilih sumber perhitungan')];
  const errors = [];
  const allowed = new Set([...roles[method], ...(method === 'per_kategori' ? ['quantity', 'weights'] : []), ...(['per_tingkat_wilayah', 'per_jenjang'].includes(method) ? ['categoryMap'] : [])]);
  if (Object.keys(config).some((k) => !allowed.has(k))) errors.push(issue('scoringConfig', 'Parameter formula tidak dikenal'));
  for (const role of new Set([...roles[method], ...(config.quantity ? ['quantity'] : [])])) {
    const ref = config[role];
    let type, required = false;
    if (record(ref) && ref.source === 'custom') {
      const f = fields.find((f) => f.source === 'custom' && f.key === ref.key);
      type = f?.type; required = f?.required;
    } else if (record(ref) && ref.source === 'builtin' && own(columns, ref.key)) {
      type = columns[ref.key];
      required = fields.some((f) => f.key === ref.key && f.required) || (['pembilang', 'penyebut'].includes(ref.key) && fields.some((f) => f.key === 'ratio' && f.required));
    }
    const numericTypes = ['numerator', 'denominator'].includes(role) ? ['number', 'integer'] : ['number', 'integer', 'decimal'];
    if (!required || !(role === 'category' ? type === 'select' : numericTypes.includes(type))) errors.push(issue(`scoringConfig.${role}`, 'Sumber wajib ada, wajib diisi dan bertipe sesuai'));
    if (role === 'category' && ref?.source === 'builtin' && ((method === 'per_tingkat_wilayah' && ref.key !== 'tingkatWilayah') || (method === 'per_jenjang' && ref.key !== 'jenjangPendidikan'))) errors.push(issue('scoringConfig.category', 'Kolom kategori tidak sesuai metode'));
  }
  if (method === 'per_kategori') {
    const f = fields.find((f) => f.key === config.category?.key && f.source === 'custom' && f.type === 'select');
    if (!f || !record(config.weights) || f.options.some((o) => !numeric(config.weights[o.value]) || config.weights[o.value] < 0 || config.weights[o.value] > 1e6) || Object.keys(config.weights).some((key) => !f.options.some((o) => o.value === key))) errors.push(issue('scoringConfig.weights', 'Lengkapi bobot untuk semua ID opsi kategori'));
  }
  if (['per_tingkat_wilayah', 'per_jenjang'].includes(method) && config.category?.source === 'custom') {
    const expected = method === 'per_jenjang' ? ['s1', 's2', 's3'] : ['kabupaten', 'provinsi', 'nasional', 'internasional'];
    const f = fields.find((f) => f.key === config.category.key);
    if (!record(config.categoryMap) || !f?.options || f.options.some((o) => !own(config.categoryMap, o.value) || !expected.includes(config.categoryMap[o.value]))) errors.push(issue('scoringConfig.categoryMap', 'Lengkapi pemetaan kategori kanonis'));
  }
  return errors;
}

function source(item, ref) {
  if (!record(ref)) throw new HttpError(400, 'INVALID_SCORE_SOURCE', 'Sumber skor belum dipilih');
  const bag = ref.source === 'custom' ? item.customValues : item;
  if (!record(bag) || !own(bag, ref.key) || empty(bag[ref.key])) throw new HttpError(400, 'INVALID_SCORE_SOURCE', 'Nilai sumber skor belum tersedia');
  return bag[ref.key];
}
const scoreNumber = (v) => {
  if (!numeric(v) || v < 0 || v > CUSTOM_LIMITS.score) throw new HttpError(400, 'INVALID_SCORE_VALUE', 'Angka skor tidak valid atau melebihi batas');
  return v;
};
export function scoreCustomItems(method, items, config, weights) {
  const quantity = (item) => scoreNumber(source(item, config.quantity));
  const category = (item) => {
    const value = source(item, config.category);
    return config.categoryMap ? config.categoryMap[value] : value;
  };
  let result;
  if (method === 'per_capaian') result = items.length * scoreNumber(weights.nilaiBobot);
  else if (method === 'per_jumlah') result = items.reduce((sum, item) => sum + quantity(item), 0) * scoreNumber(weights.nilaiBobot);
  else if (method === 'persentase') {
    let a = 0, b = 0;
    for (const item of items) {
      const n = scoreNumber(source(item, config.numerator)), d = scoreNumber(source(item, config.denominator));
      if (!Number.isInteger(n) || !Number.isInteger(d) || n > d) throw new HttpError(400, 'INVALID_SCORE_RATIO', 'Pembilang/penyebut harus integer dan pembilang tidak melebihi penyebut');
      a += n; b += d;
    }
    result = b ? a / b * scoreNumber(weights.nilaiBobot) : 0;
  } else if (['per_kategori', 'per_tingkat_wilayah', 'per_jenjang'].includes(method)) {
    const map = method === 'per_kategori' ? config.weights : method === 'per_jenjang' ? weights.bobotJenjang : weights.bobotTingkatWilayah;
    result = items.reduce((sum, item) => {
      const key = category(item);
      if (!record(map) || !own(map, key)) throw new HttpError(400, 'INVALID_SCORE_CATEGORY', 'Bobot kategori belum tersedia');
      return sum + (config.quantity ? quantity(item) : 1) * scoreNumber(map[key]);
    }, 0);
  } else throw new HttpError(400, 'INVALID_SCORE_METHOD', 'Metode tidak dikenal');
  return scoreNumber(result);
}

import { customPayload, customError, fieldValue, isEmpty } from '../lib/customFields';
// Daftar kelompok dan helper formulir; metadata indikator berasal dari API periode.
export const KELOMPOKS = ['RA', 'MI', 'MTs', 'MA'];

export const kelompokLabel = (value) => value === 'MTs' ? 'MTS' : value;

export const JENJANG_OPTIONS = KELOMPOKS.map((value) => ({
  value,
  label: `${kelompokLabel(value)} — ${{ RA: 'Raudhatul Athfal', MI: 'Madrasah Ibtidaiyah', MTs: 'Madrasah Tsanawiyah', MA: 'Madrasah Aliyah' }[value]}`,
}));

export function normalizeKelompok(value) {
  if (typeof value !== 'string') return null;
  const match = /^(RA|MI|MTS|MA)(?:\s+(?:Negeri|Swasta))?$/i.exec(value.trim());
  return match ? KELOMPOKS.find((k) => k.toUpperCase() === match[1].toUpperCase()) : null;
}

/**
 * Field formulir berasal dari metadata API periode.
 * key = nama field persis di schema SubmissionItem (backend/prisma/schema.prisma).
 * Nilai select memakai enum schema lowercase (tingkatWilayah, jenjangPendidikan, statusPegawai).
 * type: text | textarea | number | select | ratio
 */

export const TINGKAT_WILAYAH_OPTIONS = [
  { value: 'kabupaten', label: 'Kabupaten' },
  { value: 'provinsi', label: 'Provinsi' },
  { value: 'nasional', label: 'Nasional' },
  { value: 'internasional', label: 'Internasional' },
];

export const JENJANG_PENDIDIKAN_OPTIONS = [
  { value: 's1', label: 'S1' },
  { value: 's2', label: 'S2' },
  { value: 's3', label: 'S3' },
];

/** Teks kewajiban bukti tahun berjalan (dipakai form operator & halaman publik). */
export const BUKTI_TAHUN_BERJALAN = 'Wajib bukti tahun berjalan';

export function fieldKeysFor(fields = []) {
  const keys = new Set();
  for (const f of fields) {
    if (f.source === 'custom') continue;
    if (f.type === 'ratio') {
      keys.add('pembilang');
      keys.add('penyebut');
    } else {
      keys.add(f.key);
    }
  }
  return keys;
}

/** Baris kosong sesuai config — hanya berisi key yang relevan untuk indikator tsb. */
export function emptyRowFor(fields = []) {
  const row = {};
  for (const f of fields) {
    if (f.source === 'custom') { row.customValues ??= {}; row.customValues[f.key] = f.type === 'multiselect' ? [] : null; continue; }
    if (f.type === 'ratio') {
      row.pembilang = '';
      row.penyebut = '';
    } else if (f.type === 'number') {
      row[f.key] = '';
    } else {
      row[f.key] = '';
    }
  }
  return row;
}

export function hasFormContent(fields, row) {
  const filled = (v) => !isEmpty(typeof v === 'string' ? v.trim() : v);
  return fields.some((f) => f.type === 'ratio' ? filled(row.pembilang) || filled(row.penyebut) : filled(fieldValue(f, row)));
}

/**
 * Validasi baris capaian (client-side, rule config-driven) → object error per key (kosong jika valid).
 *
 * @param {Array} fields  konfigurasi field periode dari API
 * @param {object} row   baris yang sedang diedit
 * @param {object} [opts]
 * @param {'submit'|'draft'} [opts.mode='submit'] — 'draft' hanya memeriksa
 *   field yang sudah diisi (bentuk/tipe), tidak mewajibkan kolom kosong.
 *   Backend punya aturan yang sama: validateItem(kode, payload, mode) —
 *   'draft' meloloskan field kosong, 'submit' mewajibkannya. Tanpa mode ini,
 *   UI memblokir Simpan Draft lebih dulu dan fitur draft tidak pernah
 *   sampai ke server.
 */
export function validateRow(fields, row, { mode = 'submit' } = {}) {
  const isSubmit = mode === 'submit';
  const errors = {};
  for (const f of fields) {
    if (f.source === 'custom') { const error = customError(f, row.customValues?.[f.key], mode); if (error) errors[f.key] = error; continue; }
    if (f.type === 'ratio') {
      const p = Number(row.pembilang);
      const s = Number(row.penyebut);
      if (!isSubmit && (row.pembilang === '' || row.penyebut === '')) {
        continue; // draft: ratio kosong tidak dihitung
      }
      if (row.pembilang === '' || row.penyebut === '' || !Number.isFinite(p) || !Number.isFinite(s)) {
        errors.ratio = 'Pembilang dan penyebut wajib diisi angka.';
      } else if (!Number.isInteger(p) || !Number.isInteger(s)) {
        errors.ratio = 'Harus bilangan bulat.';
      } else if (p < 0 || s < 0) {
        errors.ratio = 'Angka tidak boleh negatif.';
      } else if (s === 0 && p > 0) {
        errors.ratio = 'Jika penyebut 0, pembilang harus 0.';
      } else if (p > s) {
        errors.ratio = 'Pembilang tidak boleh melebihi penyebut.';
      }
      continue;
    }
    const v = String(row[f.key] ?? '').trim();
    if (!v) {
      if (f.required && isSubmit) errors[f.key] = `${f.label} wajib diisi.`;
      continue; // draft: kolom kosong dilewati, tidak jadi error
    }
    if (f.key === 'linkBukti' && v && !/^https?:\/\//i.test(v)) {
      errors[f.key] = 'Link bukti harus URL http(s).';
      continue;
    }
    if (f.type === 'number') {
      const n = Number(v);
      if (!Number.isInteger(n) || n < (f.min ?? 1)) {
        errors[f.key] = `${f.label} harus integer minimal ${f.min ?? 1}.`;
      } else if (n > 10000) {
        errors[f.key] = `${f.label} maksimal 10000.`;
      }
    }
  }
  return errors;
}

/** Bangun payload API (field schema saja, enum lowercase) dari row state UI. */
export function buildPayload(fields, row) {
  const allowed = fieldKeysFor(fields);
  const payload = {};
  for (const key of allowed) {
    let v = row[key];
    if (key === 'jumlah') {
      v = v === '' ? undefined : Number(v);
      if (v !== undefined) payload[key] = v;
      continue;
    }
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      payload[key] = typeof v === 'string' ? v.trim() : v;
    }
  }
  if (fields.some((f) => f.source === 'custom')) payload.customValues = customPayload(fields, row.customValues);
  return payload;
}

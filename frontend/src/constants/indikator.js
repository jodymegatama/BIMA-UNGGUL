/**
 * Konstanta 9 Indikator Mutu — PRD Section 11 (bukan mock)
 * Dipakai sebagai skeleton mapping di UI; nilai skor riil dari backend.
 *
 * Revisi 2026-09-14 (spesifikasi baru user): nama indikator + label field + basis bukti TKA/ANBK,
 * istilah "Murid" diseragamkan, dan penyebut ratio 0 diizinkan (0 dari 0 = 0%).
 * Slug/kode/tipeFormula TIDAK berubah — kontrak API & skor tetap sama.
 */
export const INDIKATORS = [
  { kode: 'diklat', nama: 'Diklat Pendidik dan Tenaga Kependidikan', short: 'Diklat' },
  { kode: 'penghargaan_individu', nama: 'Penghargaan Individu Pendidik dan Tenaga Kependidikan', short: 'Pengh. Individu' },
  { kode: 'penghargaan_institusi', nama: 'Penghargaan Institusi', short: 'Pengh. Institusi' },
  { kode: 'prestasi_siswa', nama: 'Prestasi Siswa', short: 'Prestasi Siswa' },
  { kode: 'lulus_jenjang_lanjutan', nama: 'Jumlah Pendidik dan Tenaga Kependidikan Lulus Jenjang Lanjutan', short: 'Lulus Jenjang' },
  { kode: 'rapor_rata_rata', nama: 'Nilai Rata-rata Murid > 85', short: 'Nilai > 85' },
  { kode: 'siswa_lanjutan_unggulan', nama: 'Murid Lanjutan Unggulan', short: 'Lanjutan Unggulan' },
  { kode: 'giat_inovatif', nama: 'Giat Inovatif dalam Pengembangan Mutu Madrasah', short: 'Giat Inovatif' },
  { kode: 'rasio_penerimaan', nama: 'Rasio Penerimaan Murid Baru', short: 'Rasio' },
];

export const KELOMPOKS = [
  'MI Negeri', 'MI Swasta',
  'MTs Negeri', 'MTs Swasta',
  'MA Negeri', 'MA Swasta',
];

/**
 * INDIKATOR_FIELDS — konfigurasi field dinamis per indikator (PRD §11).
 * key = nama field persis di schema SubmissionItem (backend/prisma/schema.prisma).
 * Nilai select memakai enum schema lowercase (tingkatWilayah, jenjangPendidikan, statusPegawai).
 * type: text | textarea | number | select | ratio
 */
const STATUS_PEGAWAI_OPTIONS = [
  { value: 'asn', label: 'ASN' },
  { value: 'non_asn', label: 'non-ASN' },
];

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

const F_NAMA_KEGIATAN = (label, placeholder) => ({ key: 'namaKegiatan', label, type: 'text', required: true, placeholder });
const F_INSTITUSI = (label = 'Nama Institusi Penerbit/Penyelenggara') => ({ key: 'institusi', label, type: 'text', required: true, placeholder: 'Contoh: Balai Diklat Keagamaan Surabaya' });
const F_LINK_BUKTI = { key: 'linkBukti', label: 'Link Bukti Fisik', type: 'text', required: true, placeholder: 'https://drive.google.com/...', help: `${BUKTI_TAHUN_BERJALAN} & akses publik (Anyone with link)` };
const F_CATATAN = { key: 'catatan', label: 'Catatan Tambahan', type: 'textarea', required: false, placeholder: 'Catatan...' };

export const INDIKATOR_FIELDS = {
  diklat: [
    F_NAMA_KEGIATAN('Nama Diklat', 'Contoh: Diklat Kurikulum Merdeka Angkatan 3'),
    F_INSTITUSI('Nama Institusi Penyelenggara Diklat'),
    { key: 'namaPeserta', label: 'Nama ASN/non-ASN Pelaksana Diklat', type: 'text', required: true, placeholder: 'Nama lengkap pelaksana' },
    { key: 'statusPegawai', label: 'Status Pegawai', type: 'select', required: true, options: STATUS_PEGAWAI_OPTIONS, placeholder: 'Pilih status pegawai' },
    F_LINK_BUKTI,
    F_CATATAN,
  ],
  penghargaan_individu: [
    F_NAMA_KEGIATAN('Nama Penghargaan', 'Contoh: Guru Berprestasi Kab. Pasuruan'),
    F_INSTITUSI('Nama Institusi Penyelenggara Penghargaan'),
    { key: 'namaPeserta', label: 'Nama ASN/non-ASN Penerima Penghargaan', type: 'text', required: true, placeholder: 'Nama lengkap penerima' },
    { key: 'statusPegawai', label: 'Status Pegawai', type: 'select', required: true, options: STATUS_PEGAWAI_OPTIONS, placeholder: 'Pilih status pegawai' },
    F_LINK_BUKTI,
    F_CATATAN,
  ],
  penghargaan_institusi: [
    F_NAMA_KEGIATAN('Nama Penghargaan', 'Contoh: Madrasah Adiwiyata Tingkat Provinsi'),
    F_INSTITUSI('Institusi Penerbit Penghargaan'),
    { key: 'tingkatWilayah', label: 'Tingkat Wilayah Prestasi', type: 'select', required: true, options: TINGKAT_WILAYAH_OPTIONS, placeholder: 'Pilih tingkat wilayah' },
    F_LINK_BUKTI,
    F_CATATAN,
  ],
  prestasi_siswa: [
    F_NAMA_KEGIATAN('Nama Penghargaan atau Prestasi', 'Contoh: Juara 1 Olimpiade Matematika'),
    F_INSTITUSI('Nama Institusi Penerbit Penghargaan'),
    { key: 'namaPeserta', label: 'Nama Murid', type: 'text', required: true, placeholder: 'Nama lengkap murid' },
    { key: 'tingkatWilayah', label: 'Tingkat Wilayah Prestasi', type: 'select', required: true, options: TINGKAT_WILAYAH_OPTIONS, placeholder: 'Pilih tingkat wilayah' },
    F_LINK_BUKTI,
    F_CATATAN,
  ],
  lulus_jenjang_lanjutan: [
    { key: 'jenjangPendidikan', label: 'Jenjang Pendidikan', type: 'select', required: true, options: JENJANG_PENDIDIKAN_OPTIONS, placeholder: 'Pilih jenjang (S1/S2/S3)' },
    { key: 'jumlah', label: 'Jumlah ASN', type: 'number', required: true, min: 1, placeholder: 'Contoh: 2', help: 'Integer lebih dari 0' },
    F_LINK_BUKTI,
    F_CATATAN,
  ],
  rapor_rata_rata: [
    {
      key: 'ratio',
      label: 'Hasil TKA/ANBK Murid > 85',
      type: 'ratio',
      required: true,
      pembilangLabel: 'Murid > 85',
      penyebutLabel: 'Total murid',
      help: 'Format X dari Y = Z% — dihitung otomatis (0 dari 0 = 0%)',
    },
    F_LINK_BUKTI,
    F_CATATAN,
  ],
  siswa_lanjutan_unggulan: [
    F_NAMA_KEGIATAN('Nama Universitas atau Sekolah Unggulan', 'Contoh: Universitas Airlangga'),
    { key: 'namaPeserta', label: 'Nama Murid', type: 'text', required: true, placeholder: 'Nama lengkap murid', help: 'Bukti kelulusan tahun berjalan' },
    F_LINK_BUKTI,
    F_CATATAN,
  ],
  giat_inovatif: [
    { ...F_NAMA_KEGIATAN('Nama Giat Inovatif', 'Contoh: Gerakan Literasi Digital Madrasah'), help: 'Lampirkan laporan kegiatan (bukti tahun berjalan)' },
    F_LINK_BUKTI,
    F_CATATAN,
  ],
  rasio_penerimaan: [
    {
      key: 'ratio',
      label: 'Murid diterima dari jumlah pendaftar tahun berjalan',
      type: 'ratio',
      required: true,
      pembilangLabel: 'Murid diterima',
      penyebutLabel: 'Jumlah pendaftar',
      help: 'Format X dari Y = Z% — dihitung otomatis (0 dari 0 = 0%)',
    },
    F_LINK_BUKTI,
    F_CATATAN,
  ],
};

/** Field keys yang boleh dikirim ke API per indikator (whitelist payload). */
export function fieldKeysFor(kode) {
  const fields = INDIKATOR_FIELDS[kode] || [];
  const keys = new Set();
  for (const f of fields) {
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
export function emptyRowFor(kode) {
  const row = {};
  for (const f of INDIKATOR_FIELDS[kode] || []) {
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

/** Validasi satu baris berdasarkan config → object error per key (kosong jika valid). */
export function validateRow(kode, row) {
  const errors = {};
  for (const f of INDIKATOR_FIELDS[kode] || []) {
    if (f.type === 'ratio') {
      const p = Number(row.pembilang);
      const s = Number(row.penyebut);
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
    if (f.required && !v) {
      errors[f.key] = `${f.label} wajib diisi.`;
      continue;
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
export function buildPayload(kode, row) {
  const allowed = fieldKeysFor(kode);
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
  return payload;
}

export default INDIKATORS;

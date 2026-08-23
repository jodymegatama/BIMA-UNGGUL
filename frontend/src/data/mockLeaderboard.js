/**
 * NOTE: File ini dipertahankan sebagai data tiruan (mock/fallback)
 * untuk keperluan Storybook, UI testing, dan pengembangan offline.
 * Jalur produksi aplikasi utama 100% menggunakan API Backend real-time.
 */
export const NAMES = {
  'MI Negeri': [
    'MI Negeri Bangil',
    'MI Negeri Pandaan',
    'MI Negeri Purwosari',
    'MI Negeri Kejayan',
    'MI Negeri Pasrepan',
    'MI Negeri Gondangwetan',
    'MI Negeri Winongan',
    'MI Negeri Grati',
    'MI Negeri Lekok',
    'MI Negeri Nguling',
    'MI Negeri Sukorejo',
    'MI Negeri Prigen',
    'MI Negeri Gempol',
    'MI Negeri Beji',
    'MI Negeri Kraton',
    'MI Negeri Pohjentrek',
  ],
  'MI Swasta': [
    'MI Darut Taqwa Bangil',
    'MI Miftahul Ulum Pandaan',
    'MI Nurul Huda Purwosari',
    'MI Al Hikmah Kejayan',
    'MI Bahrul Ulum Pasrepan',
    'MI Hidayatul Mubtadiin Gondangwetan',
    'MI Salafiyah Winongan',
    'MI Raudlatul Ulum Grati',
    'MI Al Falah Lekok',
    'MI Nurul Jadid Nguling',
    'MI Darussalam Sukorejo',
    'MI Al Azhar Prigen',
    'MI Khoiriyah Gempol',
    'MI Al Munawwaroh Beji',
  ],
  'MTs Negeri': [
    'MTs Negeri 1 Pasuruan',
    'MTs Negeri 2 Pasuruan',
    'MTs Negeri Bangil',
    'MTs Negeri Pandaan',
    'MTs Negeri Purwosari',
    'MTs Negeri Grati',
    'MTs Negeri Kraton',
    'MTs Negeri Sukorejo',
    'MTs Negeri Prigen',
    'MTs Negeri Gempol',
    'MTs Negeri Lekok',
    'MTs Negeri Winongan',
    'MTs Negeri Pohjentrek',
    'MTs Negeri Nguling',
  ],
  'MTs Swasta': [
    'MTs Darul Ulum Pandaan',
    'MTs Al Yasini Areng-Areng',
    'MTs Zainul Hasan Genggong',
    'MTs Al Anwar Bangil',
    'MTs Sidogiri Kraton',
    'MTs Salafiyah Syafiiyah Sukorejo',
    'MTs Roudlotul Banat Bangil',
    'MTs Maqomul Ulum Grati',
    'MTs Nurul Jadid Paiton',
    'MTs Mambaul Ulum Nguling',
    'MTs Al Kholil Gempol',
    'MTs Darut Taqwa Gempol',
  ],
  'MA Negeri': [
    'MAN 1 Pasuruan',
    'MAN 2 Pasuruan',
    'MAN Bangil',
    'MAN Pandaan',
    'MA Negeri Grati',
    'MA Negeri Kraton',
    'MA Negeri Purwosari',
  ],
  'MA Swasta': [
    'MA Zainul Hasan Genggong',
    'MA Darul Ulum Pandaan',
    'MA Al Yasini Wonorejo',
    'MA Salafiyah Syafiiyah Sukorejo',
    'MA Sidogiri Pasuruan',
    'MA Roudlotus Sholihin Bangil',
    'MA Al Anwar Sarang',
    'MA Mambaul Ulum Nguling',
    'MA Nurul Jadid Grati',
    'MA Darut Taqwa Sengonagung',
  ],
};

export function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function buildMock(kelompok) {
  const list = NAMES[kelompok] || [];
  const base = 920;
  return list
    .map((nama, i) => {
      let skor = base - i * 18 - Math.floor(Math.random() * 6);
      if (i === 5 || i === 6) skor = 842;
      const approved = i === 5 ? 24 : i === 6 ? 22 : 18 - Math.floor(i / 3) + Math.floor(Math.random() * 3);
      const bmuId = `BMU-${String(100000 + i * 137 + kelompok.length * 11).slice(-6)}`;
      const jenjang = kelompok.split(' ')[0];
      const status = kelompok.includes('Negeri') ? 'Negeri' : 'Swasta';
      const updatedAt = new Date(Date.now() - i * 86400000 - Math.floor(Math.random() * 3600000)).toISOString();
      const jumlahSiswa = 120 + Math.floor(Math.random() * 320);
      const alamat = `Jl. Raya ${kelompok} No. ${i + 1}, Kec. ${nama.split(' ').slice(-1)[0]}, Kab. Pasuruan`;
      return {
        rank: i + 1,
        nama,
        slug: slugify(nama),
        skor,
        approved,
        bmuId,
        jenjang,
        status,
        kelompok,
        updatedAt,
        jumlahSiswa,
        alamat,
      };
    })
    .sort((a, b) => {
      if (b.skor !== a.skor) return b.skor - a.skor;
      if (b.approved !== a.approved) return b.approved - a.approved;
      if (new Date(a.updatedAt) - new Date(b.updatedAt) !== 0) return new Date(a.updatedAt) - new Date(b.updatedAt);
      return a.bmuId.localeCompare(b.bmuId);
    })
    .map((r, idx) => ({ ...r, rank: idx + 1 }));
}

export const MOCK = Object.fromEntries(Object.keys(NAMES).map((k) => [k, buildMock(k)]));

// flat lookup by slug
const FLAT = Object.values(MOCK).flat();
export const MOCK_BY_SLUG = Object.fromEntries(FLAT.map((m) => [m.slug, m]));

export function getMadrasahBySlug(slug) {
  return MOCK_BY_SLUG[slug] || null;
}

// --- Indikator definitions (PRD §11) ---
export const INDIKATORS = [
  { kode: 'diklat', nama: 'Diklat Tenaga Pendidik', short: 'Diklat' },
  { kode: 'penghargaan_individu', nama: 'Penghargaan Individu', short: 'Pengh. Individu' },
  { kode: 'penghargaan_institusi', nama: 'Penghargaan Institusi', short: 'Pengh. Institusi' },
  { kode: 'prestasi_siswa', nama: 'Prestasi Siswa', short: 'Prestasi Siswa' },
  { kode: 'lulus_jenjang_lanjutan', nama: 'Lulus Jenjang Lanjutan', short: 'Lulus Jenjang' },
  { kode: 'rapor_rata_rata', nama: 'Rapor Rata-rata >85', short: 'Rapor >85' },
  { kode: 'siswa_lanjutan_unggulan', nama: 'Siswa Lanjutan Unggulan', short: 'Lanjutan Unggulan' },
  { kode: 'giat_inovatif', nama: 'Giat Inovatif', short: 'Giat Inovatif' },
  { kode: 'rasio_penerimaan', nama: 'Rasio Penerimaan', short: 'Rasio' },
];

// Generate skor per indikator that sums roughly to total skor (for chart/table)
export function buildIndikatorSkor(madrasah) {
  // deterministic pseudo-random based on bmuId
  let seed = parseInt(madrasah.bmuId.slice(-4), 10) || 1234;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const weights = [0.14, 0.12, 0.13, 0.15, 0.11, 0.09, 0.1, 0.08, 0.08];
  const total = madrasah.skor;
  const raw = weights.map((w) => Math.max(8, Math.round(total * w * (0.85 + rand() * 0.3))));
  const sum = raw.reduce((a, b) => a + b, 0);
  const factor = total / sum;
  return INDIKATORS.map((ind, i) => ({
    ...ind,
    skor: Math.round(raw[i] * factor),
  }));
}

// Mock prestasi terverifikasi — TANPA link bukti (PRD wajib)
export function buildPrestasi(madrasah) {
  let seed = parseInt(madrasah.bmuId.slice(-4), 10) + 777;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const tingkatOptions = ['Kabupaten', 'Provinsi', 'Nasional', 'Internasional'];
  const institusiPool = ['Kemenag Kab. Pasuruan', 'Kemenag Prov. Jatim', 'Kemdikbud', 'LIPI', 'UNESA', 'Universitas Brawijaya'];
  const prestasiPool = [
    { nama: 'Juara 1 Olimpiade Sains Madrasah', siswa: 'Ahmad Fauzi', tingkat: 'Kabupaten' },
    { nama: 'Juara 2 MHQ Tingkat Provinsi', siswa: 'Siti Aisyah', tingkat: 'Provinsi' },
    { nama: 'Medali Emas KSM Nasional', siswa: 'Muhammad Rizki', tingkat: 'Nasional' },
    { nama: 'Penghargaan Madrasah Adiwiyata', institusi: 'Dinas LH Kab. Pasuruan', tingkat: 'Kabupaten' },
    { nama: 'Diklat Kurikulum Merdeka', pelaksana: 'Balai Diklat Keagamaan Surabaya', tingkat: null },
    { nama: 'Guru Berprestasi Tingkat Nasional', pelaksana: 'Kemenag RI', tingkat: 'Nasional' },
    { nama: 'Lolos SNBP Universitas Airlangga', siswa: 'Naila Putri', tingkat: null },
    { nama: 'Juara Harapan 1 Robotik', siswa: 'Tim Robotik', tingkat: 'Provinsi' },
  ];

  const count = 5 + Math.floor(rand() * 6);
  const list = [];
  for (let i = 0; i < count; i++) {
    const p = prestasiPool[Math.floor(rand() * prestasiPool.length)];
    const tahun = 2023 + Math.floor(rand() * 3);
    // map to indikator secara pseudo-random
    const ind = INDIKATORS[Math.floor(rand() * INDIKATORS.length)];
    const tingkat = p.tingkat || tingkatOptions[Math.floor(rand() * tingkatOptions.length)];
    list.push({
      id: `${madrasah.bmuId}-${i}`,
      indikatorKode: ind.kode,
      indikatorNama: ind.nama,
      nama: p.nama,
      institusi: p.institusi || p.pelaksana || institusiPool[Math.floor(rand() * institusiPool.length)],
      tingkat,
      tahun,
      siswa: p.siswa || null,
      // NOTE: linkBukti sengaja TIDAK disertakan — PRD melarang di halaman publik
    });
  }
  return list;
}

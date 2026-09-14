import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed for 9 Indikator Mutu...');

  // Data 9 Indikator sesuai PRD Section 11 — revisi 2026-09-14 (spesifikasi baru: nama + istilah "Murid")
  const indikators = [
    {
      kode: '1',
      slug: 'diklat',
      nama: 'Diklat Pendidik dan Tenaga Kependidikan',
      tipeFormula: 'per_capaian',
    },
    {
      kode: '2',
      slug: 'penghargaan_individu',
      nama: 'Penghargaan Individu Pendidik dan Tenaga Kependidikan',
      tipeFormula: 'per_capaian',
    },
    {
      kode: '3',
      slug: 'penghargaan_institusi',
      nama: 'Penghargaan Institusi',
      tipeFormula: 'per_tingkat_wilayah',
    },
    {
      kode: '4',
      slug: 'prestasi_siswa',
      nama: 'Prestasi Siswa',
      tipeFormula: 'per_tingkat_wilayah',
    },
    {
      kode: '5',
      slug: 'lulus_jenjang_lanjutan',
      nama: 'Jumlah Pendidik dan Tenaga Kependidikan Lulus Jenjang Lanjutan',
      tipeFormula: 'per_jenjang',
    },
    {
      kode: '6',
      slug: 'rapor_rata_rata',
      nama: 'Nilai Rata-rata Murid > 85',
      tipeFormula: 'persentase',
    },
    {
      kode: '7',
      slug: 'siswa_lanjutan_unggulan',
      nama: 'Murid Lanjutan Unggulan',
      tipeFormula: 'per_capaian',
    },
    {
      kode: '8',
      slug: 'giat_inovatif',
      nama: 'Giat Inovatif dalam Pengembangan Mutu Madrasah',
      tipeFormula: 'per_capaian',
    },
    {
      kode: '9',
      slug: 'rasio_penerimaan',
      nama: 'Rasio Penerimaan Murid Baru',
      tipeFormula: 'persentase',
    },
  ];

  // Upsert setiap indikator
  for (const indikator of indikators) {
    const created = await prisma.indikator.upsert({
      where: { slug: indikator.slug },
      update: {
        nama: indikator.nama,
        tipeFormula: indikator.tipeFormula,
      },
      create: indikator,
    });
    console.log(`✓ Indikator ${created.kode}: ${created.nama} (${created.tipeFormula})`);
  }

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

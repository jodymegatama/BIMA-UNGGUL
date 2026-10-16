import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const initialAdminEnv = {
  nip: process.env.INITIAL_ADMIN_NIP?.trim(),
  name: process.env.INITIAL_ADMIN_NAME?.trim(),
  email: process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase(),
  password: process.env.INITIAL_ADMIN_PASSWORD,
};

async function seedInitialAdmin() {
  const configured = Object.values(initialAdminEnv).filter((value) => value !== undefined && value !== '').length;
  if (configured === 0) {
    console.log('Initial admin bootstrap skipped (no INITIAL_ADMIN_* variables configured).');
    return;
  }
  if (configured !== Object.keys(initialAdminEnv).length) {
    throw new Error('Set all INITIAL_ADMIN_NIP, INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL, and INITIAL_ADMIN_PASSWORD variables.');
  }

  if (!/^\d{8,18}$/.test(initialAdminEnv.nip)) throw new Error('INITIAL_ADMIN_NIP must contain 8–18 digits.');
  if (initialAdminEnv.name.length < 2 || initialAdminEnv.name.length > 191) throw new Error('INITIAL_ADMIN_NAME must contain 2–191 characters.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(initialAdminEnv.email)) throw new Error('INITIAL_ADMIN_EMAIL must be a valid email address.');
  if (initialAdminEnv.password.length < 12) throw new Error('INITIAL_ADMIN_PASSWORD must contain at least 12 characters.');

  const existingAdmin = await prisma.user.findFirst({ where: { role: 'admin' }, select: { id: true } });
  if (existingAdmin) {
    console.log('Initial admin bootstrap skipped (an admin account already exists).');
    return;
  }

  const conflictingUser = await prisma.user.findFirst({
    where: { OR: [{ nip: initialAdminEnv.nip }, { email: initialAdminEnv.email }] },
    select: { id: true },
  });
  if (conflictingUser) throw new Error('Initial admin NIP or email is already assigned to another account.');

  const passwordHash = await bcrypt.hash(initialAdminEnv.password, 12);
  await prisma.user.create({
    data: {
      nip: initialAdminEnv.nip,
      name: initialAdminEnv.name,
      email: initialAdminEnv.email,
      password: passwordHash,
      role: 'admin',
      status: 'aktif',
    },
  });
  console.log('Initial admin account created.');
}

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
  await seedInitialAdmin();
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

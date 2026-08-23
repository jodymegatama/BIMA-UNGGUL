import { prisma } from './src/db/prisma.js';
import bcrypt from 'bcryptjs';

const adminNip = '199012312345678901';
const adminPass = 'Admin12345';
const operatorNip = '197812345678900010';
const operatorPass = 'Operator123';

async function ensureUser({ nip, name, email, password, role, status }) {
  const hash = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { nip } });
  if (existing) {
    const updated = await prisma.user.update({
      where: { nip },
      data: { password: hash, name, email, role, status },
      select: { nip: true, name: true, role: true, status: true },
    });
    console.log(`Updated: ${updated.nip} | ${updated.name} | ${updated.role} | ${updated.status}`);
    return updated;
  } else {
    const created = await prisma.user.create({
      data: { nip, name, email, password: hash, role, status },
      select: { nip: true, name: true, role: true, status: true },
    });
    console.log(`Created: ${created.nip} | ${created.name} | ${created.role} | ${created.status}`);
    return created;
  }
}

// Admin: aktif
await ensureUser({
  nip: adminNip,
  name: 'Admin Kemenag (Dummy)',
  email: 'admin.dummy@kemenag.go.id',
  password: adminPass,
  role: 'admin',
  status: 'aktif',
});

// Operator yang sudah aktif (untuk langsung login) - butuh madrasahId? buat madrasah dulu jika belum ada
// Cari madrasah pertama atau buat dummy
let madrasah = await prisma.madrasah.findFirst();
if (!madrasah) {
  madrasah = await prisma.madrasah.create({
    data: {
      nomorMadrasah: 'BMU-999001',
      namaMadrasah: 'MI Negeri Dummy',
      jenjang: 'MI',
      statusKepemilikan: 'Negeri',
      jumlahSiswa: 200,
      alamat: 'Jl. Dummy No.1 Pasuruan',
      slug: 'mi-negeri-dummy',
      kelompok: 'MI Negeri',
    },
  });
  console.log(`Created madrasah dummy: ${madrasah.slug}`);
}

const opExisting = await prisma.user.findUnique({ where: { nip: operatorNip } });
const opHash = await bcrypt.hash(operatorPass, 10);
if (opExisting) {
  const u = await prisma.user.update({
    where: { nip: operatorNip },
    data: { password: opHash, name: 'Operator Dummy', email: 'operator.dummy@madrasah.local', role: 'operator', status: 'aktif', madrasahId: madrasah.id },
    select: { nip: true, name: true, role: true, status: true },
  });
  console.log(`Updated operator: ${u.nip} | ${u.status}`);
} else {
  const u = await prisma.user.create({
    data: { nip: operatorNip, name: 'Operator Dummy', email: 'operator.dummy@madrasah.local', password: opHash, role: 'operator', status: 'aktif', madrasahId: madrasah.id },
    select: { nip: true, name: true, role: true, status: true },
  });
  console.log(`Created operator: ${u.nip} | ${u.status}`);
}

// Juga buat satu akun menunggu untuk testing approval
const menungguNip = '199099990000000001';
const menungguHash = await bcrypt.hash('Menunggu123', 10);
const menunggu = await prisma.user.findUnique({ where: { nip: menungguNip } });
if (!menunggu) {
  await prisma.user.create({
    data: {
      nip: menungguNip,
      name: 'Operator Menunggu',
      email: 'menunggu@madrasah.local',
      password: menungguHash,
      role: 'operator',
      status: 'menunggu',
      madrasahData: { nama: 'MI Menunggu Test', jenjang: 'MI', statusKepemilikan: 'Swasta', alamat: 'Jl. Menunggu', jumlahSiswa: 50 },
    },
  });
  console.log(`Created menunggu: ${menungguNip}`);
} else {
  console.log(`Menunggu exists: ${menungguNip} | ${menunggu.status}`);
}

console.log('\n=== AKUN DUMMY SIAP ===');
console.log(`Admin    -> NIP: ${adminNip} | Password: ${adminPass} | role: admin | status: aktif`);
console.log(`Operator -> NIP: ${operatorNip} | Password: ${operatorPass} | role: operator | status: aktif | madrasah: ${madrasah.slug}`);
console.log(`Menunggu -> NIP: ${menungguNip} | Password: Menunggu123 | status: menunggu (untuk test Manajemen Akun)`);
console.log(`\nFrontend: http://localhost:5173/login`);
console.log(`Backend : http://localhost:3000/api/health`);

await prisma.$disconnect();

import { prisma } from '../src/db/prisma.js';
import bcrypt from 'bcryptjs';

// Admin: login tetap via NIP. Operator: login via email (tanpa nip).
const adminNip = '199012312345678901';
const adminPass = 'Admin12345';
const operatorEmail = 'operator.dummy@madrasah.local';
const operatorPass = 'Operator123';

async function ensureAdmin() {
  const hash = await bcrypt.hash(adminPass, 10);
  const existing = await prisma.user.findUnique({ where: { nip: adminNip } });
  if (existing) {
    const updated = await prisma.user.update({
      where: { nip: adminNip },
      data: { password: hash, name: 'Admin Kemenag (Dummy)', email: 'admin.dummy@kemenag.go.id', role: 'admin', status: 'aktif' },
      select: { nip: true, email: true, role: true, status: true },
    });
    console.log('Updated admin: ' + updated.nip + ' | ' + updated.status);
    return updated;
  }
  const created = await prisma.user.create({
    data: { nip: adminNip, name: 'Admin Kemenag (Dummy)', email: 'admin.dummy@kemenag.go.id', password: hash, role: 'admin', status: 'aktif' },
    select: { nip: true, email: true, role: true, status: true },
  });
  console.log('Created admin: ' + created.nip + ' | ' + created.status);
  return created;
}

async function ensureOperator(madrasahId) {
  const hash = await bcrypt.hash(operatorPass, 10);
  const existing = await prisma.user.findUnique({ where: { email: operatorEmail } });
  const data = { password: hash, name: 'Operator Dummy', email: operatorEmail, role: 'operator', status: 'aktif', madrasahId };
  if (existing) {
    const u = await prisma.user.update({ where: { id: existing.id }, data, select: { email: true, role: true, status: true } });
    console.log('Updated operator: ' + u.email + ' | ' + u.status);
    return u;
  }
  const u = await prisma.user.create({ data, select: { email: true, role: true, status: true } });
  console.log('Created operator: ' + u.email + ' | ' + u.status);
  return u;
}

async function ensureMenunggu() {
  const email = 'menunggu@madrasah.local';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Menunggu exists: ' + email + ' | ' + existing.status);
    return existing;
  }
  const hash = await bcrypt.hash('Menunggu123', 10);
  await prisma.user.create({
    data: {
      name: 'Operator Menunggu',
      email,
      password: hash,
      role: 'operator',
      status: 'menunggu',
      madrasahData: { nama: 'MI Menunggu Test', jenjang: 'MI', statusKepemilikan: 'Swasta', alamat: 'Jl. Menunggu', jumlahSiswa: 50 },
    },
  });
  console.log('Created menunggu: ' + email);
}

await ensureAdmin();

// Operator aktif butuh madrasah - cari pertama atau buat dummy
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
  console.log('Created madrasah dummy: ' + madrasah.slug);
}

await ensureOperator(madrasah.id);
await ensureMenunggu();

console.log('');
console.log('=== AKUN DUMMY SIAP ===');
console.log('Admin    -> NIP: ' + adminNip + ' | Password: ' + adminPass + ' | role: admin | status: aktif');
console.log('Operator -> Email: ' + operatorEmail + ' | Password: ' + operatorPass + ' | role: operator | status: aktif | madrasah: ' + madrasah.slug);
console.log('Menunggu -> Email: menunggu@madrasah.local | Password: Menunggu123 | status: menunggu (untuk test Manajemen Akun)');
console.log('');
console.log('Frontend: http://localhost:5173/login');
console.log('Backend : http://localhost:3000/api/health');

await prisma.$disconnect();

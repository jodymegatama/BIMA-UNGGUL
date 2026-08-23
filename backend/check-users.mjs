import { prisma } from './src/db/prisma.js';
const u = await prisma.user.findMany({ select: { nip: true, name: true, role: true, status: true } });
console.log(JSON.stringify(u, null, 2));
await prisma.$disconnect();

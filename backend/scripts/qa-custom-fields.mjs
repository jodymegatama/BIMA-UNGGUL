// Local browser QA fixtures only. Cleanup targets IDs recorded by this script.
import '../src/config/env.js';
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { prisma } from '../src/db/prisma.js';
import { hashPassword } from '../src/services/authService.js';
import { buildExcelBuffer, buildPdfBuffer } from '../src/services/exportService.js';
const dir = new URL('../../dogfood-output/indikator-dinamis/', import.meta.url);
const stateFile = new URL('custom-qa.json', dir);
try {
  if (process.argv[2] === 'setup') {
    // Refuse to overwrite a fixture ledger before its cleanup.
    try { await readFile(stateFile); throw new Error('Fixture ledger exists; cleanup first'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    const stamp = Date.now(), marker = `qa_custom_${stamp}`;
    const password = await hashPassword('CustomFieldsQA-2026!');
    const result = await prisma.$transaction(async (tx) => {
      const period = await tx.periodePenilaian.create({ data: { namaPeriode: `QA Field Kustom ${stamp}`, tahunCapaian: new Date().getFullYear(), tanggalMulai: new Date(Date.now() - 1000), tanggalCutoff: new Date(Date.now() + 86400000), status: 'aktif', configInitialized: true } });
      const school = await tx.madrasah.create({ data: { nomorMadrasah: marker, slug: marker, namaMadrasah: 'Madrasah QA Field Kustom', jenjang: 'RA', kelompok: 'RA', statusKepemilikan: 'Swasta', jumlahSiswa: 20, alamat: 'Fixture lokal' } });
      const admin = await tx.user.create({ data: { name: 'Admin QA Kustom', nip: `9${String(stamp).padStart(17, '0')}`, email: `${marker}_admin@qa.invalid`, password, role: 'admin', status: 'aktif' } });
      const operator = await tx.user.create({ data: { name: 'Operator QA Kustom', email: `${marker}@qa.invalid`, password, role: 'operator', status: 'aktif', madrasahId: school.id } });
      return { marker, periodId: period.id, schoolId: school.id, schoolSlug: school.slug, adminId: admin.id, nip: admin.nip, operatorId: operator.id, email: operator.email };
    });
    await mkdir(dir, { recursive: true }); await writeFile(stateFile, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  } else {
    const state = JSON.parse(await readFile(stateFile, 'utf8'));
    if (process.argv[2] === 'capture') {
      await writeFile(new URL('custom-qa.xlsx', dir), await buildExcelBuffer({ periodeId: state.periodId, kelompok: 'RA' }));
      await writeFile(new URL('custom-qa.pdf', dir), await buildPdfBuffer({ periodeId: state.periodId, kelompok: 'RA', includeDetails: true }));
      console.log('QA exports saved');
    } else if (process.argv[2] === 'cleanup') {
      await prisma.$transaction(async (tx) => {
        await tx.periodePenilaian.delete({ where: { id: state.periodId } });
        await tx.indikator.deleteMany({ where: { kode: state.marker } });
        await tx.user.deleteMany({ where: { id: { in: [state.adminId, state.operatorId] } } });
        await tx.madrasah.delete({ where: { id: state.schoolId } });
      });
      await unlink(stateFile); console.log('QA fixtures cleaned');
    } else throw new Error('Use setup, capture, or cleanup');
  }
} finally { await prisma.$disconnect(); }

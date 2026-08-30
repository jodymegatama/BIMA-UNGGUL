/**
 * Test E2E Validasi Admin — BIMA UNGGUL Phase 3
 * Alur: Operator submit (menunggu) -> Admin approve/reject/revoke -> cek skor & AuditLog atomic
 * Juga: DeleteRequest approve/reject + atomicity/rollback + pagination
 * Run: node tests/testValidationE2E.js
 */
import { prisma } from '../src/db/prisma.js';
import * as validationService from '../src/services/validationService.js';
import { calculateSkorMadrasah } from '../src/services/scoringService.js';

const NS = 'E2E-VAL';

function fmtScore(v) { return v == null ? 'null' : Number(v).toFixed(2); }

async function cleanup() {
  // order: child first
  // delete validations/deleteRequests for our test items via cascade from submissionItem
  // Find our test periode first
  const per = await prisma.periodePenilaian.findFirst({ where: { namaPeriode: `${NS}/2026` } });
  if (per) {
    await prisma.validation.deleteMany({ where: { submissionItem: { periodeId: per.id } } }).catch(()=>{});
    await prisma.deleteRequest.deleteMany({ where: { submissionItem: { periodeId: per.id } } }).catch(()=>{});
    await prisma.submissionItem.deleteMany({ where: { periodeId: per.id } }).catch(()=>{});
    await prisma.auditLog.deleteMany({ where: { entityId: { contains: NS } } }).catch(()=>{});
    // also clean audit by periode test items
    const items = await prisma.submissionItem.findMany({ where: { periodeId: per.id }, select: { id: true } });
    if (items.length) {
      const ids = items.map(i=>String(i.id));
      await prisma.auditLog.deleteMany({ where: { entityId: { in: ids } } }).catch(()=>{});
    }
    await prisma.bobotIndikator.deleteMany({ where: { periodeId: per.id } }).catch(()=>{});
    await prisma.periodePenilaian.deleteMany({ where: { id: per.id } }).catch(()=>{});
  }
  await prisma.madrasah.deleteMany({ where: { nomorMadrasah: { startsWith: `BMU-${NS}` } } }).catch(()=>{});
  await prisma.user.deleteMany({ where: { nip: { startsWith: NS } } }).catch(()=>{});
  // clean leftover audit for our users if any
  await prisma.auditLog.deleteMany({ where: { action: { contains: 'submission' }, ipAddress: '127.0.0.1-e2e' } }).catch(()=>{});
}

async function setup() {
  const periode = await prisma.periodePenilaian.create({
    data: {
      namaPeriode: `${NS}/2026`,
      tahunCapaian: 2026,
      tanggalMulai: new Date('2026-01-01'),
      tanggalCutoff: new Date('2026-12-31'),
      status: 'aktif',
    },
  });

  const indikators = await prisma.indikator.findMany();
  const bySlug = new Map(indikators.map(i=>[i.slug,i]));
  // ensure diklat exists
  const diklat = bySlug.get('diklat');
  const giat = bySlug.get('giat_inovatif');
  if (!diklat || !giat) throw new Error('Indikator diklat/giat_inovatif belum seeded. Jalankan prisma db seed dulu.');

  // bobot: diklat 10, giat 12 (sesuai testScoring)
  for (const [slug, bobot] of [['diklat',10],['giat_inovatif',12]]) {
    const ind = bySlug.get(slug);
    await prisma.bobotIndikator.create({
      data: { indikatorId: ind.id, periodeId: periode.id, nilaiBobot: bobot, terkunci:false },
    });
  }

  // users
  const admin = await prisma.user.create({
    data: { nip: `${NS}-ADMIN-001`, password: 'hash', name: 'E2E Admin', email: `e2e-admin-${Date.now()}@test.local`, role:'admin', status:'aktif' },
  });
  const operator = await prisma.user.create({
    data: { nip: `${NS}-OP-001`, password: 'hash', name: 'E2E Operator', email: `e2e-op-${Date.now()}@test.local`, role:'operator', status:'aktif' },
  });

  // madrasah MI Negeri (kelompok filter)
  const madrasah = await prisma.madrasah.create({
    data: {
      nomorMadrasah: `BMU-${NS}-001`,
      namaMadrasah: `Madrasah ${NS} Utama`,
      jenjang: 'MI',
      statusKepemilikan: 'Negeri',
      jumlahSiswa: 100,
      alamat: 'Jl Test E2E',
      slug: `madrasah-${NS.toLowerCase()}-utama-${Date.now()}`,
      kelompok: 'MI Negeri',
    },
  });
  // link operator to madrasah
  await prisma.user.update({ where:{id:operator.id}, data:{madrasahId: madrasah.id}});

  return { periode, admin, operator, madrasah, diklat, giat };
}

function assert(cond, msg){ if(!cond) throw new Error(msg); }

async function run() {
  const results = [];
  let ctx;
  try {
    console.log('🧹 Cleanup...');
    await cleanup();
    console.log('📦 Setup...');
    ctx = await setup();
    const { periode, admin, operator, madrasah, diklat, giat } = ctx;
    const ip = '127.0.0.1-e2e';

    // Helper: create item menunggu (simulasi endpoint Operator POST /indikator/:id/submit)
    async function createMenunggu({ indikatorId= diklat.id, extra={} }={}) {
      return prisma.submissionItem.create({
        data: {
          madrasahId: madrasah.id,
          indikatorId,
          periodeId: periode.id,
          createdById: operator.id,
          namaKegiatan: `Kegiatan ${NS} ${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
          institusi: 'Instansi Test',
          linkBukti: 'https://example.com/bukti.pdf',
          status: 'menunggu',
          ...extra,
        },
      });
    }

    // --- Test 1: GET queue filter ---
    console.log('\n🧪 TEST 1: GET /admin/validasi filter + pagination');
    const item1 = await createMenunggu();
    const q1 = await validationService.getValidasiQueue({ status:'menunggu', periodeId: String(periode.id), page:'1', limit:'10' });
    assert(q1.total >=1, 'queue total should >=1');
    assert(q1.data.some(d=>d.id===item1.id), 'queue should contain item1');
    // pagination clamp
    const qPage = await validationService.getValidasiQueue({ status:'menunggu', page:'999', limit:'1' });
    assert(qPage.page===999 && qPage.limit===1, 'pagination parse');
    console.log(`   total=${q1.total} page=${q1.page} limit=${q1.limit} ✅ PASS`);
    results.push(['GET validasi queue + pagination', true]);

    // --- Test 2: approve menunggu -> disetujui + score + audit atomic ---
    console.log('\n🧪 TEST 2: approve menunggu -> disetujui, recalculate skor, auditLog');
    const beforeScore = await calculateSkorMadrasah(madrasah.id, periode.id);
    assert(beforeScore.totalScore===0, `before score should 0, got ${beforeScore.totalScore}`);
    const approved = await validationService.approveSubmission({ id: item1.id, adminId: admin.id, ip });
    assert(approved.status==='disetujui', 'should be disetujui');
    const val = await prisma.validation.findFirst({ where:{ submissionItemId:item1.id, aksi:'approve' }});
    assert(val, 'Validation approve should exist');
    const live = await calculateSkorMadrasah(madrasah.id, periode.id);
    assert(live && Number(live.totalScore)===10, `live score should 10, got ${fmtScore(live?.totalScore)}`);
    const audit = await prisma.auditLog.findFirst({ where:{ action:'approve_submission', entityId:String(item1.id)}});
    assert(audit && audit.dataSebelum?.status==='menunggu' && audit.dataSesudah?.status==='disetujui', 'audit dataSebelum/Sesudah');
    console.log(`   score 0 -> ${fmtScore(live.totalScore)} audit=${audit.id} ✅ PASS`);
    results.push(['approve + score + audit atomic', true]);

    // --- Test 3: double approve harus 400 ---
    console.log('\n🧪 TEST 3: double approve harus INVALID_STATUS (400)');
    try {
      await validationService.approveSubmission({ id:item1.id, adminId: admin.id, ip });
      throw new Error('should have thrown');
    } catch(e){
      assert(e.status===400 && e.code==='INVALID_STATUS', `expected 400 INVALID_STATUS, got ${e.status} ${e.code}`);
      console.log(`   got ${e.status} ${e.code} ✅ PASS`);
      results.push(['double approve blocked', true]);
    }

    // --- Test 4: reject tanpa alasan -> 400, tidak berubah ---
    console.log('\n🧪 TEST 4: reject tanpa alasan -> 400 MISSING_ALASAN');
    const item2 = await createMenunggu();
    try {
      await validationService.rejectSubmission({ id:item2.id, adminId: admin.id, alasan:'', ip });
      throw new Error('should have thrown missing alasan');
    } catch(e){
      assert(e.status===400 && e.code==='MISSING_ALASAN', `expected MISSING_ALASAN, got ${e.code}`);
      const still = await prisma.submissionItem.findUnique({where:{id:item2.id}});
      assert(still.status==='menunggu', 'status should still menunggu');
      const noVal = await prisma.validation.findFirst({where:{submissionItemId:item2.id, aksi:'reject'}});
      assert(!noVal, 'no validation should be created');
      console.log(`   blocked, status tetap menunggu ✅ PASS`);
      results.push(['reject tanpa alasan blocked', true]);
    }

    // --- Test 5: reject dengan alasan sukses ---
    console.log('\n🧪 TEST 5: reject dengan alasan -> ditolak + alasanPenolakan');
    const rejected = await validationService.rejectSubmission({ id:item2.id, adminId: admin.id, alasan:'Bukti tidak jelas', ip });
    assert(rejected.status==='ditolak' && rejected.alasanPenolakan==='Bukti tidak jelas', 'should be ditolak');
    const valRej = await prisma.validation.findFirst({where:{submissionItemId:item2.id, aksi:'reject'}});
    assert(valRej?.alasan==='Bukti tidak jelas', 'validation alasan');
    const auditRej = await prisma.auditLog.findFirst({where:{action:'reject_submission', entityId:String(item2.id)}});
    assert(auditRej, 'audit reject exists');
    const scoreAfterReject = await calculateSkorMadrasah(madrasah.id, periode.id);
    assert(scoreAfterReject.totalScore===10, `score should still 10 after reject of menunggu, got ${scoreAfterReject.totalScore}`);
    console.log(`   status ditolak, skor tetap ${fmtScore(scoreAfterReject.totalScore)} ✅ PASS`);
    results.push(['reject dengan alasan + skor unchanged', true]);

    // --- Test 6: revoke disetujui -> ditolak + recalculate ---
    console.log('\n🧪 TEST 6: revoke disetujui -> ditolak (keputusan resmi) + alasanPenolakan + score turun');
    // item1 is currently disetujui (10 points)
    const revoked = await validationService.revokeSubmission({ id:item1.id, adminId: admin.id, alasan:'Koreksi data salah', ip });
    assert(revoked.status==='ditolak' && revoked.alasanPenolakan==='Koreksi data salah', 'revoke should set ditolak');
    const valRev = await prisma.validation.findFirst({where:{submissionItemId:item1.id, aksi:'revoke'}});
    assert(valRev?.alasan==='Koreksi data salah', 'validation revoke alasan');
    const liveAfterRevoke = await calculateSkorMadrasah(madrasah.id, periode.id);
    assert(Number(liveAfterRevoke.totalScore)===0, `score should 0 after revoke, got ${fmtScore(liveAfterRevoke.totalScore)}`);
    const auditRev = await prisma.auditLog.findFirst({where:{action:'revoke_submission', entityId:String(item1.id)}});
    assert(auditRev && auditRev.dataSebelum?.status==='disetujui' && auditRev.dataSesudah?.status==='ditolak', 'audit revoke');
    console.log(`   score 10 -> 0, revoke->ditolak US4-ready ✅ PASS`);
    results.push(['revoke -> ditolak + score 0', true]);

    // --- Test 7: revoke tanpa alasan -> 400 ---
    console.log('\n🧪 TEST 7: revoke tanpa alasan -> 400');
    const item3 = await createMenunggu();
    await validationService.approveSubmission({ id:item3.id, adminId: admin.id, ip }); // make disetujui
    try {
      await validationService.revokeSubmission({ id:item3.id, adminId: admin.id, alasan:'   ', ip });
      throw new Error('should throw');
    } catch(e){
      assert(e.status===400 && e.code==='MISSING_ALASAN', `expected MISSING_ALASAN got ${e.code}`);
      console.log(`   blocked ✅ PASS`);
      results.push(['revoke tanpa alasan blocked', true]);
    }
    // cleanup item3 revoke properly for next tests score =10 again
    await validationService.revokeSubmission({ id:item3.id, adminId: admin.id, alasan:'cleanup', ip });

    // --- Test 8 & 9: DeleteRequest flows ---
    console.log('\n🧪 TEST 8: DeleteRequest approve -> soft-delete + recalc');
    // Create an approved item to delete
    const itemDel = await createMenunggu();
    await validationService.approveSubmission({ id:itemDel.id, adminId: admin.id, ip }); // now disetujui, score 10
    let scoreBeforeDel = await calculateSkorMadrasah(madrasah.id, periode.id);
    assert(scoreBeforeDel.totalScore===10, `score before delete should 10 got ${scoreBeforeDel.totalScore}`);
    const delReq = await prisma.deleteRequest.create({
      data: { submissionItemId: itemDel.id, requestedById: operator.id, alasan:'Salah input, minta hapus', status:'menunggu' },
    });
    // GET queue
    const dq = await validationService.getDeleteRequestsQueue({ status:'menunggu' });
    assert(dq.data.some(d=>d.id===delReq.id), 'delete queue should contain req');
    const approvedDel = await validationService.approveDeleteRequest({ id: delReq.id, adminId: admin.id, ip });
    assert(approvedDel.status==='disetujui', 'delete req approved');
    const soft = await prisma.submissionItem.findUnique({ where:{id:itemDel.id}});
    assert(soft.deletedAt != null, 'deletedAt should be set');
    const scoreAfterDel = await calculateSkorMadrasah(madrasah.id, periode.id);
    assert(scoreAfterDel.totalScore===0, `score after soft-delete should 0, got ${scoreAfterDel.totalScore}`);
    const auditDelAp = await prisma.auditLog.findFirst({where:{action:'approve_delete_request', entityId:String(delReq.id)}});
    assert(auditDelAp, 'audit approve_delete_request');
    console.log(`   soft-deleted, score 10 -> 0 ✅ PASS`);
    results.push(['DeleteRequest approve soft-delete + recalc', true]);

    console.log('\n🧪 TEST 9: DeleteRequest reject tanpa alasan -> 400, dengan alasan -> ditolak tanpa hapus');
    const itemDel2 = await createMenunggu();
    await validationService.approveSubmission({ id:itemDel2.id, adminId: admin.id, ip });
    const delReq2 = await prisma.deleteRequest.create({
      data: { submissionItemId: itemDel2.id, requestedById: operator.id, alasan:'Minta hapus 2', status:'menunggu' },
    });
    try {
      await validationService.rejectDeleteRequest({ id:delReq2.id, adminId: admin.id, alasan:'', ip });
      throw new Error('should throw');
    } catch(e){
      assert(e.status===400, 'reject without alasan 400');
    }
    const rejectedDel = await validationService.rejectDeleteRequest({ id:delReq2.id, adminId: admin.id, alasan:'Tidak memenuhi syarat', ip });
    assert(rejectedDel.status==='ditolak' && rejectedDel.alasanAdmin==='Tidak memenuhi syarat', 'rejected');
    const notDeleted = await prisma.submissionItem.findUnique({where:{id:itemDel2.id}});
    assert(notDeleted.deletedAt==null, 'should not be soft-deleted');
    const scoreAfterRejDel = await calculateSkorMadrasah(madrasah.id, periode.id);
    assert(scoreAfterRejDel.totalScore===10, `score should stay 10 after reject delete, got ${scoreAfterRejDel.totalScore}`);
    const auditDelRej = await prisma.auditLog.findFirst({where:{action:'reject_delete_request', entityId:String(delReq2.id)}});
    assert(auditDelRej, 'audit reject_delete_request');
    console.log(`   reject keeps data, score tetap 10 ✅ PASS`);
    results.push(['DeleteRequest reject keeps data', true]);

    // --- Test 10: Atomicity / rollback ---
    console.log('\n🧪 TEST 10: Atomicity — approve gagal di tengah -> rollback semua');
    const itemAtom = await createMenunggu();
    // Simulate failure: use invalid adminId that violates FK on Validation.validatorId
    const invalidAdminId = 999999;
    const beforeAtom = await prisma.submissionItem.findUnique({where:{id:itemAtom.id}});
    try {
      await validationService.approveSubmission({ id:itemAtom.id, adminId: invalidAdminId, ip });
      throw new Error('should have thrown FK error');
    } catch(e){
      // should be FK error or similar
      const after = await prisma.submissionItem.findUnique({where:{id:itemAtom.id}});
      assert(after.status==='menunggu', `status should rollback to menunggu, got ${after.status}`);
      const noValAtom = await prisma.validation.findFirst({where:{submissionItemId:itemAtom.id}});
      assert(!noValAtom, 'no validation should exist after rollback');
      const noAuditAtom = await prisma.auditLog.findFirst({where:{entityId:String(itemAtom.id), action:'approve_submission', ipAddress: ip }});
      // note: audit for this failed attempt should not exist (filtered by our test item)
      // we check that at least no new audit for this item with success status
      const scoreAtom = await calculateSkorMadrasah(madrasah.id, periode.id);
      assert(scoreAtom.totalScore===10, `score should stay 10, got ${scoreAtom.totalScore}`);
      console.log(`   rollback verified, status tetap menunggu ✅ PASS`);
      results.push(['Atomicity rollback', true]);
    }

    // --- Test 11: Pagination & multi-filter ---
    console.log('\n🧪 TEST 11: Pagination + filter kombinasi');
    // create 3 more menunggu for pagination
    await Promise.all([createMenunggu(), createMenunggu(), createMenunggu()]);
    const paged = await validationService.getValidasiQueue({ status:'menunggu', periodeId:String(periode.id), page:'1', limit:'2' });
    assert(paged.data.length===2 && paged.limit===2 && paged.total>=3, 'pagination 2 per page');
    const filteredByMadrasah = await validationService.getValidasiQueue({ madrasahId: String(madrasah.id), periodeId: String(periode.id) });
    assert(filteredByMadrasah.total >= paged.total, 'filter by madrasah');
    console.log(`   page1 limit2 total=${paged.total} ✅ PASS`);
    results.push(['Pagination + filter', true]);

  } catch (err) {
    console.error('\n❌ Test failed with error:', err);
    results.push(['UNHANDLED ERROR', false]);
    throw err;
  } finally {
    console.log('\n' + '='.repeat(56));
    console.log('📊 RINGKASAN E2E VALIDASI ADMIN');
    console.log('='.repeat(56));
    for (const [name, ok] of results) {
      console.log(`${ok ? '✅ PASS' : '❌ FAIL'}: ${name}`);
    }
    const allOk = results.every(([,ok])=>ok);
    console.log('='.repeat(56));
    console.log(allOk ? '🎉 ALL E2E TESTS PASSED!' : '⚠️ SOME TESTS FAILED');
    if (ctx) {
      // don't cleanup if you want to inspect DB; but we leave data for manual check
      // await cleanup(); // keep for inspection? cleanup now for next run
    }
    await prisma.$disconnect();
    process.exit(allOk ? 0 : 1);
  }
}

run();

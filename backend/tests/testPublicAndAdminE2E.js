/**
 * E2E Test — Publik + Admin sisa endpoint (Phase 3 Final)
 * Verifikasi: linkBukti isolasi, finalisasi lock, bobot lock, PDF/Excel buffer, periode, akun, audit-log
 */
import { prisma } from '../src/db/prisma.js';
import * as publicController from '../src/controllers/publicController.js';
import * as periodService from '../src/services/periodService.js';
import * as bobotService from '../src/services/bobotService.js';
import * as accountService from '../src/services/accountService.js';
import * as exportService from '../src/services/exportService.js';
import { calculateSkorMadrasah } from '../src/services/scoringService.js';

const NS = 'PUBADM';
const ip = '127.0.0.1-e2e-final';

function mockRes() {
  let statusCode = 200, body, headers={}, buf;
  return {
    status(c){ statusCode=c; return this; },
    json(d){ body=d; return this; },
    send(d){ buf=d; body=d; return this; },
    setHeader(k,v){ headers[k]=v; },
    get statusCode(){ return statusCode; },
    get body(){ return body; },
    get headers(){ return headers; },
    get buf(){ return buf; },
  };
}
function assert(cond, msg){ if(!cond) throw new Error(msg); }

async function cleanup() {
  const per = await prisma.periodePenilaian.findFirst({ where:{ namaPeriode:`${NS}/2026` }});
  if(per){
    await prisma.validation.deleteMany({where:{submissionItem:{periodeId:per.id}}}).catch(()=>{});
    await prisma.deleteRequest.deleteMany({where:{submissionItem:{periodeId:per.id}}}).catch(()=>{});
    await prisma.submissionItem.deleteMany({where:{periodeId:per.id}}).catch(()=>{});
    await prisma.bobotIndikator.deleteMany({where:{periodeId:per.id}}).catch(()=>{});
    await prisma.periodePenilaian.deleteMany({where:{id:per.id}}).catch(()=>{});
  }
  await prisma.madrasah.deleteMany({where:{ nomorMadrasah:{ startsWith:`BMU-${NS}`}}}).catch(()=>{});
  await prisma.user.deleteMany({where:{ nip:{ startsWith: NS }}}).catch(()=>{});
  await prisma.auditLog.deleteMany({where:{ ipAddress: ip }}).catch(()=>{});
}

async function setup() {
  const admin = await prisma.user.create({ data:{ nip:`${NS}-ADM-01`, password:'hash', name:'Admin Final', email:`adm-${Date.now()}@test.local`, role:'admin', status:'aktif' }});
  const madrasah = await prisma.madrasah.create({ data:{ nomorMadrasah:`BMU-${NS}-001`, namaMadrasah:`Madrasah ${NS}`, jenjang:'MI', statusKepemilikan:'Negeri', jumlahSiswa:120, alamat:'Jl Final', slug:`slug-${NS.toLowerCase()}-${Date.now()}`, kelompok:'MI Negeri'}});
  const operator = await prisma.user.create({ data:{ nip:`${NS}-OP-01`, password:'hash', name:'Op Final', email:`op-${Date.now()}@test.local`, role:'operator', status:'aktif', madrasahId: madrasah.id }});
  // bersihkan periode aktif lain dari test sebelumnya agar madrasahDetail auto-select tidak salah periode
  await prisma.periodePenilaian.deleteMany({ where:{ namaPeriode:{ startsWith:'E2E-' }}}).catch(()=>{});
  await prisma.periodePenilaian.deleteMany({ where:{ namaPeriode:{ startsWith:'TEST' }}}).catch(()=>{});
  const periode = await prisma.periodePenilaian.create({ data:{ namaPeriode:`${NS}/2026`, tahunCapaian:2026, tanggalMulai:new Date('2099-01-02'), tanggalCutoff:new Date('2099-12-31'), status:'aktif' }});
  const indikators = await prisma.indikator.findMany();
  const diklat = indikators.find(i=>i.slug==='diklat');
  await prisma.bobotIndikator.create({ data:{ indikatorId: diklat.id, periodeId: periode.id, nilaiBobot: 10, terkunci:false }});
  // one approved item with linkBukti
  const item = await prisma.submissionItem.create({ data:{ madrasahId: madrasah.id, indikatorId: diklat.id, periodeId: periode.id, createdById: operator.id, namaKegiatan:'Kegiatan Final Link', linkBukti:'https://secret.example.com/bukti.pdf', status:'disetujui' }});
  await prisma.validation.create({ data:{ submissionItemId: item.id, validatorId: admin.id, aksi:'approve' }});
  return { admin, operator, madrasah, periode, diklat, item };
}

async function run(){
  const results=[];
  let ctx;
  try{
    console.log('🧹 Cleanup...');
    await cleanup();
    console.log('📦 Setup...');
    ctx = await setup();
    const { admin, madrasah, periode } = ctx;

    // 1. GET /api/leaderboard publik tanpa auth
    console.log('\n🧪 TEST 1: GET /api/leaderboard publik (tanpa auth) filter periode+kelompok');
    {
      const req={ query:{ periodeId:String(periode.id), kelompok:'MI Negeri' }};
      const res=mockRes();
      await publicController.leaderboard(req,res);
      assert(res.body.rankings.length>=1, 'leaderboard should have rankings');
      assert(res.body.rankings[0].totalScore===10, 'score 10');
      console.log(`   rankings=${res.body.rankings.length} score=${res.body.rankings[0].totalScore} ✅ PASS`);
      results.push(['leaderboard publik', true]);
    }

    // 2. GET /api/madrasah/:slug tanpa linkBukti
    console.log('\n🧪 TEST 2: GET /api/madrasah/:slug isolasi linkBukti');
    {
      const req={ params:{ slug: madrasah.slug }, query:{ periodeId: String(periode.id) }};
      const res=mockRes();
      await publicController.madrasahDetail(req,res);
      assert(res.body.madrasah.slug===madrasah.slug, 'madrasah match');
      assert(Array.isArray(res.body.prestasi), 'prestasi array');
      assert(res.body.prestasi.length>=1, 'prestasi >=1');
      assert(!('linkBukti' in res.body.prestasi[0]), 'linkBukti must NOT be in response');
      assert(res.body.skor.totalScore===10, 'skor 10');
      console.log(`   prestasi=${res.body.prestasi.length} linkBukti isolated ✅ PASS`);
      results.push(['madrasah/:slug tanpa linkBukti', true]);
    }

    // 3. Periode CRUD
    console.log('\n🧪 TEST 3: Periode CRUD GET/POST/PATCH');
    {
      const list = await periodService.listPeriode({});
      assert(list.length>=1, 'list periode');
      const created = await periodService.createPeriode({ namaPeriode:'2099/2100', tanggalMulai:'2099-01-01', tanggalCutoff:'2099-12-31' }, { userId: admin.id, ip });
      assert(created.namaPeriode==='2099/2100' && created.tahunCapaian===2099, 'create periode');
      const patched = await periodService.updatePeriode(created.id, { status:'aktif' }, { userId: admin.id, ip });
      assert(patched.status==='aktif', 'patch status');
      await prisma.periodePenilaian.delete({ where:{ id: created.id }}).catch(()=>{});
      console.log(`   CRUD OK ✅ PASS`);
      results.push(['periode CRUD', true]);
    }

    // 4. Finalisasi lock + audit
    console.log('\n🧪 TEST 4: POST /api/admin/periode/:id/finalisasi lock submission+bobot');
    {
      const fin = await periodService.finalizePeriode(periode.id, { userId: admin.id, ip });
      assert(fin.status==='finalisasi', 'finalisasi');
      const locked = await prisma.bobotIndikator.findMany({ where:{ periodeId: periode.id }});
      assert(locked.every(b=>b.terkunci===true), 'bobots terkunci');
      const audit = await prisma.auditLog.findFirst({ where:{ action:'finalize_period', entityId:String(periode.id)}});
      assert(audit, 'audit finalize');
      // try update should fail
      try{ await periodService.updatePeriode(periode.id, { namaPeriode:'X/Y' }, { userId: admin.id, ip }); throw new Error('should lock'); } catch(e){ assert(e.status===423||e.status===400, 'locked error'); }
      // try bobot update should fail 423
      try{ await bobotService.updateBobot({ periodeId: String(periode.id), bobots:[{ indikatorId: ctx.diklat.id, nilaiBobot:99 }]}, { userId: admin.id, ip }); throw new Error('should lock bobot'); } catch(e){ assert(e.status===423, `bobot locked 423 got ${e.status}`); }
      console.log(`   finalisasi lock bobot 423 ✅ PASS`);
      results.push(['finalisasi lock', true]);
    }

    // 5. Reopen wajib alasan + audit reopen_period
    console.log('\n🧪 TEST 5: POST /api/admin/periode/:id/reopen alasan wajib');
    {
      try{ await periodService.reopenPeriode(periode.id, { alasan:'', userId: admin.id, ip }); throw new Error('should require alasan'); } catch(e){ assert(e.status===400, 'alasan wajib'); }
      const reopened = await periodService.reopenPeriode(periode.id, { alasan:'Koreksi nilai', userId: admin.id, ip });
      assert(reopened.status==='aktif', 'reopened aktif');
      const audit = await prisma.auditLog.findFirst({ where:{ action:'reopen_period', entityId:String(periode.id)}});
      assert(audit && audit.alasan==='Koreksi nilai', 'audit reopen');
      const unlocked = await prisma.bobotIndikator.findMany({ where:{ periodeId: periode.id }});
      assert(unlocked.every(b=>!b.terkunci), 'unlocked');
      console.log(`   reopen aktif + audit ✅ PASS`);
      results.push(['reopen periode', true]);
    }

    // 6. Bobot GET/PATCH + recalc + audit update_bobot
    console.log('\n🧪 TEST 6: GET/PATCH /api/admin/bobot recalc + audit');
    {
      const before = await bobotService.listBobot({ periodeId: String(periode.id) });
      assert(before.data.length>=1, 'list bobot');
      const patched = await bobotService.updateBobot({ periodeId: String(periode.id), bobots:[{ indikatorId: ctx.diklat.id, nilaiBobot: 20 }]}, { userId: admin.id, ip });
      assert(patched[0].nilaiBobot===20, 'bobot 20');
      const score = await calculateSkorMadrasah(madrasah.id, periode.id);
      assert(score.totalScore===20, `score should 20 after bobot 20, got ${score.totalScore}`);
      const audit = await prisma.auditLog.findFirst({ where:{ action:'update_bobot' }});
      assert(audit, 'audit update_bobot');
      // restore to 10 for next tests
      await bobotService.updateBobot({ periodeId: String(periode.id), bobots:[{ indikatorId: ctx.diklat.id, nilaiBobot: 10 }]}, { userId: admin.id, ip });
      console.log(`   bobot 10->20 recalc 10->20 ✅ PASS`);
      results.push(['bobot PATCH recalc', true]);
    }

    // 7. Bobot lock when finalisasi again (re-finalize then try patch)
    console.log('\n🧪 TEST 7: Bobot tolak saat finalisasi (423)');
    {
      await periodService.finalizePeriode(periode.id, { userId: admin.id, ip });
      try{ await bobotService.updateBobot({ periodeId: String(periode.id), bobots:[{ indikatorId: ctx.diklat.id, nilaiBobot: 30 }]}, { userId: admin.id, ip }); throw new Error('should 423'); } catch(e){ assert(e.status===423, '423 locked'); }
      await periodService.reopenPeriode(periode.id, { alasan:'unlock for cleanup', userId: admin.id, ip });
      console.log(`   423 locked ✅ PASS`);
      results.push(['bobot locked when finalized', true]);
    }

    // 8. Akun GET/POST/PATCH
    console.log('\n🧪 TEST 8: GET/POST/PATCH /api/admin/akun');
    {
      const list = await accountService.listAkun({ page:'1', limit:'5' });
      assert(list.total>=2, 'list akun');
      const created = await accountService.createAkun({ nip:`${NS}-NEW-01`, name:'New User', email:`new-${Date.now()}@test.local`, password:'Password123', role:'operator' }, { userId: admin.id, ip });
      assert(created.nip===`${NS}-NEW-01`, 'create akun');
      const patched = await accountService.updateAkun(created.id, { status:'nonaktif' }, { userId: admin.id, ip });
      assert(patched.status==='nonaktif', 'deactivate');
      const audit = await prisma.auditLog.findFirst({ where:{ action:'update_account', entityId:String(created.id)}});
      assert(audit, 'audit update_account');
      // try duplicate nip
      try{ await accountService.createAkun({ nip:`${NS}-NEW-01`, name:'Dup', email:`dup-${Date.now()}@test.local`, password:'Password123' }, { userId: admin.id, ip }); throw new Error('should 409'); } catch(e){ assert(e.status===409, 'duplicate 409'); }
      console.log(`   akun CRUD + duplicate 409 ✅ PASS`);
      results.push(['akun CRUD', true]);
    }

    // 9. Export PDF buffer
    console.log('\n🧪 TEST 9: GET /api/admin/export/pdf buffer');
    {
      const buf = await exportService.buildPdfBuffer({ periodeId: String(periode.id), kelompok:'MI Negeri' });
      assert(Buffer.isBuffer(buf), 'pdf buffer');
      assert(buf.slice(0,4).toString()==='%PDF', `pdf header %PDF got ${buf.slice(0,4).toString()}`);
      assert(buf.length > 1000, `pdf size ${buf.length}`);
      console.log(`   PDF %PDF header size=${buf.length} ✅ PASS`);
      results.push(['export PDF', true]);
    }

    // 10. Export Excel buffer
    console.log('\n🧪 TEST 10: GET /api/admin/export/excel buffer');
    {
      const buf = await exportService.buildExcelBuffer({ periodeId: String(periode.id), kelompok:'MI Negeri' });
      assert(Buffer.isBuffer(buf), 'excel buffer');
      assert(buf.slice(0,2).toString()==='PK', `excel PK header got ${buf.slice(0,2).toString()}`);
      assert(buf.length > 1000, `excel size ${buf.length}`);
      console.log(`   Excel PK header size=${buf.length} ✅ PASS`);
      results.push(['export Excel', true]);
    }

    // 11. AuditLog filter + pagination
    console.log('\n🧪 TEST 11: GET /api/admin/audit-log filter + pagination');
    {
      const { prisma: p } = await import('./db/prisma.js');
      const total = await p.auditLog.count({ where:{ ipAddress: ip }});
      assert(total>=5, `audit total >=5 got ${total}`);
      // via controller
      const { list } = await import('./controllers/admin/auditLogController.js');
      const req={ query:{ action:'update_bobot', page:'1', limit:'2' }};
      const res=mockRes();
      await list(req,res);
      assert(res.body.total>=1, 'audit filter');
      assert(res.body.data.length<=2, 'pagination limit 2');
      console.log(`   audit filter total=${res.body.total} page limit 2 ✅ PASS`);
      results.push(['audit-log filter pagination', true]);
    }

  } catch(err){
    console.error('\n❌ E2E failed:', err);
    results.push(['UNHANDLED', false]);
  } finally {
    console.log('\n'+'='.repeat(56));
    console.log('📊 RINGKASAN E2E PUBLIK & ADMIN FINAL');
    console.log('='.repeat(56));
    for(const [n,ok] of results) console.log(`${ok?'✅ PASS':'❌ FAIL'}: ${n}`);
    const all = results.length>0 && results.every(([,o])=>o);
    console.log('='.repeat(56));
    console.log(all?'🎉 ALL E2E TESTS PASSED!':'⚠️ SOME FAILED');
    await prisma.$disconnect();
    process.exit(all?0:1);
  }
}
run();

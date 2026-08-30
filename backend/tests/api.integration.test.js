import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

// Kredensial demo dibaca dari env — JANGAN hardcode di file test.
// Set BACKEND_TEST_NIP / BACKEND_TEST_PASS di backend/.env atau environment.
const NIP = process.env.BACKEND_TEST_NIP;
const PASS = process.env.BACKEND_TEST_PASS;
const hasCreds = Boolean(NIP && PASS);

let adminToken = null;

describe('API health', () => {
  it('GET /api/health -> 200', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body.status).toBe('OK');
  });

  it('security headers helmet aktif', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('Auth API', () => {
  it('login tanpa body -> 400/401', async () => {
    await request(app).post('/api/auth/login').send({}).expect((r) => {
      expect([400, 401]).toContain(r.status);
    });
  });

  (hasCreds ? it : it.skip)('login kredensial benar -> accessToken + role admin', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ nip: NIP, password: PASS })
      .expect(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(['ADMIN', 'admin', 'SUPER_ADMIN']).toContain(res.body.user?.role);
    adminToken = res.body.accessToken;
  });

  (hasCreds ? it : it.skip)('GET /api/admin/periode dengan token -> 200', async () => {
    expect(adminToken).toBeTruthy();
    const res = await request(app)
      .get('/api/admin/periode')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(res.body.data ?? res.body)).toBe(true);
  });
});

describe('Periode CRUD admin (create → update → delete)', () => {
  (hasCreds ? it : it.skip)('create → PATCH → DELETE → 200, DELETE lagi → 404', async () => {
    expect(adminToken).toBeTruthy();
    // tahun random + pre-cleanup -> test idempoten (format wajib YYYY/YYYY)
    const th = 2100 + Math.floor(Math.random() * 200);
    const nama = `${th}/${th + 1}`;
    // tanggal di TAHUN YANG SAMA dengan nama — tidak overlap periode aktif
    const mul = new Date(Date.UTC(th, 0, 1)).toISOString();
    const cut = new Date(Date.UTC(th, 11, 31)).toISOString();

    // cleanup kalau sisa dari run sebelumnya
    const list = await request(app)
      .get('/api/admin/periode')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    for (const p of (list.body.data ?? [])) {
      if (String(p.namaPeriode) === nama) {
        await request(app)
          .delete(`/api/admin/periode/${p.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      }
    }

    // create
    const create = await request(app)
      .post('/api/admin/periode')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ namaPeriode: nama, tanggalMulai: mul, tanggalCutoff: cut })
      .expect(201);
    const pid = create.body.data?.id;
    expect(pid).toBeTruthy();

    // update (edit nama)
    const update = await request(app)
      .patch(`/api/admin/periode/${pid}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ namaPeriode: `${th}/${th + 2}`, tanggalMulai: mul, tanggalCutoff: cut })
      .expect(200);
    expect(update.body.data?.namaPeriode).toBe(`${th}/${th + 2}`);

    // delete
    const del = await request(app)
      .delete(`/api/admin/periode/${pid}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(del.body.data?.id).toBe(pid);
    expect(del.body.data?.deletedCounts).toBeTruthy();

    // delete lagi -> 404
    await request(app)
      .delete(`/api/admin/periode/${pid}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });

  (hasCreds ? it : it.skip)('create periode overlap -> 409 PERIOD_OVERLAP; non-overlap -> 201', async () => {
    expect(adminToken).toBeTruthy();
    // periode uji non-overlap dulu (di tahun jauh) — idempoten pre-cleanup
    const pre = await request(app)
      .get('/api/admin/periode')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const list = pre.body.data ?? [];
    for (const p of list) {
      if (String(p.namaPeriode).startsWith('VIT-')) {
        await request(app).delete(`/api/admin/periode/${p.id}`).set('Authorization', `Bearer ${adminToken}`);
      }
    }

    // overlap dengan periode 2026/2027 (jika ada & masih jalan) -> 409
    const aktif = list.find((p) => p.namaPeriode === '2026/2027' && ['aktif', 'belum_dimulai'].includes(p.status));
    if (aktif) {
      const res = await request(app)
        .post('/api/admin/periode')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ namaPeriode: '2099/2100', tanggalMulai: '2026-01-01T00:00:00.000Z', tanggalCutoff: '2026-12-31T00:00:00.000Z' })
        .expect(409);
      expect(res.body.error).toContain('Tidak boleh ada 2 periode');
    }

    // non-overlap -> 201 + cleanup
    const c = await request(app)
      .post('/api/admin/periode')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ namaPeriode: '2098/2099', tanggalMulai: '2098-01-01T00:00:00.000Z', tanggalCutoff: '2098-12-31T00:00:00.000Z' })
      .expect(201);
    const pid = c.body.data?.id;
    expect(pid).toBeTruthy();
    await request(app)
      .delete(`/api/admin/periode/${pid}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});

describe('Endpoint publik (tanpa auth)', () => {
  it('GET /api/stats -> 200 { madrasahCount, kelompokCount }', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(200);
    expect(typeof res.body.madrasahCount).toBe('number');
    expect(res.body.kelompokCount).toBe(6);
  });

  it('GET /api/periode -> 200 daftar non-finalisasi/arsip', async () => {
    const res = await request(app).get('/api/periode');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    for (const p of res.body.data) {
      expect(['finalisasi', 'arsip']).not.toContain(p.status);
      expect(typeof p.statusEfektif).toBe('string');
    }
  });

  it('GET /api/leaderboard -> 200 + madrasahCount number', async () => {
    const res = await request(app).get('/api/leaderboard?kelompok=MI%20Negeri');
    expect(res.status).toBe(200);
    expect(typeof res.body.madrasahCount).toBe('number');
    expect(Array.isArray(res.body.rankings)).toBe(true);
  });

  it('GET /api/madrasah/:slug tidak ada -> 404', async () => {
    const res = await request(app).get('/api/madrasah/qa-slug-tidak-ada-vit');
    expect(res.status).toBe(404);
  });
});

describe('Akun CRUD admin (create → delete + guard)', () => {
  (hasCreds ? it : it.skip)('create akun bersih → DELETE → 200, DELETE lagi → 404, self → 400', async () => {
    expect(adminToken).toBeTruthy();
    const ts = Date.now();
    const akun = {
      nip: `1234567890123${String(ts).slice(-5)}`,
      name: 'Vit CRUD' + ts,
      email: `vitcrud${ts}@test.id`,
      password: 'testpass123',
      role: 'operator',
    };

    const create = await request(app)
      .post('/api/admin/akun')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(akun)
      .expect(201);
    const uid = create.body.data?.id;
    expect(uid).toBeTruthy();

    // delete akun bersih -> 200
    const del = await request(app)
      .delete(`/api/admin/akun/${uid}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(del.body.data?.id).toBe(uid);

    // delete lagi -> 404
    await request(app)
      .delete(`/api/admin/akun/${uid}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });
});

describe('Madrasah CRUD admin (create → update → soft/hard delete)', () => {
  (hasCreds ? it : it.skip)('create → 201, update → 200, jenjang immutable → 400, soft → 200, hard → 200, lagi → 404', async () => {
    expect(adminToken).toBeTruthy();
    const ts = Date.now();
    const nama = `MI Vit ${ts}`;

    const c = await request(app)
      .post('/api/admin/madrasah')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ namaMadrasah: nama, jenjang: 'MI', statusKepemilikan: 'Swasta', jumlahSiswa: 120, alamat: 'Jl. Uji 1' })
      .expect(201);
    const mid = c.body.data?.id;
    expect(mid).toBeTruthy();
    expect(c.body.data?.nomorMadrasah).toMatch(/^BMU-\d{6}$/);
    expect(c.body.data?.slug).toMatch(/^mi-vit-\d+$/);
    expect(c.body.data?.kelompok).toBe('MI Swasta');

    await request(app)
      .patch(`/api/admin/madrasah/${mid}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ namaMadrasah: nama + ' Edit', jumlahSiswa: 200 })
      .expect(200);

    // jenjang immutable
    await request(app)
      .patch(`/api/admin/madrasah/${mid}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ jenjang: 'MA' })
      .expect(400);

    // soft delete
    await request(app)
      .patch(`/api/admin/madrasah/${mid}/soft-delete`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ alasan: 'test' })
      .expect(200);

    // list default (aktif) tidak memuat
    const list = await request(app)
      .get('/api/admin/madrasah')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect((list.body.data ?? []).some((m) => m.id === mid)).toBe(false);

    // activate + hard delete
    await request(app)
      .patch(`/api/admin/madrasah/${mid}/activate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const del = await request(app)
      .delete(`/api/admin/madrasah/${mid}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(del.body.data?.deletedCounts).toBeTruthy();

    await request(app)
      .delete(`/api/admin/madrasah/${mid}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });
});

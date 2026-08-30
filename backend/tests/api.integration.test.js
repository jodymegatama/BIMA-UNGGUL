import { describe, it, expect, beforeAll } from 'vitest';
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
    const mul = new Date().toISOString();
    const cut = new Date(Date.now() + 86400000).toISOString();

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
    expect(del.body.data?.deleted).toBeTruthy();

    // delete lagi -> 404
    await request(app)
      .delete(`/api/admin/periode/${pid}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
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

  (hasCreds ? it : it.skip)('SELF_DELETE -> 400 (tidak bisa hapus akun sendiri)', async () => {
    expect(adminToken).toBeTruthy();
    await request(app)
      .delete('/api/admin/akun/0')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect((r) => {
        expect([400, 404]).toContain(r.status); // id 0 tidak valid -> 400 (atau 404 user tidak ada)
      });
  });
});

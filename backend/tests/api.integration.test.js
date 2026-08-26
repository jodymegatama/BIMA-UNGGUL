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

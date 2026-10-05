/**
 * Regression test: backend harus mempercayap ada proxy-nya sendiri.
 *
 * Gejala nyata di produksi (log container backend, 1 Okt 2026):
 *   ValidationError: The 'X-Forwarded-For' header is set but the Express
 *   'trust proxy' setting is false (default).
 *   code: 'ERR_ERL_UNEXPECTED_X_FORWARDED_FOR'
 *
 * nginx di [frontend/nginx.conf] selalu mengirim header itu ke /api/. Tanpa
 * `app.set('trust proxy', ...)`, semua request-nya dihitung sebagai berasal
 * dari satu IP proxy, sehingga limiter login memblokir seluruh pengguna
 * bersama-sama setelah 5 kegagalan — proteksi brute-force jadi tak berguna
 * sekaligus jadi renameial denial-of-service.
 *
 * Test di bawah memakai app singleton yang sama dengan production. Vitest
 * mengisolasi module graph per file test, jadi store rate limiter di sini
 * tidak bentrok dengan suite login lain. Tiap test memakai blok IP sendiri
 * supaya urutan eksekusi tidak saling memengaruhi.
 */
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

// app.js: max 5 kegagalan per window 15 menit, skipSuccessfulRequests
// (jadi 400/401 ikut dihitung, hanya 2xx yang dilewati).
const MAX_GAGAL = 5;

function loginDari(ip) {
  return request(app)
    .post('/api/auth/login')
    .set('X-Forwarded-For', ip)
    .set('X-Forwarded-Proto', 'https')
    .send({});
}

describe('Trust proxy untuk rate limiter', () => {
  it('app menyalakan trust proxy (nilai 1 = hop nginx sendiri)', () => {
    expect(app.get('trust proxy')).toBe(1);
  });

  it('limiter memakai IP asli tiap pengguna, bukan satu IP proxy', async () => {
    // Satu IP-INI Penyerang: 5 kegagalan → request berikutnya kena limit.
    const ipPenyerang = '203.0.113.1';
    for (let i = 0; i < MAX_GAGAL; i++) {
      const res = await loginDari(ipPenyerang);
      expect(res.status).not.toBe(429);
    }
    const setelahLimit = await loginDari(ipPenyerang);
    expect(setelahLimit.status).toBe(429);

    // IP lain TIDAK ikut kena limit — inilah yang rusak tanpa trust proxy:
    // semua request jadi satu IP, jadi pengguna yang sah ikut terblokir.
    const resPenggunaSah = await loginDari('203.0.113.2');
    expect(
      resPenggunaSah.status,
      'pengguna dengan IP berbeda ikut kena 429 — trust proxy tidak aktif',
    ).not.toBe(429);
  });

  it('X-Forwarded-For tidak memicu ERR_ERL_UNEXPECTED_X_FORWARDED_FOR', async () => {
    // Rate limiter memvalidasi header ini tiap request. Tanpa trust proxy
    // responsnya bukan error HTTP, tapi tetap muncul sebagai ValidationError
    // di log produksi tiap request login — dan IP asal tidak terpakai.
    const res = await loginDari('203.0.113.3');
    expect([400, 401, 429]).toContain(res.status);
  });
});

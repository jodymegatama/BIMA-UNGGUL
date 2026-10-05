import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app, { errorHandler } from '../src/app.js';
import { AUTH_CONFIG } from '../src/constants/auth.constants.js';

// Regresi kelas bug yang sama dengan /api/auth/refresh 500: request yang jelas
// salah (tipe data salah, body kosong, :id bukan angka) TIDAK BOLEH berakhir sebagai
// 500. validateInput() dan service sama-sama melempar Error biasa; Express 5
// meneruskannya ke handler global yang membaca err.status — dan Error biasa tidak
// punya status, jadi hasilnya 500. Akibatnya frontend src/lib/api.js (yang hanya
// mengakhiri sesi pada 401/403) menampilkan "Gagal memuat" untuk kesalahan yang
// sebenarnya milik klien.
//
// Catatan rate limiter: /api/auth/login dibatasi 5 percobaan GAGAL per 15 menit
// per IP dan setiap respons non-2xx menghitung. File ini sengaja hanya memakai 3
// request login yang gagal supaya gabung dengan test lain tidak kena 429.

const adminToken = () =>
  jwt.sign({ userId: 999_999, role: 'admin', madrasahId: null }, AUTH_CONFIG.JWT_SECRET, { expiresIn: '5m' });

/** Body registrasi yang valid — tiap test hanya merusak satu field. */
const registrasiValid = (email) => ({
  name: 'Auditor Uji',
  email,
  password: 'Uji12345',
  telepon: '081234567890',
  madrasahData: {
    nama: 'MI Negeri Uji',
    jenjang: 'MI',
    statusKepemilikan: 'Negeri',
    alamat: 'Jl. Uji No. 1',
    jumlahSiswa: 100,
  },
});

describe('Auth — input tidak valid dibalas 4xx (bukan 500)', () => {
  // Case 1: name/email/password non-string lolos validasi `!name` (angka & objek
  // itu truthy) lalu mentransmisikan nilai mentah ke prisma.user.create() ->
  // PrismaClientValidationError -> 500.
  it('register: name berupa angka -> 400 INVALID_FIELD_TYPE', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...registrasiValid(`uji.name.${Date.now()}@madrasah.local`), name: 12345 })
      .expect(400);
    expect(res.body.code).toBe('INVALID_FIELD_TYPE');
  });

  it('register: email berupa objek -> 400 (ditolak validateEmail)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...registrasiValid('sengaja-diabaikan@madrasah.local'), email: { $ne: null } })
      .expect(400);
    // validateEmail() (langkah 2) lebih dulu menolak: String({}) jadi "[object object]"
    // yang gagal EMAIL_RE. Kode berbeda dari INVALID_FIELD_TYPE tapi sama-sama 400 —
    // yang penting bukan 500.
    expect(res.body.code).toBe('INVALID_EMAIL');
  });

  // Case 2: nama/alamat divalidasi lewat `nama.length` / `alamat.length` yang
  // undefined untuk angka & objek, jadi lolos. Nama/alamat ikut tersimpan mentah di
  // JSON madrasahData lalu baru meledak saat admin menyetujui akun.
  it('register: madrasahData.nama berupa angka -> 400 INVALID_MADRASAH_DATA', async () => {
    const body = registrasiValid(`uji.nama.${Date.now()}@madrasah.local`);
    body.madrasahData.nama = 99999;
    const res = await request(app).post('/api/auth/register').send(body).expect(400);
    expect(res.body.code).toBe('INVALID_MADRASAH_DATA');
  });

  it('register: madrasahData.alamat berupa objek -> 400 INVALID_MADRASAH_DATA', async () => {
    const body = registrasiValid(`uji.alamat.${Date.now()}@madrasah.local`);
    body.madrasahData.alamat = { x: 1 };
    const res = await request(app).post('/api/auth/register').send(body).expect(400);
    expect(res.body.code).toBe('INVALID_MADRASAH_DATA');
  });

  it('register: madrasahData bukan objek -> 400 INVALID_MADRASAH_DATA', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...registrasiValid(`uji.md.${Date.now()}@madrasah.local`), madrasahData: 'bukan objek' })
      .expect(400);
    expect(res.body.code).toBe('INVALID_MADRASAH_DATA');
  });

  // Case 3: express.json() hanya mengisi req.body untuk Content-Type
  // application/json. Tanpa itu req.body undefined dan handler yang
  // men-destructure req.body melempar TypeError -> 500.
  it('register tanpa Content-Type json -> 400, bukan TypeError 500', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'text/plain')
      .send('name=ab&password=cd')
      .expect(400);
    expect(res.body.error).not.toMatch(/Cannot destructure/i);
  });

  it('login tanpa Content-Type json -> 400, bukan TypeError 500', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'text/plain')
      .send('a=b')
      .expect(400);
    expect(res.body.code).toBe('MISSING_CREDENTIALS');
  });

  // Case 4: bcrypt.compare melempar "Illegal arguments: number, string" untuk
  // password non-string; authService membungkusnya jadi Error biasa -> 500.
  it('login: password berupa angka -> 400 INVALID_CREDENTIALS_TYPE', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'operator.dummy@madrasah.local', password: 12345678 })
      .expect(400);
    expect(res.body.code).toBe('INVALID_CREDENTIALS_TYPE');
  });

  it('login: JSON rusak -> 400 (error body-parser diteruskan apa adanya)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":')
      .expect(400);
    expect(res.body.error).toBeTruthy();
  });
});

describe('Auth — id dan payload JWT tidak valid dibalas 4xx (bukan 500)', () => {
  // Case 5: parseInt('abc') = NaN masuk ke prisma.user.findUnique({ where: { id: NaN } })
  // -> PrismaClientValidationError -> 500.
  it('approve akun: :id bukan angka -> 400 INVALID_USER_ID', async () => {
    const res = await request(app)
      .post('/api/admin/akun/abc/approve')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({})
      .expect(400);
    expect(res.body.code).toBe('INVALID_USER_ID');
  });

  it('approve akun: :id negatif -> 400 INVALID_USER_ID', async () => {
    const res = await request(app)
      .post('/api/admin/akun/-5/approve')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({})
      .expect(400);
    expect(res.body.code).toBe('INVALID_USER_ID');
  });

  // Case 6: decoded.userId non-integer (string/null) jadi filter Prisma yang
  // tidak valid -> PrismaClientValidationError -> 500.
  it('refresh: userId string di payload -> 401 INVALID_REFRESH_TOKEN', async () => {
    const bad = jwt.sign({ userId: 'bukan-angka' }, AUTH_CONFIG.REFRESH_SECRET, { algorithm: 'HS256', expiresIn: '7d' });
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${bad}`)
      .expect(401);
    expect(res.body.code).toBe('INVALID_REFRESH_TOKEN');
  });

  it('refresh: tanpa userId di payload -> 401 INVALID_REFRESH_TOKEN', async () => {
    const bad = jwt.sign({ role: 'operator' }, AUTH_CONFIG.REFRESH_SECRET, { algorithm: 'HS256', expiresIn: '7d' });
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${bad}`)
      .expect(401);
    expect(res.body.code).toBe('INVALID_REFRESH_TOKEN');
  });
});

describe('Auth — logout tidak gagal gara-gara audit log', () => {
  // Audit adalah jejak tambahan. Akun yang dihapus admin sementara access token
  // masih hidup membuat prisma.auditLog.create() kena foreign key violation;
  // dulu itu membalas 500 padahal cookie sudah dihapus dan sesi sudah berakhir.
  it('logout tetap 200 walau userId pada token sudah tidak ada', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${adminToken()}`)
      .expect(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Error handler global — error Prisma dipetakan ke 4xx', () => {
  // P2003: madrasahId yang tidak ada. createAkun meneruskan nilai mentah ke
  // prisma.user.create(); dulu hasilnya 500 "Foreign key constraint failed".
  it('POST /api/admin/akun dengan madrasahId asing -> 400 INVALID_REFERENCE', async () => {
    const res = await request(app)
      .post('/api/admin/akun')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({
        name: 'Uji Relasi',
        email: `uji.relasi.${Date.now()}@madrasah.local`,
        password: 'Uji12345',
        role: 'operator',
        madrasahId: 99_999_999,
      })
      .expect(400);
    expect(res.body.code).toBe('INVALID_REFERENCE');
  });
});

// Pesan error internal (isi query Prisma, nama kolom, nilai rahasia) tidak boleh
// bocor ke klien.
//
// Test ini memanggil error handler secara langsung, bukan lewat route. Sebelumnya
// ia memakai `POST /api/admin/akun` dengan `name` bertipe angka sebagai "kendaraan":
// setelah createAkun diberi validasi tipe, endpoint itu membalas 400 dan tidak ada
// lagi yang bisa dipaksa melempar 500 lewat HTTP. Memakai handler langsung membuat
// assertion ini tidak bergantung pada route mana pun yang kebetulan masih salah —
// yang diuji adalah perilaku penangan errornya.
describe('Error handler global — pesan internal tidak bocor ke klien', () => {
  const resPalsu = () => {
    const res = {
      kode: null,
      body: null,
      status(k) { this.kode = k; return this; },
      json(b) { this.body = b; return this; },
    };
    return res;
  };

  it('Error tanpa status -> 500 generik tanpa pesan aslinya', () => {
    const err = new Error('Invalid prisma.user.create() invocation: DATABASE_URL=rahasia');
    const res = resPalsu();
    errorHandler(err, {}, res, () => {});
    expect(res.kode).toBe(500);
    expect(res.body.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(res.body)).not.toMatch(/prisma|rahasia|DATABASE_URL/i);
  });

  it('Error Prisma tanpa kode known tetap 500 generik', () => {
    const err = Object.assign(new Error('nama kolom tidak boleh angka'), {
      name: 'PrismaClientValidationError',
    });
    const res = resPalsu();
    errorHandler(err, {}, res, () => {});
    expect(res.kode).toBe(500);
    expect(JSON.stringify(res.body)).not.toMatch(/kolom/i);
  });

  it('kode Prisma known dipetakan ke 4xx, pesan aslinya tidak ikut', () => {
    const res = resPalsu();
    errorHandler(
      Object.assign(new Error('Foreign key constraint failed on the field: `madrasahId`'), { code: 'P2003' }),
      {},
      res,
      () => {},
    );
    expect(res.kode).toBe(400);
    expect(res.body.code).toBe('INVALID_REFERENCE');
    expect(JSON.stringify(res.body)).not.toMatch(/Foreign key|madrasahId/);
  });

  it('HttpError 4xx diteruskan apa adanya', () => {
    const res = resPalsu();
    errorHandler(Object.assign(new Error('Bobot tidak boleh nol'), { status: 400, code: 'ALL_BOBOT_ZERO' }), {}, res, () => {});
    expect(res.kode).toBe(400);
    expect(res.body.code).toBe('ALL_BOBOT_ZERO');
    expect(res.body.error).toBe('Bobot tidak boleh nol');
  });

  it('route tidak dikenal tetap 404', async () => {
    await request(app).post('/api/auth/tidak-ada').expect(404);
  });
});
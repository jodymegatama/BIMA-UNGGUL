import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { prisma } from '../src/db/prisma.js';
import { AUTH_CONFIG } from '../src/constants/auth.constants.js';
import { dbGate } from './helpers/dbGate.js';

// GUARD GLOBAL: tidak boleh ada route yang membalas 5xx untuk input klien yang
// salah bentuk.
//
// Kelas bug ini berulang di project ini: nilai dari req.query / req.params /
// req.body dipakai mentah sebagai filter Prisma atau argumen service, lalu
// Prisma melempar PrismaClientValidationError. Error itu tidak punya `status`,
// jadi error handler global membalas 500 — padahal permintaannya jelas salah
// filter. Gejalanya setara dengan bug /api/auth/refresh yang diperbaiki lebih
// awal: user melihat "Gagal memuat" alih-alih pesan kesalahan yang bisa
// ditindaklanjuti.
//
// Test ini memindai route list dari app itu sendiri sehingga route baru ikut
// tercakup otomatis tanpa harus didaftarkan manual satu per satu.

/**
 * Mount path router di app.js, urut sesuai `app.use(...)`.
 *
 * Express 5 tidak mengekspos mount path di stack router (`layer.matchers`
 * berisi null), jadi prefix dipetakan berdasarkan urutan mount. Guard di bawah
 * memverifikasi jumlah router yang di-mount masih sama dengan jumlah prefix —
 * kalau ada router ke-6 ditambahkan, test ini GAGAL dan daftar prefix di sini
 * diisi ulang, bukan diam-diam melewatkan route baru.
 */
const MOUNT_PREFIX = ['/api/auth', '/api/operator', '/api/admin', '/api/notifications', '/api'];

/**
 * Route yang boleh membalas 5xx untuk input rusak, dengan alasannya.
 *
 * Default-nya KOSONG dengan sengaja: setiap 5xx yang ditemukan harus diperbaiki
 * atau — kalau memang bug server yang sah dan belum bisa diperbaiki — dicatat
 * di sini beserta alasannya. Tidak ada 5xx yang lolos tanpa ditriage.
 */
const DIHOWARKAN_5XX = [
  // contoh bentuk entri:
  // ['GET /api/admin/laporan', 'ekspor PDF gagal di env tanpa font — bug server, bukan input klien'],
];

/** Route yang hanya punya satu level auth bermakna (publik). */
const PUBLIK = ['/api/auth/login'];

const operatorToken = () =>
  jwt.sign({ userId: 552, role: 'operator', madrasahId: 251 }, AUTH_CONFIG.JWT_SECRET, { expiresIn: '5m' });
const adminToken = () =>
  jwt.sign({ userId: 999_999, role: 'admin', madrasahId: null }, AUTH_CONFIG.JWT_SECRET, { expiresIn: '5m' });

let routes = [];
let mulaiSweep = null;

describe.skipIf(!dbGate())('Guard global — tidak ada route yang balas 5xx untuk input klien rusak', () => {
  beforeAll(() => {
    const routers = app.router.stack.filter((l) => l.name === 'router');
    // Guard 1: jumlah mount router harus cocok dengan daftar prefix.
    expect(
      routers.length,
      'Jumlah router yang di-mount app berubah. Perbarui MOUNT_PREFIX di file test ini.',
    ).toBe(MOUNT_PREFIX.length);

    routers.forEach((router, i) => {
      for (const layer of router.handle.stack) {
        if (!layer.route) continue;
        for (const method of Object.keys(layer.route.methods)) {
          routes.push({ method: method.toUpperCase(), path: MOUNT_PREFIX[i] + layer.route.path });
        }
      }
    });
    mulaiSweep = new Date();
  });

  afterAll(async () => {
    // POST /api/auth/logout menulis satu baris auditLog per request. Sweep memanggil
    // route itu dengan token operator sungguhan, jadi artefaknya dibersihkan di sini.
    // Batas 20 baris supaya jangan sampai ikut menghapus aktivitas user yang kebetulan
    // berjalan bersamaan.
    const jumlah = await prisma.auditLog.count({
      where: { userId: 552, action: 'logout', createdAt: { gte: mulaiSweep } },
    });
    if (jumlah > 0 && jumlah <= 20) {
      await prisma.auditLog.deleteMany({
        where: { userId: 552, action: 'logout', createdAt: { gte: mulaiSweep } },
      });
    }
    await prisma.$disconnect();
  });

  it('daftar route terambil dari app dan bukan kosong', () => {
    expect(routes.length).toBeGreaterThan(20);
    // Guard 2: route yang dikenal harus ditemukan — kalau cara ambilnya rusak,
    // sweep di bawah akan "lulus" karena tidak memeriksa apa pun.
    expect(routes.some((r) => r.path === '/api/auth/login')).toBe(true);
    expect(routes.some((r) => r.path === '/api/admin/akun/:id/approve')).toBe(true);
    expect(routes.some((r) => r.path === '/api/madrasah/:slug')).toBe(true);
  });

  it('semua route x semua level auth x input rusak -> tidak ada 5xx', async () => {
    const temuan = [];
    let jumlahRequest = 0;

    for (const route of routes) {
      const levels = PUBLIK.includes(route.path)
        // Login publik: setiap respons non-2xx membakar kuota rate limiter
        // (5 gagal / 15 menit per IP). Diprobe sekali saja supaya varian lain
        // tidak tertutup 429.
        ? [['tanpa-token', null]]
        : [['tanpa-token', null], ['operator', operatorToken()], ['admin', adminToken()]];

      for (const [level, token] of levels) {
        for (const varian of varianInput(route)) {
          let req = request(app)[route.method.toLowerCase()](varian.url);
          if (token) req = req.set('Authorization', `Bearer ${token}`);
          req = terapkanBody(req, varian);

          jumlahRequest += 1;
          try {
            const res = await req;
            if (res.status >= 500) {
              temuan.push(`${route.method} ${route.path} [${level}/${varian.nama}] -> ${res.status} ${JSON.stringify(res.body).slice(0, 120)}`);
            }
          } catch (err) {
            temuan.push(`${route.method} ${route.path} [${level}/${varian.nama}] -> melempar: ${err.message.slice(0, 120)}`);
          }
        }
      }
    }

    const tidakDiizinkan = temuan.filter((t) => {
      const kunci = t.split(' [')[0];
      return !DIHOWARKAN_5XX.some(([route]) => kunci === route);
    });

    expect(
      tidakDiizinkan,
      `\n${tidakDiizinkan.length} route membalas 5xx untuk input klien yang salah bentuk:\n${tidakDiizinkan.join('\n')}\n\n` +
        'Perbaiki sumbernya (validasi tipe/format sebelum meneruskan ke Prisma) — jangan whitelist tanpa alasan.\n' +
        `Total request diprobe: ${jumlahRequest}`,
    ).toEqual([]);
  }, 60_000);
});

/**
 * Body "racun": tiap field diberi tipe yang salah.
 *
 * Nilainya angka 14 digit, bukan angka pendek. Angka pendek seperti 12345 pernah
 * membuat test ini tampak aman padahal tidak: validasi panjang password
 * (`String(password).length < 8`) menolaknya lebih dulu, jadi request berhenti sebagai
 * 400 sebelum pernah menyentuh Prisma — false negative yang membuat guard ini
 * tidak membuktikan apa pun. Angka panjang lolos cek panjang, jadi request
 * benar-benar mencapai lapisan database dan menguji apa yang mau diuji.
 *
 * `email` tetap string berformat email agar tidak berhenti di validasi format
 * sebelum sampai ke titik yang rawan.
 */
const ANGKA_PANJANG = 98765432109876;

function bodyRacun() {
  return {
    nama: ANGKA_PANJANG,
    namaMadrasah: ANGKA_PANJANG,
    namaPeriode: ANGKA_PANJANG,
    name: ANGKA_PANJANG,
    email: `uji.garbage.${Date.now()}@madrasah.local`,
    password: ANGKA_PANJANG,
    nip: ANGKA_PANJANG,
    role: ANGKA_PANJANG,
    status: 'bogus-status',
    jenjang: 999,
    statusKepemilikan: 'x',
    tanggalMulai: ANGKA_PANJANG,
    tanggalCutoff: ANGKA_PANJANG,
    jumlahSiswa: 'banyak',
    alasan: ANGKA_PANJANG,
    alasanHapus: ANGKA_PANJANG,
    items: 'bukan-array',
    data: 'x',
    indikatorKode: ANGKA_PANJANG,
    linkBukti: ANGKA_PANJANG,
    catatan: ANGKA_PANJANG,
    statusPegawai: 999,
    tingkatWilayah: 'x',
    jenjangPendidikan: 'x',
    pembilang: 'x',
    penyebut: 'x',
    jumlah: 'x',
    deskripsi: ANGKA_PANJANG,
    bobot: 'x',
    nilaiBobot: 'x',
    indikatorId: 'x',
    id: 'x',
    telepon: ANGKA_PANJANG,
  };
}

/** Varian input rusak yang dipakai untuk setiap route. */
function varianInput(route) {
  const denganIdAbc = route.path.replace(/:id/g, 'abc');
  const denganIdBesar = route.path.replace(/:id/g, '999999999');
  const querySampah = '?limit=abc&page=-1&status=<script>&q=%27%20OR%201=1';

  if (route.method === 'GET' || route.method === 'DELETE') {
    return [
      { nama: 'id-bukan-angka+query-sampah', url: denganIdAbc + querySampah, body: undefined },
      { nama: 'id-tidak-ada', url: denganIdBesar, body: undefined },
      { nama: 'tanpa-content-type', url: denganIdAbc, body: { text: 'x=1' } },
      { nama: 'json-rusak', url: denganIdAbc, body: { raw: '{"a":' } },
    ];
  }
  return [
    { nama: 'id-bukan-angka+body-kosong', url: denganIdAbc + querySampah, body: { json: {} } },
    { nama: 'id-tidak-ada+body-kosong', url: denganIdBesar, body: { json: {} } },
    { nama: 'tanpa-content-type', url: denganIdAbc, body: { text: 'x=1' } },
    { nama: 'json-rusak', url: denganIdAbc, body: { raw: '{"a":' } },
    { nama: 'body-tipe-salah', url: denganIdBesar, body: { racun: true } },
  ];
}

/** Terapkan body sesuai jenisnya; tanpa body untuk GET/DELETE. */
function terapkanBody(req, varian) {
  if (!varian.body) return req;
  if (varian.body.json) return req.send(varian.body.json);
  if (varian.body.racun) return req.send(bodyRacun());
  if (varian.body.text) return req.set('Content-Type', 'text/plain').send(varian.body.text);
  if (varian.body.raw) return req.set('Content-Type', 'application/json').send(varian.body.raw);
  return req;
}
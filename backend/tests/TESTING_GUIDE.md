# Testing Guide — BIMA UNGGUL

## Menjalankan test

```bash
npm test                  # root: seluruh workspace (backend + frontend)
npm run test -w backend   # hanya backend
npx vitest run <file>     # satu file (dari backend/)
```

Backend suite (Vitest + supertest, `tests/**/*.test.js`, `fileParallelism: false` — satu DB dev):

| File | Cakupan |
|------|---------|
| `api.integration.test.js` | Health, helmet headers, login (gated `BACKEND_TEST_NIP/PASS`), periode CRUD, guard overlap, endpoint publik (periode fixture sendiri) |
| `unit.services.test.js` | `deriveStatus` periode + `HttpError` |
| `scoring.integration.test.js` | Formula per_capaian/persentase, live-compute tanpa cache, tie-breaker 4 level, BMU fallback |
| `validation.integration.test.js` | Queue validasi, approve/reject/revoke + audit, DeleteRequest, atomicity rollback, pagination |
| `publicAdmin.integration.test.js` | Leaderboard publik, isolasi linkBukti, periode CRUD, finalisasi/reopen lock, bobot recalc, akun CRUD, PDF/Excel buffer, audit-log filter |

Semua suite fixture-scope (prefix `BMU-TEST`/`E2E-VAL`/`PUBADM`, periode khusus) dan
membersihkan sebelum + sesudah run. Test tidak boleh menghapus data riil.

Creds opsional untuk `api.integration.test.js` (login admin):
`BACKEND_TEST_NIP` + `BACKEND_TEST_PASS` di `backend/.env`. Tanpa creds, 6 test
yang butuh login di-skip otomatis (`hasCreds ? it : it.skip`) — suite tetap
hijau, hanya jumlah test yang jalan berkurang (52 dari 58).

### `backend/.env` dimuat otomatis saat test

[setup-env.js](setup-env.js) (terdaftar sebagai `setupFiles` di
[vitest.config.js](../vitest.config.js)) memuat `backend/.env` ke `process.env`.
Ini perlu karena **Prisma CLI membaca `.env` sendiri, tapi `@prisma/client` saat
runtime tidak** — dia hanya melihat `process.env`. Tanpa setup ini,
`npx vitest run` di lokal gagal `Environment variable not found: DATABASE_URL`
walaupun `backend/.env` sudah ada dan gate `dbGate()` sudah membuka suite-nya.

Jadi cukup: siapkan `backend/.env` (lihat `.env.example`), lalu `npm test -w backend`.
Env yang sudah ada di shell/CI tetap menang karena dotenv tidak menimpa.

### Gate `DATABASE_URL` (suite integrasi)

Empat dari lima file di atas menyentuh MySQL. Tanpa `DATABASE_URL`, Prisma melempar
`PrismaClientInitializationError` di `beforeAll` dan seluruh file dilaporkan
gagal — itu kondisi environment, bukan regresi. Karena itu suite yang butuh DB
di-gate dengan `describe.skipIf(!dbGate())` ([helpers/dbGate.js](helpers/dbGate.js)):
file tetap muncul di laporan sebagai *skipped*, disertai satu baris alasan.

`dbGate()` mengembalikan `true` bila `DATABASE_URL` ada di `process.env` **atau**
di `backend/.env` (Prisma membaca `.env` lewat dotenv, sedangkan `process.env`
hanya terisi kalau variabelnya di-export di shell — keduanya dicek supaya gate
tidak salah-sense di kedua arah).

Cara menyiapkan: `cp .env.example .env`, isi `DATABASE_URL` (MySQL dev lokal),
lalu `npm run prisma:deploy -w backend` + seed. Karena `backend/.env` ada di
`.gitignore`, pada checkout bersih `npm test` di backend hanya menjalankan
suite DB-free (`unit.services.test.js` + blok health di
`api.integration.test.js`) — itu perilaku yang diharapkan, bukan kegagalan.
Untuk benar-benar menjalankan 58 test, siapkan DB dengan urutan di bagian CI
di bawah.

Suite yang di-gate: `scoring`, `validation`, `publicAdmin`, dan blok
"Endpoint publik (tanpa auth)" di `api.integration.test.js`. Suite DB-free
(`API health`) tidak di-gate dan harus tetap hijau di environment mana pun.

## CI — `.github/workflows/ci.yml`

Jalan di tiap push (semua branch) dan tiap PR ke `master`. Dua job paralel:

| Job | Langkah |
|-----|---------|
| `frontend` | `npm ci` → lint → test → build (`VITE_API_URL=''`) |
| `backend` | `npm ci` → `prisma:generate` → `prisma:deploy` → **check-drift** → seed indikator → seed akun admin → lint → test |

Job `backend` memakai **service container MySQL 8.4** sekali pakai, bukan DB yang
sudah ada. Alasannya: seluruh suite integrasi harus benar-benar jalan — kalau
CI hanya menjalankan suite DB-free, 39 test di-skip dan regresi backend lolos ke
`master`. Kredensial admin fixture diambil dari
`scripts/create-dummy-accounts.mjs` dan di-set sebagai `BACKEND_TEST_NIP/PASS`
supaya 5 test CRUD admin/akun/madrasah ikut jalan (tanpa itu, gate `hasCreds`
men-skip-nya).

Manfaat utamanya: database CI selalu **kosong dan dibangun murni dari
migration**, sehingga (a) test yang diam-diam bergantung pada data yang
kebetulan ada di DB dev langsung ketahuan, dan (b) drift antara
`schema.prisma` dan folder `migrations/` ikut terungkap saat migration
di-`deploy` ke DB segar.

Contoh nyata yang ditangkap mekanisme ini: kolom `User.status` sudah ada di
`schema.prisma` sejak commit baseline tapi belum punya migration — DB dev punya
kolom itu karena ditambahkan manual, sementara DB hasil `migrate deploy` tidak.
Migration `20261002143000_add_user_status` menutup celah itu.

### Gate drift `schema.prisma` ↔ `migrations`

Step **Check schema ↔ migrations drift** (`npm run prisma:check-drift -w backend`)
gagal kalau schema dan hasil migration tidak sinkron. Isinya
[scripts/check-schema-drift.mjs](../scripts/check-schema-drift.mjs): jalankan
`prisma migrate diff --from-url $DATABASE_URL --to-schema-datamodel` lalu nilai
exit code-nya (0 sinkron, 2 ada beda) dan cetak diff-nya.

Gate-nya memakai database CI yang baru saja di-`migrate deploy` **murni dari
folder `migrations/`**, jadi yang dibandingkan adalah “hasil migration” vs
“schema”, bukan keadaan DB dev siapa pun. Inilah yang membuat kelas bug
`User.status` ketahuan otomatis: menambah kolom di schema tanpa migration akan
membuat gate merah, bukan baru ketahuan saat setup DB baru.

### Cek drift di DB dev lokal

```bash
npm run db:check        # dari root project
```

Perintah yang sama dipakai CI, tapi di lokal dia memberi diagnosis lebih lengkap:

* **migration yang belum diterapkan** — daftar namanya + saran
  `npm run prisma:deploy -w backend`
* **beda struktur DB vs schema.prisma** — hasil `prisma migrate diff` lengkap

Sumber `DATABASE_URL`, berurutan: argumen CLI → environment → `backend/.env`.
Kalau `.env` sudah ada cukup `npm run db:check`; kalau belum, lewatkan URL-nya
langsung sebagai argumen:

```bash
npm run db:check -- "mysql://user:pass@host:3306/nama_db"
```

Perintah ini **read-only** (hanya `migrate status` + `migrate diff`), jadi aman
dijalankan kapan saja — termasuk saat dev server sedang jalan. Identitas DB yang
ditampilkan hanya host/port/nama database; password tidak ikut tercetak ke log.

Catatan: gate ini membandingkan DB hasil deploy, bukan folder migration secara
langsung. Setara untuk tujuan ini karena `migrate deploy` selalu mulai dari DB
kosong. Alternatif yang tidak butuh DB — `prisma migrate diff
--from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma
--shadow-database-url <url>` — memerlukan satu database shadow tambahan.

Migration tersebut dijaga dengan pengecekan `information_schema` (MySQL tidak
mendukung `ADD COLUMN IF NOT EXISTS`), jadi aman di dua kondisi: DB kosong
(kolom + index dibuat) dan DB dev yang kolomnya sudah ada (kolom dilewati,
index tetap dibuat kalau belum ada). Tanpa guard itu, `migrate deploy` di DB dev
akan gagal `Duplicate column name` dan memblokir semua migration berikutnya.

Migration `20261002153000_sync_schema_drift` menutup sisa drift yang sama:
index bergaya lama `idx_<Model>_<field>` di-rename ke penamaan default Prisma,
index sisa yang tidak dideklarasikan schema di-drop, `indikator.createdAt`
di-drop, dan kolom `@db.Text` yang di DB masih VARCHAR disamakan ke TEXT. Semua
pernyataannya dijaga `information_schema` juga, sehingga idempoten. Perubahan FK
`Validation.validatorId` diselesaikan di sisi schema (ditambah
`onDelete: Cascade` di [schema.prisma](../prisma/schema.prisma)) karena DB nyata
memang CASCADE dan mengubahnya ke RESTRICT akan mematahkan `deleteAkun` serta
`npm run dummy:clean`.

`DEFAULT 'menunggu'` hanya berlaku untuk kolom yang BENAR-BENAR baru dibuat, dan
migration kini memuat backfill-nya sendiri: begitu kolom terbuat, seluruh baris
yang baru saja menerima default langsung diset `aktif`. Kondisi `@col_exists = 0`
membuat backfill dilewati di DB dev yang kolomnya sudah ada (ditambahkan manual),
sehingga registrasi operator yang masih menunggu approval tidak ikut ter-approve —
perhitungan clone DB dev menunjukkan 62 baris tetap `aktif`.

Tanpa backfill itu, semua sesi produksi mati pada refresh pertama setelah
deploy: `authController.js` menolak token untuk `status !== 'aktif'` tanpa
membedakan role (login sendiri tidak memeriksa status, jadi akun terlihat bisa
dilogin tapi langsung logout lagi).

Kalau Anda menjalankan versi migration lama — tanpa backfill — dan seluruh akun
tiba-tiba berstatus `menunggu`, pulihkan dengan:

```sql
UPDATE `User` SET `status` = 'aktif' WHERE `status` = 'menunggu';
```

Cakupannya **semua role**, bukan hanya `admin`. Kueri `WHERE role = 'admin'`
mengunci seluruh akun operator, yang justru harus menunggu approval.

### Menjalankan pipeline yang sama secara lokal

```bash
# DB sekali pakai (buang setelah selesai)
DATABASE_URL="mysql://root:@127.0.0.1:3306/bima_unggul_test" npm run prisma:deploy -w backend
DATABASE_URL="..." npm run prisma:seed -w backend
cd backend && DATABASE_URL="..." node scripts/create-dummy-accounts.mjs

# lalu test dengan kredensial fixture
DATABASE_URL="..." BACKEND_TEST_NIP=199012312345678901 BACKEND_TEST_PASS=Admin12345 \
  npm test -w backend
```

Pakai database terpisah — **jangan** arahkan ke `bima_unggul` (DB dev): suite
membersihkan fixture-nya sendiri, tapi seed akun dummy dan periode uji tetap
menulis ke DB yang Anda gunakan sehari-hari.

## Legacy transition (2026-08-30)

Ad-hoc script `testScoring.js`, `testValidationE2E.js`, `testPublicAndAdminE2E.js`
dan `testPublicAndAdminE2E.js` sudah dimigrasi ke Vitest (commit `f8e851b`,
`d34a309`) lalu dihapus; script `test:scoring`/`test:validation`/`test:e2e`
dihapus dari package.json. Jangan menambah test sebagai script `node tests/*.js`
lagi — tempatnya di Vitest suite.

## Gap coverage (belum ditest otomatis)

- Flow register operator → approve admin → madrasah dibuat (manual via API, belum ada test end-to-end)
- Refresh token & logout (manual)
- Frontend rendering (belum ada komponen test — hanya 2 test util; UI diverifikasi via smoke manual/browser)

Script aman (tooling, bukan test): `scripts/smoke-*.mjs`, `scripts/create-dummy-accounts.mjs`, `scripts/clean-dummy.mjs` (purge hanya data dummy/test, KEEP admin + operator asli).

## Kontrak & QA manual — revisi 9 indikator (2026-09-14)

`unit.services.test.js` memuat guard kontrak `FIELD_RULES`: tepat 9 slug, `linkBukti` wajib (type url)
di semua indikator, `catatan` opsional, **tidak ada field `tahun`** di kontrak API
(tahun bukti diisi otomatis dari periode aktif), dan `penyebut.min === 0` untuk
`rapor_rata_rata`/`rasio_penerimaan` (format "0 dari 0 = 0%" diizinkan).

QA manual kebijakan **"bukti wajib tahun berjalan"**: chip **Tahun {tahun}** tampil di kolom Indikator
Antrian Validasi + modal detail. Admin memverifikasi isi link bukti; jika bukan tahun berjalan →
**Reject** dengan alasan (mekanisme reject + alasan sudah ada).

| Skenario | Langkah | Hasil diharapkan |
|---|---|---|
| QB-1 | Operator submit capaian dengan bukti tahun lama → Admin buka detail | Chip "Tahun {tahun}" tampil; reject + alasan → status Ditolak, operator perbaiki via US4 |
| QB-2 | Operator input ratio `0 dari 0` (indikator 6/9) | Tersimpan, preview `0%`, skor indikator 0 — tidak error validasi |
| QB-3 | Draft parsial tanpa link bukti → klik Kirim | Draft boleh; submit ditolak `linkBukti wajib diisi` |
| QB-4 | Semua indikator: submit tanpa link bukti | Ditolak (linkBukti wajib di 9 indikator) |

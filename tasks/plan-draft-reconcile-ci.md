# Plan: Memastikan CI `draftReconcile` Lulus Tanpa Seed Periode Produksi

## Status saat ini

Perbaikan inti sudah ada di commit `e97bb0b` pada branch `master`. Fixture di `backend/tests/draftReconcile.integration.test.js` membuat periode aktif ber-prefix `E2E-REC` hanya jika database tidak memiliki periode aktif, lalu cleanup menghapus data dengan prefix tersebut. Seed produksi tidak perlu diubah. Commit mencatat verifikasi pada database CI kosong: 98/98 tes lulus.

Plan ini berfokus pada memastikan hasil tersebut tetap berlaku pada run CI terbaru dan tidak pernah memerlukan data periode produksi.

## Tujuan

Backend CI lulus pada database MySQL sementara yang dibuat kosong dari migrations, sedangkan database produksi tetap tanpa periode aktif sampai periode dibuat melalui proses bisnis yang disengaja.

## Keputusan

- Jangan menambahkan periode aktif ke `backend/prisma/seed.js` atau membuatnya melalui migration.
- Pertahankan fixture periode pada tes integrasi, dengan namespace yang dibersihkan oleh tes.
- Jalankan integrasi hanya pada database test/CI. Workflow saat ini memakai service MySQL dan `bima_unggul_ci`.
- Perlakukan status CI terbaru sebagai verifikasi akhir; hasil historis dari commit bukan pengganti pemeriksaan run terbaru.

## Task List

### Task 1: Pastikan boundary database test dan produksi

**Deskripsi:** Tinjau konfigurasi workflow agar migrasi dan tes backend memakai database MySQL sementara `bima_unggul_ci`, bukan kredensial database produksi.

**Kriteria penerimaan:**
- [x] Workflow backend memakai MySQL service sementara dan `DATABASE_URL` mengarah ke `bima_unggul_ci`.
- [x] Tidak ada URL produksi di konfigurasi job tes yang ditinjau.
- [x] `NODE_ENV=test` aktif untuk job backend.

**Verifikasi:** Ditinjau pada `.github/workflows/ci.yml`; database service, nama database `bima_unggul_ci`, dan `NODE_ENV=test` terkonfirmasi.

**Dependensi:** Tidak ada.

**Berkas terkait:** `.github/workflows/ci.yml`.

**Estimasi:** Kecil.

### Task 2: Konfirmasi fixture tidak mengubah seed produksi

**Deskripsi:** Pastikan tes membuat periode aktif sendiri hanya saat resolver tidak menemukan periode, dan cleanup membatasi penghapusan ke data yang dimiliki fixture.

**Kriteria penerimaan:**
- [x] Periode aktif untuk database kosong dibuat oleh fixture `draftReconcile`, bukan seed atau migration produksi.
- [x] Nama periode menggunakan namespace `E2E-REC` dan cleanup membatasi penghapusan ke namespace fixture.
- [x] Seed aplikasi tidak membuat periode aktif.

**Verifikasi:** Review commit `e97bb0b`, file tes, cleanup, dan `backend/prisma/seed.js`.

**Dependensi:** Tidak ada.

**Berkas terkait:** `backend/tests/draftReconcile.integration.test.js`, `backend/prisma/seed.js`.

**Estimasi:** Kecil; perubahan inti sudah dilakukan.

### Task 3: Verifikasi ulang urutan pipeline pada DB kosong

**Deskripsi:** Jalankan kembali job backend dari awal pada MySQL kosong dengan urutan workflow yang sebenarnya: generate client, migrate deploy, schema drift check, seed indikator dan akun CI, lint, lalu tes.

**Kriteria penerimaan:**
- [x] Setup `draftReconcile.integration.test.js` berhasil pada pipeline CI dengan DB sementara.
- [x] Semua tes backend dalam job lulus pada run CI terbaru.
- [x] Tidak ada perubahan pada seed produksi untuk membuat periode aktif.

**Verifikasi:** GitHub Actions run `38882744222` pada commit `66a9748` selesai sukses; job backend dan frontend sama-sama `success`. Commit `e97bb0b` juga mencatat 98/98 tes lulus pada simulasi database CI kosong.

**Dependensi:** Task 1 dan Task 2.

**Berkas terkait:** `.github/workflows/ci.yml`, `backend/tests/draftReconcile.integration.test.js`.

**Estimasi:** Kecil.

### Checkpoint: Selesai

- [x] Run CI terbaru pada commit yang memuat `e97bb0b` berstatus hijau untuk job backend.
- [x] Database produksi tidak menerima periode aktif atau fixture test dari langkah ini; perubahan hanya menyentuh fixture tes dan dokumen.

## Risiko dan mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| CI dijalankan dengan `DATABASE_URL` produksi karena salah konfigurasi | Tes dapat menulis/menghapus data produksi | Pastikan job memakai service MySQL disposable dan URL khusus CI sebelum menjalankan tes |
| Tes lokal memakai periode aktif yang sudah ada | Data fixture lokal tidak sepenuhnya menyerupai DB kosong CI | Verifikasi kasus DB kosong pada service CI; jangan mengubah data produksi demi menyamakan lingkungan |
| Cleanup fixture gagal setelah tes | Sisa data pada DB yang dipakai ulang | CI saat ini memakai DB sekali pakai per run; pertahankan namespace `E2E-REC` untuk cleanup terarah |

## Dokumentasi

- Context7 `/prisma/web`: `migrate deploy` menerapkan migrations; seed dijalankan sebagai langkah terpisah.
- Konfigurasi spesifik proyek: `.github/workflows/ci.yml` dan commit `e97bb0b`.

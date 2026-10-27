# Hasil implementasi empat kelompok madrasah

Tanggal: 27 Oktober 2026. Lingkungan: checkout lokal dan MySQL dummy yang sudah ada.

## Hasil

- Kelompok ranking: **RA, MI, MTS, MA**. Negeri/swasta digabung per jenjang; kepemilikan tetap tersimpan di profil.
- Nilai kanonis database/API: `RA`, `MI`, `MTs`, `MA`; label kelompok di UI/laporan menggunakan `MTS`.
- Berlaku pada semua periode. Ranking dihitung saat dibaca, sehingga hasil lama dan ekspor ulang langsung memakai pengelompokan baru.
- RA diterima pada pendaftaran, persetujuan akun, dan pembuatan madrasah admin. RA memakai sembilan indikator, persyaratan bukti, rumus, dan bobot periode yang sama.
- Filter lama seperti `MI Negeri`, `MI Swasta`, dan `MTs Negeri` tetap diterima dan dinormalisasi ke jenjangnya. URL leaderboard ikut dinormalisasi tanpa kehilangan periode.
- Filter publik, admin, validasi, ekspor, profil/operator, seed, dan panduan sudah diselaraskan.
- Tidak ada backup, salinan database, seed ulang dataset, deployment, atau commit.

## Migrasi aktual

Migrasi [20261027040000_kelompok_jenjang_ra](../backend/prisma/migrations/20261027040000_kelompok_jenjang_ra/migration.sql) sudah diterapkan dan Prisma Client sudah diregenerasi.

| Data | Sebelum | Sesudah migrasi |
| --- | ---: | ---: |
| Madrasah | 60 | 60 |
| Akun | 61 | 61 |
| Submission | 1.083 | 1.083 |
| Validasi | 1.085 | 1.085 |
| Bobot | 9 | 9 |
| Periode | 1 | 1 |

Kelompok saat ini: RA 0, MI 20, MTS 20, MA 20. Fixture RA dibuat sementara oleh pengujian dan dibersihkan sesudahnya; tidak ditambahkan ke dataset pengguna.

Hash pembanding sebelum/sesudah migrasi sama untuk master selain kelompok/updatedAt, identitas dan relasi akun, submission, validasi, bobot, periode, serta seluruh skor individual per periode. ID, nomor BMU, slug, kepemilikan, dan bukti tetap. Baseline ini hanya catatan jumlah/hash, bukan backup data.

Perbandingan string migrasi SQL menggunakan `BINARY` agar tidak terkena perbedaan kolasi MySQL. Script pemeliharaan juga menangkap perubahan kapitalisasi melalui ID hasil pemeriksaan, mencakup madrasah nonaktif dan menulis audit hanya ketika ada perubahan.

Urutan yang digunakan, dari folder backend:

```powershell
node scripts/migrate-kelompok.mjs
node node_modules/prisma/build/index.js migrate deploy
node node_modules/prisma/build/index.js generate
node scripts/migrate-kelompok.mjs --apply
node scripts/check-schema-drift.mjs
```

Dry-run awal menemukan 60 perubahan. Setelah migrasi SQL, script `--apply` menemukan 0 perubahan dan 0 update. Pengujian integrasi terpisah membuktikan dry-run tidak menulis, apply memperbaiki fixture nonaktif dengan kapitalisasi lama, serta pengulangan tidak menulis perubahan/audit baru.

Backend lokal sudah direstart menggunakan source akhir; Vite yang sudah berjalan digunakan kembali. Preview: `http://127.0.0.1:5173`.

## Verifikasi

- Backend: delapan file terarah, **99 tes lulus, 6 skipped** setelah satu fixture tie-breaker lama diperbaiki dan suite scoring dijalankan ulang. Enam tes API memerlukan kredensial admin `BACKEND_TEST_NIP`/`BACKEND_TEST_PASS`; tidak dihitung lulus.
- Suite baru mencakup RA negeri/swasta pada pendaftaran/approval dan admin, sembilan indikator dengan skor/bobot setara MI, ranking gabungan pada periode aktif/finalisasi/arsip, tie-breaker, filter admin/validasi, ekspor RA periode arsip, serta migrasi idempoten.
- Periode finalisasi/arsip tetap menolak perubahan bobot dengan HTTP 423.
- Frontend: tiga file filter/dashboard, **11 tes lulus**. Dashboard operator diverifikasi kembali setelah penyesuaian label.
- Lint backend dan frontend lulus. Build frontend lulus; Vite masih memberi peringatan chunk besar pada dependensi chart.
- Pemeriksaan schema drift lulus: schema dan seluruh migration cocok dengan MySQL.
- Workbook hasil ekspor dibaca kembali dengan ExcelJS untuk memeriksa bagian, nama madrasah, kelompok, dan skor. PDF berhasil dibuat dan signature diperiksa; tata letak PDF tidak diaudit visual.
- Pemeriksaan browser terbatas: tautan `MI Negeri` menjadi `MI`, empat pilihan kelompok tampil, negeri/swasta tampil dalam ranking yang sama, dan RA kosong tertangani. CLI agent-browser tidak tersedia, sehingga pemeriksaan memakai browser preview bawaan.
- Endpoint lokal `/api/health` mengembalikan `OK`; `/api/stats` mengembalikan 60 madrasah dan 4 kelompok.

Graphify diperbarui secara terarah pada 49 source berubah serta entitas keputusan pengelompokan README/PRD: 1.144 node, 2.318 relasi, 100 komunitas; biaya AST 0 token. Diagnostik tidak menemukan endpoint hilang, relasi menggantung, self-loop, atau relasi terkolaps. Parser AST memberi peringatan ekstraksi parsial pada IntroSection JSX, meskipun build Vite lulus; tiga migration SQL lama dan satu file unit test tidak menghasilkan simbol. Dokumen lain tidak diekstraksi semantik ulang secara penuh. Detail: [laporan graph](../graphify-out/GRAPH_REPORT.md).

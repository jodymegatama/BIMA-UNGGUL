# Daftar tugas: empat kelompok RA, MI, MTS, MA

Status: implementasi selesai; hasil aktual dan batas verifikasi tercatat di [laporan implementasi](hasil-implementasi-empat-kelompok.md). Mengikuti keputusan pada [plan.md](plan.md).
Semua periode memakai pengelompokan baru; RA memakai sembilan indikator/bobot yang sama.
Seluruh data saat ini adalah dummy. Backup, salinan database, dan uji pemulihan backup tidak diperlukan.

## 1. Inventarisasi dan baseline migrasi
Dependensi: tidak ada. Cakupan: kecil, helper inventarisasi dan fixture/regresi migrasi baru.
- [x] Rekam jumlah data master, relasi, kelompok, nonaktif, pending, dan periode; laporkan ketidaksesuaian.
- [x] Rekam skor individual serta ranking beberapa periode termasuk final/arsip untuk pembanding.
- [x] Gunakan database dummy yang ada untuk pengujian migrasi, tanpa membuat backup atau salinan database.
Verifikasi: inventarisasi baca-saja; jumlah sebelum migrasi terdokumentasi, tanpa rahasia.

## 2. Schema RA dan kontrak kelompok backend
Dependensi: 1. Cakupan: sedang.
File utama: [schema.prisma](../backend/prisma/schema.prisma), migration baru, [periode.constants.js](../backend/src/constants/periode.constants.js), test helper kelompok baru.
- [x] Tambahkan RA ke Jenjang tanpa mengubah JenjangPendidikan S1/S2/S3.
- [x] Definisikan empat kelompok kanonis, label, dan alias kelompok lama.
- [x] Kontrak mempertahankan statusKepemilikan serta ID/BMU/slug.
Verifikasi: migration pada DB uji; pemeriksaan schema drift dan unit normalisasi alias.

## 3. Pendaftaran dan pembuatan madrasah
Dependensi: 2. Cakupan: sedang.
File utama: [authController.js](../backend/src/controllers/authController.js), [authService.js](../backend/src/services/authService.js), [madrasahService.js](../backend/src/services/madrasahService.js), [errorMapping.integration.test.js](../backend/tests/errorMapping.integration.test.js), [api.integration.test.js](../backend/tests/api.integration.test.js).
- [x] Validasi pendaftaran/admin menerima RA dan menolak nilai jenjang lain yang tidak dikenal.
- [x] deriveKelompok menghasilkan jenjang saja pada kedua jalur pembuatan.
- [x] Akun pending sebelum migrasi tetap bisa disetujui dan membentuk kelompok baru.
Verifikasi: uji RA kedua kepemilikan pada jalur daftar/approve dan admin; periksa retensi identitas.

## 4. Backfill data lama
Dependensi: 1–3. Cakupan: kecil, script backfill dan regresi migrasi baru.
- [x] Sediakan dry-run dan eksekusi idempoten, mencakup madrasah aktif serta soft-deleted.
- [x] Kelompok hasil backfill sama dengan jenjang; relasi/capaian/bobot tidak diubah.
- [x] Catat perubahan baru tanpa menulis ulang audit log historis.
Verifikasi: jalankan dua kali pada DB dummy yang ada; run kedua tidak menambah perubahan; jumlah relasi dan skor individual sama.

## Checkpoint A: data dan pembentukan kelompok
- [x] RA diterima, data lama dapat dimigrasi, dan jalur pembuatan tidak lagi menghasilkan enam kelompok.
- [x] Hasil pembanding jumlah data/skor dummy tersedia sebelum uji migrasi.

## 5. Ranking publik dan statistik
Dependensi: 2–4. Cakupan: sedang.
File utama: [scoringService.js](../backend/src/services/scoringService.js), [publicController.js](../backend/src/controllers/publicController.js), [scoring.integration.test.js](../backend/tests/scoring.integration.test.js), [api.integration.test.js](../backend/tests/api.integration.test.js).
- [x] Ranking per jenjang menggabungkan negeri/swasta untuk semua periode, dengan empat kunci kelompok.
- [x] Skor dan tie-breaker tetap; profil detail dan statistik memakai kontrak yang sama.
- [x] RA kosong ditangani; alias lama dinormalisasi dan respons memakai kelompok kanonis.
Verifikasi: test scoring/API terarah, termasuk final/arsip dan baseline skor.

## 6. Filter admin dan antrean validasi
Dependensi: 2, 4, 5. Cakupan: kecil.
File utama: [madrasahService.js](../backend/src/services/madrasahService.js), [validationService.js](../backend/src/services/validationService.js), [validation.integration.test.js](../backend/tests/validation.integration.test.js).
- [x] Filter RA/MI/MTs/MA dan alias lama memberi himpunan lembaga/capaian yang benar.
- [x] Nonaktif/aktif tetap mengikuti aturan semula.
- [x] Status kepemilikan tetap tersedia sebagai atribut.
Verifikasi: test filter kelompok dengan lembaga negeri dan swasta serta satu kelompok pembanding.

## 7. Registry frontend dan formulir
Dependensi: 2–3. Cakupan: sedang.
File utama: [indikator.js](../frontend/src/constants/indikator.js), [DaftarForm.jsx](../frontend/src/components/auth/DaftarForm.jsx), [MadrasahForm.jsx](../frontend/src/components/admin/MadrasahForm.jsx), test form/registry terarah bila diperlukan.
- [x] Form daftar/tambah admin menyediakan RA dan tetap menyediakan kepemilikan.
- [x] Dropdown/filter memakai registry empat kelompok, dengan label MTS dan nilai MTs konsisten.
- [x] Keterangan kelompok mengikuti jenjang; sembilan indikator/form bukti tetap berlaku bagi RA.
Verifikasi: pemeriksaan payload form dan satu alur RA; perubahan teks cukup diinspeksi.

## 8. Leaderboard dan tampilan operator
Dependensi: 5, 7. Cakupan: sedang.
File utama: [Leaderboard.jsx](../frontend/src/pages/public/Leaderboard.jsx), [MadrasahDetail.jsx](../frontend/src/pages/public/MadrasahDetail.jsx), [ProfilMadrasah.jsx](../frontend/src/pages/operator/ProfilMadrasah.jsx), [operatorData.js](../frontend/src/lib/operatorData.js), [Dashboard.test.jsx](../frontend/src/pages/operator/Dashboard.test.jsx).
- [x] URL/fallback lama dinormalisasi; filter publik tepat empat kelompok.
- [x] Detail/profil/dashboard operator menampilkan ranking kelompok gabungan.
- [x] Status kepemilikan tetap terbaca dan kelompok kosong tidak menyebabkan kegagalan.
Verifikasi: test URL/pemanggil ranking terarah dan inspeksi tampilan terkait; komponen turunan yang hanya membaca registry tidak diubah tanpa kebutuhan.

## 9. Ringkasan dan filter admin di UI
Dependensi: 5–7. Cakupan: sedang.
File utama: [Dashboard.jsx](../frontend/src/pages/admin/Dashboard.jsx), [ValidasiFilterBar.jsx](../frontend/src/components/admin/ValidasiFilterBar.jsx), [AntreanValidasi.jsx](../frontend/src/pages/admin/AntreanValidasi.jsx), [Dashboard.test.jsx](../frontend/src/pages/admin/Dashboard.test.jsx), [ValidasiFilterBar.test.jsx](../frontend/src/components/admin/ValidasiFilterBar.test.jsx).
- [x] Ringkasan dan chip filter memakai empat kategori, dengan jumlah lembaga tetap benar.
- [x] Permintaan antrean dikirim menggunakan kelompok kanonis.
- [x] Pengoperasian filter dengan pointer/keyboard tetap berjalan.
Verifikasi: test filter/dashboard yang sudah ada disesuaikan; tidak menguji ulang seluruh UI.

## Checkpoint B: alur aplikasi
- [x] RA dapat masuk alur daftar/approve/capaian/ranking.
- [x] Madrasah negeri dan swasta berada dalam ranking yang sama per jenjang.
- [x] Kelompok/jumlah pada publik, operator, dan admin konsisten.

## 10. Ekspor PDF/Excel
Dependensi: 5, 7. Cakupan: sedang.
File utama: [exportService.js](../backend/src/services/exportService.js), [exportController.js](../backend/src/controllers/admin/exportController.js), [ExportLaporan.jsx](../frontend/src/pages/admin/ExportLaporan.jsx), [publicAdmin.integration.test.js](../backend/tests/publicAdmin.integration.test.js).
- [x] Pilihan ekspor menjadi Semua/RA/MI/MTs/MA; hilangkan asumsi dua kelompok per jenjang.
- [x] Alias jenjang dan kelompok lama berfungsi; konflik parameter tetap ditolak.
- [x] Bagian, urutan, ranking, label, serta nama berkas konsisten dengan leaderboard, termasuk periode lama.
Verifikasi: test ekspor yang ada; inspect satu PDF dan satu workbook hasil fixture gabungan/RA pada implementasi.

## 11. Fixture integrasi yang masih memakai kelompok lama
Dependensi: 3–6, 10. Cakupan: sedang.
File utama: [draftReconcile.integration.test.js](../backend/tests/draftReconcile.integration.test.js), [validation.integration.test.js](../backend/tests/validation.integration.test.js), [errorMapping.integration.test.js](../backend/tests/errorMapping.integration.test.js), [scoring.integration.test.js](../backend/tests/scoring.integration.test.js), [publicAdmin.integration.test.js](../backend/tests/publicAdmin.integration.test.js).
- [x] Fixture menyimpan jenjang dan kepemilikan secara terpisah; tidak memecah string kelompok baru untuk mengambil kepemilikan.
- [x] Fixture aturan baru menggunakan kelompok kanonis; contoh kelompok lama dipertahankan hanya untuk migrasi/kompatibilitas.
- [x] Data uji terisolasi dan pembersihannya tidak menghapus data nyata.
Verifikasi: jalankan hanya suite terdampak pada DB uji dengan kredensial fixture; jangan menganggap test yang skipped sebagai lulus.

## 12. Seed dan dokumentasi proyek
Dependensi: 2–5, 10. Cakupan: sedang.
File utama: [seed-demo.js](../backend/prisma/seed-demo.js), [seed-leaderboard-60.mjs](../backend/prisma/seed-leaderboard-60.mjs), [create-dummy-accounts.mjs](../backend/scripts/create-dummy-accounts.mjs), [README.md](../README.md), [PRD.md](../PRD.md).
- [x] Seed/dummy menghasilkan kelompok baru dan menyediakan contoh RA di lingkungan uji.
- [x] Dokumentasi menjelaskan empat kelompok, penerapan semua periode, dan indikator RA yang sama.
- [x] Nama lembaga yang mengandung Negeri/Swasta tetap utuh.
Verifikasi: inspeksi seed dan jalankan seed hanya pada DB uji bila dipakai oleh test; pemeriksaan teks lama yang kontekstual.

## 13. Panduan dan copy pengguna
Dependensi: 7–10. Cakupan: kecil.
File utama: [IntroSection.jsx](../frontend/src/components/public/tentang/IntroSection.jsx), [Panduan.jsx](../frontend/src/pages/operator/Panduan.jsx), [IDEA.md](../IDEA.md).
- [x] Cakupan jenjang mencantumkan RA; contoh kelompok menggunakan jenjang saja.
- [x] Teks jumlah kelompok yang otomatis mengikuti registry menampilkan empat.
- [x] Informasi status kepemilikan serta sembilan indikator tetap jelas.
Verifikasi: inspeksi teks; tidak menambah test yang hanya menyalin copy.

## 14. Rehearsal, verifikasi akhir, dan rilis
Dependensi: seluruh tugas sebelumnya. Cakupan: pelaksanaan, tanpa perubahan fitur tambahan.
- [x] Uji migrasi pada DB dummy yang ada lulus: jumlah/relasi terjaga, skor sama, ranking gabungan benar, final/arsip tetap terkunci.
- [x] Test terarah terdampak, satu build frontend, dan gate migration/schema drift yang relevan lulus; pertahankan CI yang ada.
- [x] Dokumentasikan urutan migrasi data dummy, pergantian backend/frontend, dan pemeriksaan akhir; tidak ada langkah backup atau uji pemulihan.
Verifikasi: daftar hasil aktual dicatat setelah implementasi, termasuk pemeriksaan yang tidak dapat dijalankan.

## Checkpoint akhir
- [x] Tepat empat kelompok tersedia di seluruh permukaan aplikasi.
- [x] Periode lama dan ekspor ulang mengikuti keputusan pengguna.
- [x] Data master, akun, capaian, validasi, dan bukti tidak hilang.
- [x] Graphify diperbarui pada 49 source berubah dan entitas keputusan kelompok; lihat batas parser di laporan hasil.

## Pemeriksaan yang benar-benar dilakukan pada tahap rencana

- [x] Telusuri graph dan cocokkan dengan schema, layanan, UI, seed, serta test aktual.
- [x] Konfirmasikan cakupan semua periode dan sembilan indikator RA kepada pengguna.
- [x] Susun plan, dependensi, acceptance criteria, dan skenario verifikasi.
- [x] Pertahankan rencana MySQL terdahulu yang sudah selesai sebagai arsip.
- [x] Implementasi, test terarah, build, dan migrasi telah dikerjakan; enam tes API berkredensial tetap skipped dan audit visual PDF tidak dilakukan.

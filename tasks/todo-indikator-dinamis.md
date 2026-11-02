# Tugas: indikator dinamis

Status: implementasi lokal selesai; bukti dan batas verifikasi dicatat di [laporan hasil](hasil-implementasi-indikator-dinamis.md). Acuan: [plan-indikator-dinamis.md](plan-indikator-dinamis.md). Dokumen plan/todo pekerjaan sebelumnya dipertahankan.
Setiap tugas mencakup tes terarah atas perilaku yang berubah. Jalankan perintah dari direktori aplikasi terkait; test database harus benar-benar berjalan pada DB uji yang sesuai.

## 1. Kontrak konfigurasi dan baseline
Dependensi: tidak ada. Cakupan: sedang, maksimal lima file utama.
File: kontrak konfigurasi baru di `backend/src/constants/`, fixture baseline baru, test kontrak baru, dokumentasi kontrak.
- [x] Tetapkan schema metadata, field whitelist, revisi, status input, error API, empat metode dan lifecycle sesuai rencana.
- [x] Rekam skor/subtotal/ranking/jumlah relasi semua periode sebelum perubahan; catat data yang tidak lengkap.
- [x] Catat versi lockfile, semua konsumen daftar/form/rumus, dan urutan deployment.
Verifikasi: fixture mencakup empat metode dan periode aktif/final/arsip; baseline baca-saja dapat diulang.

## 2. Schema konfigurasi periode dan proteksi hapus
Dependensi: 1. Cakupan: sedang.
File: `backend/prisma/schema.prisma`, migration baru, test integritas baru.
- [x] Tambah default master, snapshot periode termasuk deskripsi indikator, status menerima input, dan revision secara aditif.
- [x] Pertahankan unique indikator/periode dan ubah referensi master menjadi Restrict.
- [x] Migrasi tidak mengubah identitas capaian atau aturan hapus periode existing.
Verifikasi: generate client, migrate pada DB uji, `npm run prisma:check-drift`, tes FK/histori.

## 3. Backfill dan bootstrap non-destruktif
Dependensi: 2. Cakupan: sedang.
File: script migrasi baru, `backend/prisma/seed.js`, fixture default formulir baru, test migrasi baru.
- [x] Backfill semua pasangan periode/indikator, termasuk bobot kosong, tanpa menulis ulang bobot lama.
- [x] Dry-run, laporan anomali dan eksekusi idempoten tersedia.
- [x] Seed ulang mempertahankan edit admin dan status nonaktif; deskripsi awal berasal dari penjelasan existing, konten yang belum tersedia ditandai belum lengkap.
Verifikasi: jalankan migrasi dua kali pada DB uji; relasi utuh dan baseline angka tetap sama.

## 4. Pembaca konfigurasi dan scoring periode
Dependensi: 3. Cakupan: sedang.
File: layanan konfigurasi baru, `scoringService.js`, test engine, `scoring.integration.test.js`.
- [x] Skor memakai metode snapshot periode; empat algoritme mempertahankan hasil lama.
- [x] Konfigurasi kosong/invalid dibedakan dari nilai nol; hasil tidak menghasilkan NaN/Infinity.
- [x] Detail dan ranking memakai pembaca yang sama dengan query batch yang tetap efisien.
Verifikasi: tes empat contoh, rasio agregat, nol, perubahan master, dan parity semua baseline.

## Checkpoint A
- [x] Schema drift bersih, backfill idempoten, hasil lama sama, dan final/arsip tetap terbaca.

## 5. CRUD master backend
Dependensi: 4. Cakupan: sedang.
File: service/controller indikator baru, `admin.routes.js`, integration test CRUD baru.
- [x] Create/read/update/status/urutan dan delete tersedia untuk admin; kode/slug stabil dan unik.
- [x] Delete master dengan konfigurasi/capaian ditolak; operator tidak dapat memutasi.
- [x] Mutasi dan audit atomik; konflik revisi dan input invalid menjadi respons terstruktur.
Verifikasi: `npm test -- tests/indikator.integration.test.js` setelah file dibuat; uji delete race dan otorisasi.

## 6. Konfigurasi periode, bobot, dan preview backend
Dependensi: 5. Cakupan: sedang.
File: service/controller konfigurasi, routes, `bobotService.js`, test konfigurasi baru.
- [x] Tambah indikator ke periode menyalin snapshot; bobot tervalidasi sesuai metode.
- [x] Form/metode terkunci setelah ada capaian; preview memakai engine skor aktual tanpa persistensi.
- [x] Adapter bobot existing mendelegasikan ke sumber konfigurasi yang sama.
Verifikasi: uji preview vs actual score, revisi basi, bobot nol/kosong, dan payload konfigurasi tidak sah.

## 7. Integrasi lifecycle periode
Dependensi: 6. Cakupan: sedang.
File: `periodService.js`, layanan konfigurasi, test lifecycle periode, script/fixture periode yang perlu disesuaikan.
- [x] Periode baru memperoleh snapshot default aktif; penyalinan bobot dilakukan eksplisit.
- [x] Finalisasi menolak konfigurasi tidak lengkap dan mengunci semua metadata periode; reopen memakai alasan/audit.
- [x] Finalisasi/configure bersamaan aman; hapus periode tetap mengikuti kebijakan existing.
Verifikasi: tes status aktif/cutoff/final/arsip, finalisasi bersamaan update dan reopen setelah ada capaian.

## 8. Halaman admin master indikator
Dependensi: 5. Cakupan: sedang.
File: halaman master baru, form master baru, `router.jsx`, komponen navigasi admin, test halaman baru.
- [x] Admin dapat menambah, mengedit, mengurutkan dan menonaktifkan indikator tanpa menyunting kode; halaman baru `/admin/indikator` menyediakan Deskripsi Indikator multibaris beserta pratinjau lengkap dan ringkas untuk publik/operator.
- [x] UI delete menjelaskan referensi penghalang; loading/kosong/error dan label aksesibel tersedia.
- [x] Perubahan default menjelaskan bahwa konfigurasi periode lama tetap tersimpan.
Verifikasi: test alur CRUD; QA browser desktop/mobile setelah backend tersedia.

## 9. Halaman admin konfigurasi periode
Dependensi: 6–8. Cakupan: sedang.
File: `KonfigurasiBobot.jsx`, `BobotIndikatorForm.jsx`, editor metadata baru, komponen preview baru, test alur konfigurasi.
- [x] Admin memilih periode, menambah indikator, mengatur deskripsi, field terkontrol, bobot, dan status input; aktivasi baru mensyaratkan deskripsi terisi.
- [x] Input bobot mengikuti metode; preview menunjukkan rumus, input dan subtotal.
- [x] Alasan terkunci, dampak perubahan bobot, dan konflik revisi dapat dipahami dan ditangani; koreksi deskripsi periode belum final tetap diizinkan setelah ada capaian, tanpa mengubah skor.
Verifikasi: tes empat metode dan QA browser konfigurasi indikator kesepuluh sampai preview.

## Checkpoint B
- [x] CRUD admin dan konfigurasi periode berjalan; simulasi sama dengan engine; hak akses, histori, lock dan konflik teruji.

## 10. Validasi capaian dari metadata server
Dependensi: 6–7. Cakupan: sedang.
File: `submissionService.js`, `operatorController.js`, validator metadata baru, test submission baru, test konkurensi baru.
- [x] Daftar operator mengirim konfigurasi periode beserta deskripsi snapshot; sanitasi/validasi tidak lagi bergantung pada sembilan slug.
- [x] Draft parsial, submit bukti wajib, kepemilikan, revisi, cutoff dan stop-input diberlakukan di server.
- [x] Submit/edit serentak dengan perubahan konfigurasi atau finalisasi tidak lolos memakai aturan basi.
Verifikasi: tes indikator baru empat metode, unknown fields, draft lama, payload invalid, dan konkurensi pada database.

## 11. Form operator dinamis
Dependensi: 10. Cakupan: sedang.
File: `frontend/src/constants/indikator.js`, `OperatorContext.jsx`, `InputCapaian.jsx`, `CapaianRow.jsx`, test form baru.
- [x] Field, label, validasi tampilan, payload dan tab berasal dari API konfigurasi periode; `/operator/input` menampilkan Deskripsi Indikator lengkap setelah judul/tab dan sebelum formulir capaian, dengan paragraf terbaca dan rendering teks aman.
- [x] Identitas state/draft berdasarkan indikator dan periode; pergantian revisi tidak membuang isian diam-diam.
- [x] Indikator baru dapat draft/submit, indikator stop-input dapat dibaca dengan alasan terkunci.
Verifikasi: test dua indikator dengan field berbeda, rasio, bukti, revisi basi, dan QA browser draft/resubmit.

## 12. Konsistensi admin validasi dan progres operator
Dependensi: 11. Cakupan: sedang; pilih maksimal lima file konsumen per sesi dari inventaris tugas 1.
File utama: `validationService.js`, tampilan detail capaian admin, `IndikatorTabs.jsx`, `Dashboard.jsx`, test konsumen.
- [x] Antrean/detail validasi menggunakan field dan label snapshot periode; panel deskripsi dapat diperluas pada detail capaian `/admin/validasi` dan `/admin/validasi/:id` sebelum rincian bukti.
- [x] Penghentian input tidak menghalangi penyelesaian validasi yang diizinkan lifecycle periode.
- [x] Progres/jumlah tab memakai indikator menerima input; histori/capaian nonaktif tetap dapat diakses.
Verifikasi: alur operator → admin approve/reject/resubmit; penyebut progres berubah saat keanggotaan berubah.

## 13. API publik dan ekspor dinamis
Dependensi: 10–12. Cakupan: sedang.
File: `publicController.js`, `exportService.js`, routes publik, test publik dan ekspor.
- [x] Katalog publik tanpa login mengirim deskripsi indikator; halaman berperiode memakai deskripsi snapshot. Detail/skor/kolom PDF dan Excel memakai konfigurasi periode.
- [x] Indikator baru, tanpa capaian, dan nonaktif historis ditampilkan konsisten.
- [x] Total/skor ranking empat kelompok dan tie-breaker tidak berubah akibat migrasi.
Verifikasi: tes API dan hasil isi ekspor untuk sepuluh indikator; buka PDF/Excel contoh dan cek nama/subtotal.

## 14. Katalog pada home dan tentang
Dependensi: 13. Cakupan: sedang, maksimal lima file konsumen dari inventaris.
File: kartu indikator home, detail indikator tentang, pengantar tentang, hook katalog baru, test katalog.
- [x] Beranda `/` menampilkan ringkasan deskripsi maksimal tiga baris pada kartu indikator dan tautan Baca selengkapnya ke anchor indikator terkait di `/tentang`.
- [x] `/tentang` menampilkan deskripsi lengkap sebelum field/bukti dan cara hitung; komponen deskripsi ringkas/lengkap menggunakan teks sumber yang sama, termasuk paragraf dan teks panjang pada desktop/mobile.
- [x] Kondisi kosong/gagal dimuat ditampilkan tanpa menyajikan daftar statis yang keliru.
- [x] Teks jumlah indikator berasal dari data.
Verifikasi: test loading/kosong/error, teks multibaris dan markup berbahaya yang harus tampil sebagai teks aman; QA home/tentang dengan sepuluh indikator dan cocokkan deskripsi dengan pratinjau admin.

## 15. Detail skor dan profil dinamis
Dependensi: 13. Cakupan: sedang.
File: `MadrasahDetail.jsx`, `ProfilMadrasah.jsx`, `IndikatorChart.jsx`, `IndikatorTable.jsx`, test detail baru.
- [x] Nama, deskripsi, urutan, jumlah kolom dan chart mengikuti snapshot periode; `/madrasah/:slug` dan `/operator/profil` menyediakan tombol Info indikator dengan panel deskripsi lengkap pada tabel skor, dan deskripsi historis tidak berubah ketika default master diedit.
- [x] Indikator tanpa capaian tampil dengan skor nol; indikator historis nonaktif tetap tampil.
- [x] Total konsisten dengan API, ranking, PDF dan Excel.
Verifikasi: test detail/profil dengan dua periode berbeda dan QA chart/tabel sepuluh indikator.

## 16. Panduan, FAQ, dan metadata publik
Dependensi: 14–15. Cakupan: sedang.
File: `Panduan.jsx`, `FaqSection.jsx`, `Footer.jsx`, `frontend/index.html`, test panduan.
- [x] `/operator/panduan` menampilkan deskripsi lengkap dalam accordion masing-masing indikator sebelum daftar field dan ketentuan pengisian, sesuai snapshot periode efektif.
- [x] Teks publik tidak lagi menyatakan jumlah tetap sembilan secara keliru.
- [x] Structured data statis tidak mengklaim daftar indikator yang sudah bisa berubah.
Verifikasi: tes panduan dan QA FAQ/footer; periksa structured data dan teks sembilan pada seluruh sumber.

## Checkpoint C
- [x] Indikator baru berjalan sampai approve → skor → ranking → ekspor; perubahan master tidak mengubah histori periode lain.

## 17. Kompatibilitas seed dan registry
Dependensi: 16. Cakupan: sedang, maksimal lima file hasil inventaris.
File: script seed-demo/leaderboard/fixture terkait, fallback registry legacy, test bootstrap.
- [x] Semua seed/demo memakai kontrak baru tanpa menimpa edit admin.
- [x] Fallback statis dilepas setelah seluruh pembaca berpindah.
- [x] Run ulang bootstrap mempertahankan data baru dan periode lama.
Verifikasi: jalankan bootstrap dua kali pada DB uji dan bandingkan jumlah/konfigurasi/capaian.

## 18. Verifikasi akhir dan cutover
Dependensi: 17. Cakupan: sedang.
File: test smoke end-to-end baru, dokumentasi operasional, laporan hasil implementasi.
- [x] Dry-run deployment, gate CRUD dan penghentian write saat backfill dijelaskan; rollback mempertahankan pembaca dinamis setelah data baru ada.
- [x] Catat hasil aktual, batas verifikasi, perubahan konfigurasi dan prosedur admin.
- [x] Jalankan acceptance empat metode dari konfigurasi admin hingga ekspor.
Verifikasi: `npm run lint` dan `npm test` di backend/frontend, `npm run build` di frontend, schema drift dan smoke empat metode pada DB uji. Uji DB yang skip dilaporkan sebagai belum terverifikasi.

## Checkpoint akhir
- [x] Seluruh kriteria penerimaan pada rencana terpenuhi; tidak ada regresi skor historis atau kehilangan relasi.
- [x] QA browser admin/operator/publik dan ekspor selesai; dokumentasi serta hasil tes siap ditinjau.
- [x] Semua halaman pada tabel penempatan deskripsi di plan telah dicek, termasuk anchor beranda → Tentang, panel yang bisa dioperasikan dengan keyboard, konteks periode, dan tampilan mobile.
- [x] Pengguna menyetujui implementasi; migrasi dan verifikasi sudah dilakukan pada lingkungan lokal. Deployment ke server lain belum dilakukan.

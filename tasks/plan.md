# Rencana perubahan menjadi 4 kelompok madrasah

Tanggal: 27 Oktober 2026.
Status: sudah diimplementasikan dan dimigrasikan pada database dummy lokal. Hasil aktual: [laporan implementasi](hasil-implementasi-empat-kelompok.md).
Daftar pekerjaan: [todo.md](todo.md).

## Keputusan yang sudah diberikan pengguna

- Kelompok menjadi RA, MI, MTS, dan MA; negeri dan swasta digabung pada jenjang yang sama.
- Berlaku untuk SEMUA periode, termasuk periode finalisasi dan arsip. Hasil pemeringkatan lama boleh berubah mengikuti penggabungan ini.
- RA memakai 9 indikator, rumus, persyaratan bukti, dan bobot per periode yang sama dengan jenjang lain.
- Seluruh data saat ini adalah dummy. Tidak perlu backup database, salinan data lama, atau uji pemulihan backup; data dummy yang ada dapat dipakai untuk menguji migrasi.
- Pengguna telah menyetujui eksekusi dan implementasi rencana.

| Kelompok baru | Anggota |
| --- | --- |
| RA | RA Negeri dan RA Swasta |
| MI | MI Negeri dan MI Swasta |
| MTS | MTs Negeri dan MTs Swasta |
| MA | MA Negeri dan MA Swasta |

Status kepemilikan tetap menjadi data profil. Setiap lembaga tetap memiliki ID, nomor BMU, slug, akun operator, dan capaian sendiri. Penggabungan dilakukan pada kategori pemeringkatannya.

## Temuan baseline sebelum implementasi

Penelusuran dimulai dari graphify, kemudian dicocokkan dengan sumber aktual. Graph bertanggal 16 Oktober 2026 bukan sumber untuk jumlah data database saat ini.

| Area | Kondisi sekarang dan dampaknya |
| --- | --- |
| Database | [schema.prisma:68](../backend/prisma/schema.prisma#L68) hanya menerima MI, MTs, MA. RA perlu ditambahkan ke enum Jenjang. Madrasah.kelompok adalah String turunan; statusKepemilikan tersimpan terpisah. |
| Daftar kelompok | [periode.constants.js:4](../backend/src/constants/periode.constants.js#L4) dan [indikator.js:21](../frontend/src/constants/indikator.js#L21) memuat enam kelompok. Beberapa pilihan jenjang ditulis terpisah. |
| Pembentukan kelompok | [authService.js:173](../backend/src/services/authService.js#L173) menggabungkan jenjang dan kepemilikan. Helper ini dipakai saat persetujuan pendaftaran dan pembuatan madrasah oleh admin. |
| Pendaftaran | [authController.js:91](../backend/src/controllers/authController.js#L91), [madrasahService.js:12](../backend/src/services/madrasahService.js#L12), serta formulir pendaftaran/admin belum menerima RA. |
| Ranking | [scoringService.js:130](../backend/src/services/scoringService.js#L130) mengambil madrasah berdasarkan kelompok, lalu menghitung skor dari capaian disetujui setiap kali dibaca. Tidak ada tabel cache ranking aktif. |
| Histori | Finalisasi pada [periodService.js:154](../backend/src/services/periodService.js#L154) mengunci periode dan bobot, tanpa menyimpan snapshot ranking. Pengelompokan baru akan memengaruhi laporan periode final/arsip ketika dihitung ulang. |
| Bobot | [schema.prisma:180](../backend/prisma/schema.prisma#L180) menyimpan bobot per indikator dan periode, bukan per kelompok. Tidak perlu menggabungkan baris bobot negeri/swasta. |
| Ekspor | [exportService.js:27](../backend/src/services/exportService.js#L27) menganggap satu jenjang terdiri atas dua kelompok dan memakai pencocokan awalan dengan spasi. Logika ini harus diganti. |
| Tautan dan fallback | [Leaderboard.jsx:13](../frontend/src/pages/public/Leaderboard.jsx#L13) memakai MI Negeri sebagai fallback. [MadrasahDetail.jsx:90](../frontend/src/pages/public/MadrasahDetail.jsx#L90) juga masih menyusun fallback dari jenjang + kepemilikan. |

Jumlah lembaga, periode, dan capaian yang akan dimigrasi belum diambil dari database; inventarisasi tersebut menjadi tugas sebelum implementasi migrasi.

## Rancangan perubahan

### 1. Kontrak kelompok dan dukungan RA

- Nilai kelompok yang disimpan/API: RA, MI, MTs, MA. Pertahankan kapitalisasi teknis MTs agar sesuai enum yang sudah dipakai; label tampilan dapat ditulis MTS sesuai daftar pengguna.
- Tambahkan RA ke enum Jenjang melalui migration baru. Pertahankan StatusKepemilikan dengan Negeri dan Swasta.
- Pertahankan kolom kelompok sebagai nilai turunan dari jenjang saja untuk membatasi perubahan kontrak aplikasi.
- Gunakan daftar jenjang/kelompok terpusat pada backend dan frontend; formulir serta filter mengambil dari daftar tersebut.
- Ubah deriveKelompok agar tidak memasukkan kepemilikan.
- Tambahkan normalisasi filter lama: MI Negeri/MI Swasta menjadi MI, MTs Negeri/MTs Swasta menjadi MTs, MA Negeri/MA Swasta menjadi MA. Terima label MTS sebagai alias MTs bila digunakan dalam URL/API.
- Respons dan URL yang dibentuk aplikasi memakai nilai kanonis baru. Filter yang tidak dikenal tetap ditolak.
- Alias lama berlaku untuk kelompok gabungan: tautan MI Negeri akan membuka kelompok MI yang berisi negeri dan swasta.

### 2. Registrasi dan pengelolaan lembaga

- Tambahkan RA pada formulir daftar operator dan tambah madrasah oleh admin, serta validasi server.
- Alur daftar -> menunggu -> disetujui -> madrasah terbentuk harus menghasilkan kelompok berdasarkan jenjang.
- Pendaftaran yang sudah menunggu persetujuan tetap diproses dari madrasahData; helper terbaru membentuk kelompok baru ketika disetujui.
- Status kepemilikan tetap dipilih/disimpan dan dapat ditampilkan pada profil.
- Ketentuan ID/BMU, slug, dan data pokok yang tidak boleh diubah tetap berlaku.
- Panduan form menjelaskan bahwa kelompok berasal dari jenjang.

### 3. Migrasi data lama untuk semua periode

- Buat inventarisasi baca-saja sebelum migrasi: jumlah lembaga per jenjang/kepemilikan/kelompok, lembaga nonaktif, akun menunggu, periode, submission, serta ketidaksesuaian kelompok terhadap jenjang.
- Sediakan migrasi data yang bisa disimulasikan dan dijalankan ulang tanpa menggandakan perubahan. Jenjang menjadi sumber pemetaan.
- Isi kelompok setiap madrasah dengan jenjangnya, termasuk lembaga soft-deleted agar aktivasi ulang tidak memunculkan kategori lama.
- Jangan menggabungkan/menghapus lembaga; pertahankan relasi user, submission, validation, bukti, dan bobot.
- Pertahankan audit log historis sebagai catatan kejadian asli; catat migrasi sebagai kejadian baru.
- Bandingkan jumlah baris/relasi sebelum dan sesudah, dan pastikan tidak tersisa kelompok lama pada data master yang sudah dimigrasi.
- Periode finalisasi/arsip tetap terkunci. Tidak perlu reopen hanya untuk mengubah pengelompokan.
- Tidak perlu migrasi versi skema kelompok per periode karena pengguna memilih menerapkan aturan baru ke seluruh periode.

### 4. Pemeringkatan, API, dan statistik

- Semua enumerasi kelompok menghasilkan empat kategori dengan urutan RA, MI, MTs, MA.
- Ranking tiap jenjang menggabungkan lembaga negeri dan swasta, dengan peringkat dimulai dari 1 pada masing-masing kelompok.
- Pertahankan rumus skor dan tie-breaker saat ini: total skor, jumlah capaian disetujui, waktu pencapaian, lalu nomor BMU.
- Skor individual untuk data, periode, dan bobot yang sama harus tetap sama. Posisi ranking/jumlah pesaing dapat berubah.
- Pemanggil ranking publik, detail madrasah, dashboard operator, dan ekspor memakai kelompok baru yang sama.
- Respons statistik kelompokCount menjadi 4; jumlah madrasah tetap jumlah lembaga, bukan hasil penggabungan baris.
- Filter manajemen madrasah dan antrean validasi menerima kelompok baru dan alias lama secara konsisten.
- Kelompok RA tersedia meskipun belum memiliki lembaga. Tampilkan keadaan kosong yang wajar; tidak membuat lembaga RA produksi secara otomatis.

### 5. Tampilan publik, operator, dan admin

- Ubah filter leaderboard menjadi empat kelompok, normalisasi parameter URL lama, dan hilangkan fallback MI Negeri. Gunakan kelompok kanonis yang tersedia secara konsisten; default MI dapat dipertahankan agar halaman awal tetap berisi jenjang yang sebelumnya ditampilkan.
- Ubah fallback kelompok pada detail madrasah menjadi jenjang saja.
- Periksa dashboard/profil operator serta tautan menuju leaderboard agar peringkatnya sesuai kelompok gabungan.
- Perbarui ringkasan per kelompok pada dashboard admin, filter antrean validasi, serta tampilan daftar madrasah.
- Badge status Negeri/Swasta tetap ditampilkan sebagai atribut profil, terpisah dari kelompok ranking.
- Teks otomatis berdasarkan panjang konstanta akan menjadi empat; tetap audit teks manual yang menyebut enam kelompok, MI/MTs/MA saja, atau jenjang + kepemilikan.

### 6. Laporan PDF dan Excel

- Pilihan ekspor cukup Semua kelompok atau RA/MI/MTs/MA. Hilangkan pilihan ganda per kelompok vs per jenjang yang kini bermakna sama.
- Untuk kompatibilitas, parameter jenjang lama tetap bisa diterjemahkan ke kelompok baru. Pertahankan penolakan jika kelompok dan jenjang dikirim bersamaan.
- Ganti pencocokan startsWith(jenjang + spasi) dengan pemetaan kelompok kanonis.
- Laporan semua kelompok memuat bagian per jenjang; nomor peringkat dimulai dari 1 pada tiap bagian. Bagian tanpa data dapat tetap dilewati sesuai perilaku sekarang.
- Judul, label kelompok, nama unduhan, dan hasil ranking harus sama antara UI, PDF, dan Excel.
- Ekspor ulang periode lama menghasilkan pengelompokan baru. Berkas PDF/Excel yang sudah pernah diunduh tidak berubah otomatis.

### 7. Indikator, seed, dan dokumentasi

- RA menggunakan sembilan indikator yang sama beserta bobot pada periode yang dipilih, termasuk aturan bukti TKA/ANBK yang disetujui pengguna. Tidak menambah aturan penilaian khusus RA.
- Rumus per_jenjang untuk pendidikan S1/S2/S3 tetap berbeda dari jenjang lembaga RA/MI/MTs/MA; jangan mengubah enum JenjangPendidikan.
- Perbarui seed demo, seed leaderboard, dan akun dummy agar tidak menulis kelompok lama lagi.
- Sediakan fixture RA untuk pengujian. Data contoh hanya untuk lingkungan pengembangan/uji.
- Perbarui README, PRD, IDEA, panduan operator, dan halaman tentang. Hindari pencarian-ganti global yang bisa merusak nama lembaga seperti MI Negeri Bangil.
- Pembaruan graphify baru dilakukan setelah implementasi selesai agar graph mencerminkan keadaan yang benar.

## Urutan pelaksanaan dan titik pemeriksaan

1. Inventarisasi dan baseline data/skor, kemudian tetapkan kontrak kelompok kanonis.
2. Siapkan schema RA, konstanta, helper pembentukan kelompok, dan jalur registrasi/admin.
3. Siapkan backfill yang dapat disimulasikan; uji langsung pada database dummy yang ada.
4. Sesuaikan ranking, statistik, dan filter layanan.
5. Sesuaikan formulir, leaderboard, dashboard/profil, dan ekspor.
6. Perbarui fixture, seed, dan dokumentasi.
7. Jalankan pengujian terarah dan rehearsal migrasi; bandingkan data/skor sebelum dan sesudah.
8. Rilis setelah rencana implementasi dilanjutkan oleh pengguna. Jadwalkan backfill serta pergantian backend/frontend dalam jendela pemeliharaan agar proses lama tidak menulis kelompok lama kembali.

Rincian tugas, dependensi, kriteria penerimaan, dan pemeriksaan ada di [todo.md](todo.md).

## Verifikasi yang direncanakan

- RA Negeri dan RA Swasta dapat dibuat melalui alur registrasi/persetujuan maupun admin, dan masuk kelompok RA.
- Negeri dan swasta pada jenjang yang sama muncul pada satu ranking. Kelompok lain tidak tercampur.
- Total skor individual tidak berubah dengan submission/bobot yang sama; tie-breaker tetap deterministik.
- Periode aktif, finalisasi, dan arsip mengikuti empat kelompok; kunci periode/bobot tetap berlaku.
- Data lama, data nonaktif yang diaktifkan lagi, dan akun pending tidak menghidupkan kelompok lama.
- URL/filter lama diarahkan ke kategori gabungan; parameter tidak valid ditolak.
- Statistik menampilkan 4 kelompok, tanpa mengubah jumlah lembaga.
- Ekspor PDF/Excel sama dengan leaderboard, mencakup filter RA, semua kelompok, dan kelompok kosong.
- Jalankan test backend terkait scoring, API, validasi, dan export; test frontend terkait filter/dashboard serta form/URL yang berubah. Gunakan database dummy yang ada untuk uji migrasi dan fixture terisolasi untuk test otomatis; tidak perlu membuat salinan database.
- Build frontend satu kali setelah perubahan UI. Pertahankan pemeriksaan migration/schema drift serta CI MySQL Linux yang sudah ada.
- Pemeriksaan manual dibatasi pada jalur perubahan: daftar RA -> approve -> input/approve capaian -> ranking -> ekspor, ditambah satu ekspor periode lama.

Tidak ada test aplikasi, build, atau migrasi database yang dijalankan pada tahap penyusunan rencana ini.

## Pelaksanaan migrasi pada data dummy

- Tidak ada langkah backup atau uji pemulihan. Catat jumlah data dan beberapa skor sebelum migrasi sebagai pembanding hasil pengujian.
- Gunakan migration baru; jangan mengedit migration yang telah diterapkan, reset database, atau seed ulang produksi.
- Prisma Client harus digenerate sesuai schema baru. Terapkan migration dengan prosedur deploy yang sudah digunakan proyek.
- Hormati kapitalisasi nama tabel MySQL pada Linux; proyek sudah memiliki riwayat perbaikan kasus ini.
- Catat jumlah baris yang berubah, kesalahan, dan hasil pemeriksaan akhir tanpa mencatat rahasia.
- Jika backfill gagal, hentikan pengaktifan versi baru sampai data konsisten; jalankan ulang hanya setelah penyebabnya diperbaiki.
- Jika ditemukan kesalahan, perbaiki migration/backfill dan validasi ulang menggunakan data dummy. Pastikan schema, Prisma Client, dan seed sama-sama mendukung RA.

## Risiko utama

| Risiko | Penanganan dalam rencana |
| --- | --- |
| Ranking historis berubah | Sudah disetujui pengguna; bandingkan hasil pada data dummy dan pastikan ekspor ulang memakai kelompok baru. |
| Hanya konstanta diubah, data master masih enam kelompok | Backfill menyeluruh dan pemeriksaan konsistensi sebelum membuka aplikasi. |
| Ekspor per jenjang kosong karena masih mencari awalan dengan spasi | Ubah resolver dan uji filter jenjang/kelompok. |
| Data nonaktif/pending atau seed memunculkan kelompok lama | Cakup jalur aktivasi, approval pending, fixture, dan seluruh seed. |
| Nilai MTs/MTS tidak konsisten | Pisahkan nilai kanonis dan label serta normalisasi alias di batas API/UI. |
| Schema, Prisma Client, dan seed belum sama-sama mendukung RA | Perbarui ketiganya dan uji alur RA pada data dummy. |

## Sumber pemeriksaan

- Graphify: node KELOMPOKS, KELOMPOKS_LIST, deriveKelompok, JENJANG, KEPEMILIKAN; hasilnya diverifikasi dengan file sumber di atas.
- Context7: /prisma/web untuk konsep migration kustom dengan --create-only. Hasil tambahan /prisma/orm/5.20.0 terbatas; permintaan terakhir ke /websites/prisma_io gagal karena koneksi. Tidak ada perubahan API Prisma atau eksekusi migration berdasarkan hasil yang belum terverifikasi.
- Rencana menggunakan script/prosedur proyek yang sudah ada dan tidak mencakup upgrade dependensi.

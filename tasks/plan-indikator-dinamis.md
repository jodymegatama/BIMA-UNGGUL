# Rencana: CRUD indikator, bobot, dan metode skor dinamis

Tanggal: 2 November 2026 (Asia/Jakarta).
Status: disetujui pengguna dan telah diimplementasikan pada lingkungan lokal. Hasil dan batas verifikasi: [laporan implementasi](hasil-implementasi-indikator-dinamis.md).
Daftar tugas: [todo-indikator-dinamis.md](todo-indikator-dinamis.md).

## Tujuan dan batas tahap pertama

Admin dapat membuat, melihat, mengubah, mengurutkan, menonaktifkan, dan menghapus indikator yang belum digunakan. Setiap indikator memiliki komponen deskripsi indikator, formulir input, metode skor, serta bobot per periode. Deskripsi adalah informasi yang dikelola admin untuk ditampilkan kepada pengguna publik dan operator madrasah. Operator, validasi admin, detail skor, ranking, dan ekspor mengikuti konfigurasi yang sama. Sembilan indikator sekarang menjadi data awal; jumlah indikator tidak lagi dibatasi sembilan.

Tahap pertama menggunakan empat metode yang sudah didukung. Admin memilih metode dan parameternya melalui formulir. Rumus bebas, eksekusi kode dari admin, kategori wilayah/jenjang baru di luar enum sekarang, field penyimpanan baru di luar kolom capaian yang tersedia, dan bobot berbeda per kelompok madrasah berada di luar cakupan awal.

## Temuan dari proyek

Penelusuran dimulai dari graf lalu diverifikasi dengan sumber aktual. Graf membantu menunjukkan dependensi; bukan bukti keadaan database saat ini.

| Area | Kondisi dan dampak |
| --- | --- |
| `backend/prisma/schema.prisma` | Indikator sudah menjadi tabel dengan `tipeFormula`; bobot unik per indikator/periode. Relasi indikator ke capaian dan bobot masih `onDelete: Cascade`, sehingga perlu diubah sebelum membuka fitur hapus. |
| `backend/src/services/scoringService.js` | Empat rumus tersedia. Perhitungan membaca `item.indikator.tipeFormula` dari master dan bobot periode; perubahan rumus master dapat mengubah hasil historis. |
| `backend/src/services/bobotService.js` | Pengaturan bobot dan penguncian finalisasi sudah ada; perlu disatukan dengan konfigurasi indikator periode dan validasi sesuai metode. |
| `backend/src/services/submissionService.js` | `FIELD_RULES`, sanitasi, dan whitelist masih ditentukan berdasarkan sembilan slug. Indikator baru tidak otomatis bisa menerima capaian. |
| `frontend/src/constants/indikator.js` | Daftar, label, field, opsi, dan helper payload masih statis. |
| `backend/src/controllers/operatorController.js` | Daftar indikator berasal dari database, tetapi belum mengirim kontrak formulir per periode. |
| `backend/prisma/seed.js` | Upsert memperbarui nama dan metode indikator bawaan; seed ulang dapat menimpa perubahan admin. |
| Periode dan laporan | Finalisasi mengunci bobot; skor tetap dihitung saat dibaca. Ekspor, halaman informasi, progres, dan metadata publik perlu diaudit terhadap asumsi sembilan indikator. |

Teknologi pada manifest: Prisma `^5.18.0`, MySQL, Express `^5.2.1`, React `^19.2.8`, Vitest. Versi terpasang perlu dicocokkan dengan lockfile saat implementasi; tidak direncanakan upgrade dependensi.

## Keputusan desain yang diusulkan

### 1. Master dan konfigurasi periode

- `Indikator`: identitas stabil (`id`, `kode`, `slug`) dan default untuk periode berikutnya, mencakup nama, deskripsi, label singkat, urutan, status aktif, metode default, dan konfigurasi formulir default.
- Perluas `BobotIndikator` menjadi konfigurasi indikator per periode, tetap mempertahankan nama tabel dan keunikan `(indikatorId, periodeId)` untuk mengurangi perubahan relasi.
- Tambahkan snapshot nama, deskripsi, label, urutan, metode, dan konfigurasi formulir pada konfigurasi periode; pertahankan kolom bobot saat ini. Tambahkan penanda menerima input dan nomor revisi untuk mendeteksi perubahan bersamaan.
- Konfigurasi periode menjadi sumber otoritatif formulir, validasi, metode skor, nama kolom ekspor, dan detail historis. Perubahan default master hanya berlaku pada konfigurasi yang dibuat sesudahnya.
- Semua indikator lama harus memiliki konfigurasi pada periode terkait, termasuk indikator tanpa bobot atau tanpa capaian. Bobot kosong dibedakan dari bobot nol dan ditampilkan sebagai belum dikonfigurasi.
- Periode baru menyalin default indikator aktif. Penyalinan bobot dari periode lama menjadi tindakan eksplisit admin. Indikator baru tidak otomatis masuk semua periode historis; admin menambahkannya ke periode yang masih dapat diubah.
- `kode`/`slug` stabil sesudah dibuat, unik, dan tidak bergantung pada urutan tampilan. Urutan disimpan sebagai angka tersendiri.

### 2. Komponen deskripsi indikator

Kebutuhan pengguna (2 November 2026): setiap indikator mempunyai deskripsi berupa informasi indikator yang ingin disampaikan admin kepada pengguna publik maupun operator madrasah.

- Form tambah/edit indikator menyediakan field khusus **Deskripsi Indikator**, terpisah dari nama, rumus, bantuan tiap field, dan catatan capaian operator. Admin mengisi penjelasan indikator, misalnya tujuan, cakupan, contoh capaian, dan informasi bukti yang perlu diketahui pengguna.
- Setiap indikator yang dipublikasikan atau diaktifkan untuk input harus memiliki deskripsi yang tidak kosong. Deskripsi awal sembilan indikator dimigrasikan dari penjelasan existing yang sesuai; jika belum tersedia, tandai belum lengkap agar admin melengkapinya sebelum aktivasi baru. Migrasi tidak memblokir akses baca capaian historis.
- Sediakan komponen tampilan deskripsi yang dipakai pada halaman informasi/detail indikator publik dan area penjelasan indikator pada formulir/panduan operator. Judul **Deskripsi Indikator**, paragraf, dan pergantian baris terbaca dengan baik pada desktop maupun perangkat seluler.
- Tahap pertama menggunakan teks multibaris yang ditampilkan sebagai teks aman. Konten admin tidak dieksekusi sebagai HTML atau skrip. Pratinjau admin memperlihatkan isi yang akan dibaca publik dan operator.
- API master/katalog publik mengirim deskripsi master aktif; API operator dan halaman dengan konteks periode mengirim deskripsi snapshot periode. Kedua audiens menerima isi yang sama bila melihat indikator dan konteks periode yang sama.
- Perubahan deskripsi default tidak menulis ulang informasi historis. Deskripsi periode dapat diperbaiki pada periode belum final/arsip tanpa mengubah rumus atau field capaian, dengan audit dan revisi konfigurasi. Pembatasan perubahan struktural setelah ada capaian tetap berlaku untuk metode/formulir, bukan koreksi teks deskripsi.
- Validasi server menetapkan batas panjang deskripsi dan menolak teks kosong untuk aktivasi; batas tersebut juga diinformasikan pada form admin. Deskripsi tidak dipakai sebagai input perhitungan skor.

#### Halaman penempatan komponen deskripsi

Nama komponen usulan: `DeskripsiIndikator`, dengan tampilan ringkas dan lengkap dari sumber teks yang sama. Route existing dicocokkan dengan `frontend/src/router.jsx`; `/admin/indikator` merupakan route baru yang direncanakan.

| Audiens | Halaman / route | Lokasi dan bentuk tampilan | Sumber deskripsi |
| --- | --- | --- | --- |
| Publik | Beranda `/` | Pada setiap kartu di bagian Kriteria Penilaian, di bawah nama indikator. Ringkasan maksimal tiga baris dengan tautan Baca selengkapnya ke indikator terkait di halaman Tentang. | Master aktif. |
| Publik | Tentang `/tentang` | Deskripsi lengkap pada setiap bagian detail indikator, sebelum informasi field/bukti dan cara menghitung. Setiap bagian memiliki anchor stabil dari slug agar dapat dituju dari beranda. | Master aktif. |
| Publik | Detail madrasah `/madrasah/:slug` | Tombol **Info indikator** pada nama indikator di tabel rincian skor membuka panel deskripsi lengkap yang dapat diperluas. Konteks periode mengikuti periode skor yang sedang dilihat. | Snapshot periode skor. |
| Operator | Input Capaian `/operator/input` | Panel **Deskripsi Indikator** tepat setelah judul/tab indikator terpilih dan sebelum formulir/baris capaian. Isi lengkap tampil langsung agar terbaca sebelum pengisian. | Snapshot periode input. |
| Operator | Panduan `/operator/panduan` | Dalam accordion ringkasan masing-masing indikator, deskripsi lengkap tampil lebih dahulu, kemudian daftar field dan ketentuan pengisian. | Snapshot periode efektif pada panduan. |
| Operator | Profil Madrasah `/operator/profil` | Tombol **Info indikator** pada tabel rincian skor, dengan panel yang sama seperti detail madrasah publik. | Snapshot periode skor. |
| Admin | Master Indikator `/admin/indikator` (baru) | Field editor deskripsi pada form tambah/edit dan pratinjau lengkap. Pratinjau ringkas memperlihatkan hasil kartu beranda. | Default master yang sedang diedit. |
| Admin | Konfigurasi Bobot `/admin/bobot` | Deskripsi pada detail indikator periode, beserta editor koreksi teks dan pratinjau sesuai aturan penguncian periode. | Snapshot periode terpilih. |
| Admin | Validasi `/admin/validasi` dan `/admin/validasi/:id` | Panel **Deskripsi Indikator** yang dapat diperluas pada detail capaian, sebelum rincian bukti, sebagai acuan admin saat memeriksa. | Snapshot periode capaian. |

Ketentuan interaksi: panel yang dapat diperluas dapat dioperasikan dengan keyboard dan mempunyai label jelas; isi tidak hanya tersedia melalui hover/tooltip. Pemotongan tiga baris pada kartu bersifat tampilan saja dan tidak mengubah teks tersimpan. Pergantian indikator/periode memperbarui isi dan label konteks secara bersamaan.

Halaman leaderboard tetap berfokus pada peringkat dan mengarahkan pengguna ke detail madrasah untuk penjelasan per indikator. Dashboard, riwayat/notifikasi, dan halaman autentikasi tidak menambahkan blok deskripsi berulang pada tahap pertama. Deskripsi lengkap tidak ditambahkan ke PDF/Excel pada tahap ini; ekspor tetap berfokus pada hasil penilaian.

### 3. Formulir dinamis dengan field terkontrol

- Simpan konfigurasi JSON tervalidasi berisi field yang diaktifkan, label, bantuan, urutan, kewajiban, dan batas nilai yang diizinkan.
- Gunakan kolom capaian yang sudah tersedia: nama kegiatan, institusi, peserta, status pegawai, wilayah, jenjang pendidikan, jumlah, pembilang, penyebut, link bukti, dan catatan.
- Metode menentukan field skor wajib. Admin boleh mengatur label dan field pendukung, tetapi tidak menghapus kebutuhan skor atau melonggarkan validasi inti. Link bukti tetap wajib saat submit; draft boleh parsial.
- Backend memvalidasi konfigurasi sebelum disimpan dan payload saat draft/submit/edit. Frontend memakai metadata API yang sama untuk rendering, bukan tabel aturan berdasarkan slug.
- Opsi wilayah tetap kabupaten/provinsi/nasional/internasional; opsi jenjang tetap S1/S2/S3. Nilai enum stabil, label dapat ditampilkan sesuai kebutuhan.
- Identitas state formulir mencakup indikator, periode, dan revisi. Saat berpindah indikator/periode, jangan membawa isian milik indikator lain; draft tersimpan dimuat sesuai identitasnya. Perubahan revisi tidak boleh membuang isian belum tersimpan tanpa pemberitahuan.

### 4. Empat metode skor

| Metode | Input skor | Rumus dan contoh |
| --- | --- | --- |
| Per capaian | Satu baris disetujui = satu capaian | `jumlah baris × bobot`; 5 × 2 = 10. Kolom jumlah tidak mengalikan baris pada metode ini. |
| Per tingkat wilayah | Tingkat pada setiap baris | `Σ(jumlah baris tingkat × bobot tingkat)`; 2 kabupaten × 3 + 1 nasional × 10 = 16. |
| Per jenjang | Jenjang dan jumlah lulusan | `Σ(jumlah lulusan jenjang × bobot jenjang)`; 2 S2 × 5 + 1 S3 × 10 = 20. |
| Persentase | Pembilang dan penyebut | `Σ pembilang / Σ penyebut × bobot`; 80/100 × 20 = 16. Ini agregasi rasio, bukan rata-rata persentase tiap baris. |

- Persentase mempertahankan kontrak sekarang: bilangan bulat tidak negatif, pembilang tidak melebihi penyebut, 0/0 menghasilkan 0, pembilang positif dengan penyebut nol ditolak. Bobot adalah skor pada capaian 100%.
- Hanya capaian disetujui dan tidak dihapus yang dihitung. Total skor tetap penjumlahan skor indikator; bobot tidak diwajibkan berjumlah 100 dan tidak ditambahkan normalisasi diam-diam.
- Kategori dengan bobot kosong adalah konfigurasi belum lengkap; nilai nol eksplisit tetap sah. Finalisasi dan aktivasi input indikator mensyaratkan konfigurasi lengkap.
- Engine skor yang sama dipakai kalkulasi aktual dan simulasi admin. Preview menampilkan rumus, subtotal, hasil, serta periode/revisi yang digunakan, tanpa menyimpan capaian contoh.
- Kebijakan presisi mempertahankan perilaku sekarang: kalkulasi memakai nilai penuh; pembulatan untuk tampilan/ekspor tidak dipakai untuk mengubah urutan ranking.

### 5. Aturan ubah, nonaktif, dan hapus

| Tindakan | Kebijakan usulan |
| --- | --- |
| Ubah default master | Berlaku untuk konfigurasi periode berikutnya; tidak menulis ulang snapshot periode yang ada. |
| Koreksi deskripsi periode | Diizinkan sebelum final/arsip dengan audit dan revisi; tidak mengubah formulir atau cara menghitung skor. |
| Ubah formulir/metode periode | Hanya sebelum ada capaian pada pasangan indikator/periode, termasuk draft dan capaian soft-deleted. Setelah dipakai, perubahan struktural dilakukan pada periode berikutnya. |
| Ubah bobot periode | Diizinkan selama periode belum final/arsip sesuai guard yang berlaku; UI menjelaskan bahwa skor live periode tersebut akan berubah. |
| Nonaktif master | Tidak ditawarkan untuk periode baru; konfigurasi dan hasil periode lama tetap tersedia. |
| Hentikan input periode | Memblokir draft baru/edit/resubmit operator; data, antrean validasi, skor yang sudah disetujui, dan laporan tetap ada. Tindakan validasi mengikuti lifecycle periode. |
| Hapus permanen | Hanya jika master belum memiliki konfigurasi periode atau capaian. Jika ada referensi, kembalikan konflik dan arahkan admin ke nonaktifkan. |
| Finalisasi/arsip | Seluruh konfigurasi periode terkunci, termasuk nama, formulir, keanggotaan, urutan, metode, dan bobot. |
| Reopen | Mengikuti alur existing dengan alasan dan audit; bobot kembali dapat diubah, tetapi rumus/formulir yang sudah dipakai tetap tidak dapat diubah. |

Ganti FK dari master indikator ke konfigurasi/capaian menjadi `Restrict`. Jangan mengubah aturan hapus periode yang sebelumnya sudah diputuskan pengguna. Pemeriksaan, mutasi, dan audit satu transaksi; mutasi konfigurasi dan submit menggunakan penguncian/revisi yang konsisten untuk mencegah perubahan di sela pemeriksaan. Konflik revisi mengembalikan 409, periode terkunci 423, payload tidak valid 400.

## Kontrak API yang direncanakan

- Admin master: `GET/POST /api/admin/indikator`, `GET/PATCH/DELETE /api/admin/indikator/:id`. PATCH mencakup default metadata, urutan, dan status aktif; DELETE tunduk aturan belum digunakan.
- Konfigurasi periode: `GET/POST /api/admin/periode/:periodeId/indikator` dan `PATCH /api/admin/periode/:periodeId/indikator/:indikatorId`; POST menambahkan satu indikator aktif dengan snapshot default, lalu admin mengatur bobot.
- Simulasi: `POST /api/admin/periode/:periodeId/indikator/:indikatorId/preview`; input contoh divalidasi memakai engine yang sama dan tidak dipersistenkan.
- Endpoint bobot existing tetap menjadi adapter ke layanan konfigurasi yang sama selama transisi, sehingga tidak ada dua sumber kebenaran.
- Operator: perluas `GET /api/operator/indikator` dengan konfigurasi efektif, identitas periode, revision, field, metode, urutan, dan status menerima input. Write endpoint existing dipertahankan dengan validasi konfigurasi server; revisi basi memerlukan refresh dan ditolak sebagai konflik.
- Publik: tambahkan katalog indikator aman tanpa data pribadi; detail/ranking/ekspor periode memakai snapshot periode. Halaman tanpa periode memakai default master aktif dengan label konteks yang jelas.
- Semua mutasi admin tetap menggunakan middleware admin existing dan audit sebelum/sesudah. Kontrak final respons dan kode error ditulis sebelum implementasi klien.

## Alur admin dan operator

Admin membuka menu Indikator → tambah identitas, deskripsi indikator, dan default metode → pratinjau deskripsi untuk publik/operator → atur field pendukung → simpan master → pilih periode → tambahkan indikator → lengkapi bobot → simulasi skor → aktifkan input. Form bobot menyesuaikan metode; tampilkan alasan tombol terkunci dan dampak perubahan bobot.

Operator melihat tab dari API periode, membaca deskripsi indikator, mengisi field sesuai konfigurasi, menyimpan draft parsial, lalu submit. Pengguna publik dapat membaca deskripsi pada halaman informasi/detail indikator tanpa login. Admin memvalidasi menggunakan field dan label konfigurasi periode yang sama. Detail publik dan ekspor menampilkan indikator baru tanpa perubahan kode tambahan.

## Migrasi dan peluncuran

1. Ambil baseline baca-saja: jumlah master, konfigurasi, periode, capaian per status, subtotal indikator, skor, ranking dan contoh ekspor, termasuk final/arsip. Jangan menampilkan kredensial.
2. Expand schema: tambah kolom konfigurasi nullable/default yang kompatibel dan FK pelindung. Jangan menghapus kolom legacy pada langkah ini.
3. Backfill idempoten dari sembilan konfigurasi existing, default formulir frontend/backend, dan bobot masing-masing periode. Cakup periode final/arsip, tanpa mengubah angka bobot atau identitas capaian. Periode dengan capaian tetapi tanpa bobot mendapat konfigurasi belum lengkap dengan hasil nol yang tetap sama.
4. Verifikasi hasil terhadap baseline. Perbedaan sumber nama/formulir dicatat sebagai anomali; jangan menebak rumus historis yang tidak tersimpan. Backfill merekam keadaan saat migrasi, bukan merekonstruksi sejarah yang tidak tersedia.
5. Pindahkan pembacaan skor, validasi, dan UI ke konfigurasi periode; buka CRUD setelah semua jalur membaca sumber baru. Untuk deployment terpisah, gunakan gate konfigurasi dan hentikan write selama backfill/cutover singkat agar tidak ada capaian yang lolos dari pemetaan.
6. Seed diubah menjadi bootstrap non-destruktif: run ulang tidak menimpa hasil edit admin atau menghidupkan kembali indikator yang dinonaktifkan. Script dummy/fixture ikut diperiksa.
7. Hapus fallback statis hanya setelah parity dan seluruh alur lulus. Rollback awal dapat menonaktifkan CRUD sebelum data baru masuk. Setelah indikator baru dipakai, rollback harus ke build yang tetap memahami konfigurasi dinamis; tidak kembali ke pembaca sembilan slug.

Kebijakan proyek sebelumnya menyatakan data dummy dan tidak memerlukan backup. Rencana ini tidak mengasumsikan izin menjalankan migrasi sekarang. Saat implementasi, verifikasi lingkungan sasaran dan ikuti kebijakan data yang masih berlaku.

## Urutan pekerjaan dan checkpoint

Tugas rinci dan dependensi ada pada daftar tugas pendamping. Urutan: kontrak/baseline → konfigurasi periode dan parity skor → CRUD backend/admin → formulir dan validasi dinamis → seluruh konsumen publik/ekspor → verifikasi dan cutover.

- Checkpoint A: backfill dua kali tidak mengubah hasil; skor/ranking lama sama; schema drift bersih.
- Checkpoint B: admin membuat indikator baru lengkap sampai simulasi; hak akses, penguncian, konflik dan hapus teruji.
- Checkpoint C: indikator baru dipakai operator sampai disetujui dan tampil pada skor, ranking, serta ekspor; histori periode lain tetap sama.
- Checkpoint akhir: lint/test kedua aplikasi, build frontend, QA browser admin/operator/publik, dan dokumentasi lulus. Database test yang dilewati tidak boleh dilaporkan sebagai lulus.

## Pengujian penerimaan utama

- Admin dapat mengisi, mengubah, dan mempratinjau deskripsi; publik tanpa login dan operator dapat membaca isi yang sesuai konteks master/periode. Paragraf dan teks panjang tampil terbaca, markup berbahaya tampil sebagai teks aman, dan indikator tanpa deskripsi ditandai belum lengkap sebelum aktivasi baru.
- Koreksi deskripsi periode aktif tidak mengubah skor; deskripsi final/arsip tidak dapat diubah dan tidak terpengaruh perubahan default master.
- Verifikasi seluruh penempatan pada tabel halaman: tautan kartu beranda membuka anchor indikator yang benar di Tentang; panel rincian publik/operator/admin membaca periode yang sesuai; ekspansi dapat digunakan dengan keyboard dan teks panjang terbaca pada perangkat seluler.
- Tambah indikator kesepuluh untuk masing-masing metode dan jalankan dari konfigurasi sampai laporan.
- Cocokkan empat contoh skor di tabel; uji nol, bobot nol/kosong, banyak baris rasio, kategori tidak valid, pembilang > penyebut, NaN/Infinity, angka negatif dan pecahan pada input jumlah.
- Uji draft tanpa bukti, submit wajib bukti, payload field tambahan, operator mencoba CRUD, dan akses capaian lembaga lain.
- Edit/nonaktif master tidak mengubah nama, rumus, skor, atau keanggotaan periode historis; menghentikan input tidak menghilangkan capaian disetujui dari skor.
- Hapus referensi ditolak FK dan API; dua admin mengedit revisi sama tidak saling menimpa; submit bersamaan dengan perubahan konfigurasi/finalisasi tetap konsisten.
- Ranking dan tie-breaker RA/MI/MTs/MA tetap konsisten; ekspor dan indikator kosong tidak crash; progres memakai jumlah indikator yang menerima input pada periode, bukan angka sembilan.
- Membuka indikator berbeda tidak membocorkan draft/state; indikator dinonaktifkan dengan draft lama menampilkan alasan write diblok, data tetap dapat dibaca.
- Seed/backfill diulang tanpa menimpa konfigurasi admin, kehilangan capaian, atau duplikasi.

## Risiko dan mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Rumus master mengubah histori | Snapshot metode/form per periode dan uji parity sebelum cutover. |
| FK cascade menghapus penilaian | Restrict pada referensi master; hard delete hanya master benar-benar belum digunakan. |
| Form dan server tidak sinkron | Metadata server yang tervalidasi, revisi konfigurasi, field whitelist. |
| Perubahan konfigurasi saat submit | Transaksi dan strategi penguncian/revisi yang diuji dengan konkurensi nyata. |
| Bobot belum lengkap memberi skor nol tanpa disadari | Status konfigurasi eksplisit, preview, dan guard aktivasi/finalisasi. |
| Asumsi sembilan indikator tersebar | Audit seluruh frontend/backend, script seed/demo, panduan, dan structured data `frontend/index.html`. |
| Dokumentasi terbaru berbeda dari versi proyek | Pertahankan Prisma 5 dan API existing; verifikasi lockfile dan dokumentasi versi sebelum implementasi. |

## Dasar dokumentasi Context7

Tool MCP Context7 tidak tersedia di sesi ini. Dokumentasi diambil melalui API resmi Context7 (`/api/v2/libs/search`, lalu `/api/v2/context`), dengan dua resolusi library dan tiga query dokumentasi yang berhasil.

- `/prisma/web` — reputasi 10, benchmark 58.71. Pola expand/backfill/switch/contract: [panduan migrasi Prisma](https://github.com/prisma/web/blob/main/apps/docs/content/docs/guides/database/data-migration.mdx).
- Referential actions dan Restrict: [dokumentasi rilis resmi Prisma](https://github.com/prisma/web/blob/main/apps/blog/content/blog/wnip-q3-hpk7pyth8v/index.mdx). Transaksi interaktif kompatibel dengan pola existing dijelaskan pada [rilis Q4 2022](https://github.com/prisma/web/blob/main/apps/blog/content/blog/wnip-q4-2022-f66prwkjx72s/index.mdx).
- `/reactjs/react.dev` — reputasi 9.7, benchmark 85.23. Identitas formulir dan reset state: [Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state).

Hasil Context7 Prisma memuat API ORM yang lebih baru; contoh CLI/API baru tersebut tidak dijadikan instruksi untuk proyek Prisma 5 ini. Rencana menggunakan pola desainnya dan script repository yang ada.

## Asumsi untuk peninjauan

Empat metode cukup untuk tahap pertama; wilayah berarti tingkat prestasi, bukan domisili madrasah. Bobot tetap per periode dan sama untuk RA/MI/MTs/MA. Kebutuhan rumus tambahan, bobot per kelompok, persentase dari profil lembaga, atau kategori baru menjadi perluasan eksplisit sebelum implementasi terkait.

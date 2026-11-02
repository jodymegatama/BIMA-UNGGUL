# Indikator dinamis

Keputusan dan kontrak, 2 November 2026. Implementasi memakai Prisma 5.18.0 yang terpasang, tanpa upgrade dependensi.

## Sumber kebenaran

Master `Indikator` menyimpan identitas dan default untuk konfigurasi berikutnya. `BobotIndikator` menyimpan snapshot nama, deskripsi, label, urutan, formulir, dan metode pada setiap periode. Pemisahan ini diperlukan karena skor dihitung saat dibaca: jika engine terus mengambil metode dari master, perubahan admin akan mengubah hasil historis.

`kode` dan `slug` permanen; urutan dapat diubah. `fields` mencakup metadata kolom bawaan dan field tambahan yang jawabannya disimpan dalam `SubmissionItem.customValues`. Binding sumber skor disimpan pada `scoringConfig`; keduanya mengikuti snapshot periode. Lihat [kontrak field kustom](custom-field-contract.md). Daftar field/metode yang diizinkan dan template awal diberikan oleh `/api/admin/indikator-contract`. Formulir frontend memakai metadata API; sembilan indikator lama hanya menjadi data bootstrap dan fixture regresi.

Metode tersedia: jumlah baris × bobot; jumlah baris per wilayah × bobot wilayah; jumlah lulusan per jenjang × bobot jenjang; agregat pembilang ÷ agregat penyebut × bobot. Persentase 100% memperoleh seluruh nilai bobot; 0/0 menghasilkan nol. Hanya capaian disetujui dan tidak dihapus dihitung. Preview memakai engine yang sama tanpa menyimpan contoh. Dua metode tambahan adalah per jumlah (nilai sumber × bobot) dan per kategori (nilai pengali × bobot ID opsi). Keempat metode awal juga dapat menggunakan sumber field kustom yang kompatibel.

## Operasional admin

1. Buka `/admin/indikator`, tambah nama, kode unik, identitas tautan, deskripsi, metode, dan formulir. Aktifkan untuk menampilkannya pada katalog publik.
2. Buka `/admin/bobot`, pilih periode, dan tambahkan indikator. Konfigurasi tidak otomatis masuk ke periode historis.
3. Lengkapi bobot, periksa pratinjau deskripsi, simpan, lalu jalankan simulasi. Aktifkan penerimaan input apabila konfigurasi lengkap.
4. Untuk memakai bobot periode lain, pilih periode sumber dan tindakan Salin bobot. Hanya indikator yang ada pada kedua periode dengan metode, binding dan opsi kategori yang kompatibel yang disalin; deskripsi, formulir dan sumber tujuan dipertahankan.
5. Ubah default master untuk periode berikutnya. Koreksi deskripsi periode aktif dilakukan pada konfigurasi periode tersebut.

Deskripsi menggunakan teks multibaris maksimal 10.000 karakter dan wajib sebelum publikasi/aktivasi baru. Komponen tampil pada beranda (ringkas), Tentang (lengkap), detail madrasah dan profil operator (panel info), input capaian, panduan operator, serta halaman pengelolaan/validasi admin. Konten di-render sebagai teks aman. Halaman berperiode memakai snapshot; katalog tanpa periode memakai master aktif.

Nonaktif master menghentikan penawaran untuk periode baru. Hentikan input periode memblokir write operator, tetapi mempertahankan capaian, antrean validasi dan skor. Metode/formulir tidak dapat diubah setelah ada capaian, termasuk draft atau soft-deleted. Deskripsi dapat diperbaiki sebelum final/arsip. Finalisasi mengunci konfigurasi serta mutasi validasi yang memengaruhi hasil. Reopen tetap memerlukan alasan; metode yang sudah dipakai tetap terkunci.

Hapus permanen hanya untuk master tanpa referensi konfigurasi atau capaian; FK `Restrict` melindungi relasi. Kebijakan hapus keseluruhan periode tetap mengikuti implementasi sebelumnya.

## API

Semua endpoint admin memakai middleware admin existing dan audit atomik.

| Endpoint | Fungsi |
| --- | --- |
| `GET/POST /api/admin/indikator` | Daftar/buat master. |
| `GET/PATCH/DELETE /api/admin/indikator/:id` | Detail/edit/hapus master. PATCH menyertakan revision. |
| `GET /api/admin/indikator-contract` | Field terkontrol, metode, dan template formulir. |
| `GET/POST /api/admin/periode/:periodeId/indikator` | Daftar konfigurasi atau tambah master aktif (`indikatorId`). |
| `PATCH /api/admin/periode/:periodeId/indikator/:indikatorId` | Ubah metadata, bobot, status input, dengan revision. |
| `POST .../:indikatorId/preview` | `{ revision, items: [...] }`; memerlukan field skor saja. |
| `POST /api/admin/periode/:periodeId/indikator/copy-bobot` | `{ sourcePeriodeId, revisions: { indikatorId: revision } }`. |
| `GET /api/indikator[?periodeId=...]` | Katalog publik tanpa data pribadi. |

`GET /api/operator/indikator` mengirim formulir, deskripsi, revision dan status input periode. POST draft/submit existing menerima `{ periodeId, revision, items }`; klien baru selalu menyertakan keduanya. Perubahan periode/revisi mengembalikan konflik, tanpa membuang isian lokal. Endpoint bobot massal lama dipertahankan sebagai adapter ke konfigurasi periode; guard lama yang melarang seluruh sumber bobot bernilai nol dipertahankan pada adapter tersebut.

Kode error utama: 400 konfigurasi/input tidak valid; 409 revisi basi, metode/formulir telah digunakan, atau master memiliki referensi; 423 periode/konfigurasi/input terkunci. Mutasi konfigurasi dan submit mengunci baris periode dalam transaksi. Aksi validasi membaca ulang capaian setelah lock dengan isolasi ReadCommitted agar dua validator tidak memakai status basi.

## Migrasi dan rollback

1. Hentikan sementara write pada saat transisi pembaca lama ke baru.
2. Generate Prisma Client dari schema, jalankan migration deploy, lalu `npm run prisma:seed`. Seed menjalankan bootstrap non-destruktif dan backfill konfigurasi.
3. Untuk inspeksi terpisah: `npm run db:migrate-indikator` (dry-run); tambahkan `-- --apply` untuk menerapkan.
4. `configInitialized` pada periode membatasi backfill matriks lama hanya satu kali. Periode baru dibuat dengan snapshot dan penanda ini sejak awal. Deployment/seed berikutnya tidak memasukkan kembali indikator yang tidak dipilih untuk suatu periode.
5. Bandingkan baseline, pastikan schema drift bersih, baru aktifkan server dengan semua pembaca dinamis.

Master yang telah diubah admin tidak ditimpa seed ulang. Konfigurasi tanpa bobot tetap belum lengkap dan tidak diaktifkan; tidak ada bobot yang ditebak untuk menyembunyikan masalah data. Backfill dapat dilanjutkan setelah kegagalan parsial dan dijalankan ulang tanpa duplikasi.

Setelah indikator baru digunakan, rollback hanya ke build yang tetap memahami konfigurasi dinamis. Jangan menghapus kolom baru atau mengembalikan pembaca sembilan slug. Untuk menahan penggunaan, nonaktifkan master dan hentikan input periode tanpa menghapus data.

## Verifikasi

`npm test` dan `npm run lint` dari backend/frontend; `npm run build` dari frontend; `npm run prisma:check-drift` dari backend. Tes `indikatorFlow.integration.test.js` menjalankan empat metode dari draft sampai persetujuan dan ekspor. Tes konfigurasi mencakup FK, konflik dua admin, penyalinan bobot, snapshot, dan finalisasi. Tes deskripsi memeriksa rendering teks aman dan label periode pada detail validasi.

Prisma CLI lokal dapat dijalankan sebagai `node node_modules/prisma/build/index.js ...` jika shim `.bin` tidak tersedia. Pada Windows, hentikan backend yang memakai engine sebelum generate client, lalu jalankan kembali.

Dokumentasi Context7 yang dikonsultasikan: `/prisma/web` dan `/reactjs/react.dev`. Indeks Prisma terbaru juga memuat API ORM generasi lebih baru; API tersebut tidak diterapkan pada proyek Prisma 5. Perilaku transaksi/relasi diverifikasi terhadap client terpasang dan MySQL lokal.

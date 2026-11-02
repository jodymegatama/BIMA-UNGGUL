# Hasil implementasi indikator dinamis

Tanggal: 2 November 2026. Branch: `codex/indikator-dinamis`.
Rencana disetujui pengguna dan telah dilaksanakan secara berurutan pada checkout lokal. Belum dipush atau dideploy ke server lain.

## Hasil

- Menu Master Indikator di `/admin/indikator`: tambah, lihat, edit default, urutkan, aktif/nonaktif, dan hapus yang belum digunakan.
- Konfigurasi periode di `/admin/bobot`: deskripsi, formulir terkontrol, empat metode, bobot sesuai metode, salin bobot eksplisit, simulasi, dan pengaturan penerimaan input.
- Deskripsi yang diisi admin tampil bagi publik dan operator di halaman yang ditentukan pada rencana. Katalog master dan informasi periode memakai konteks berbeda secara eksplisit.
- Formulir, validasi server, tab, panduan, filter admin, detail skor, chart, dan rincian ekspor mengikuti data konfigurasi. Indikator kesepuluh tidak memerlukan perubahan kode.
- Finalisasi melindungi konfigurasi serta aksi persetujuan/pencabutan/penghapusan yang dapat mengubah hasil. Penghentian input tidak menghilangkan skor yang telah disetujui.
- PDF memiliki lampiran rincian per indikator; Excel memiliki worksheet Rincian Indikator. Nama indikator berasal dari snapshot periode.

Panduan penggunaan, kontrak API, dan prosedur migrasi: [backend/docs/indikator-dinamis.md](../backend/docs/indikator-dinamis.md).

## Tahap dan bukti

| Tahap | Verifikasi |
| --- | --- |
| Fondasi dan migrasi | Tiga migration aditif diterapkan pada DB lokal. Prisma 5.18.0 generate berhasil; schema drift bersih. Backfill dijalankan ulang tanpa perubahan/duplikasi. |
| CRUD dan konfigurasi | Tes create/edit/delete, FK Restrict, dua admin dengan revision sama, snapshot, salin bobot, lock final, dan payload invalid lulus. |
| Alur empat rumus | Indikator tambahan dibuat, draft parsial disimpan, submit disetujui dan diekspor. Hasil contoh 10, 16, 20, 16; total 62. |
| Frontend dan deskripsi | 79 tes frontend lulus; termasuk payload dari metadata indikator baru, teks aman, dan detail validasi dengan label admin. |
| Backend menyeluruh | 138 tes lulus, 6 tes lama dilewati karena kredensial khusus tidak tersedia. Tidak ada tes database fitur baru yang dilewati. |
| Kualitas | Lint backend/frontend bersih, build frontend berhasil, diff whitespace diperiksa. Build masih memberi peringatan ukuran chunk >500 kB. |
| Browser | Admin membuat indikator kesepuluh lewat form; konfigurasi periode diterapkan; operator menyimpan draft tanpa bukti; panduan mengenali indikator baru. Profil/detail madrasah memiliki 10 panel info. Deskripsi publik/operator diperiksa pada desktop dan viewport 390 px. Overflow navigasi dan informasi periode diperbaiki; document scrollWidth tidak melebihi viewport. |
| PDF | Dua halaman pertama ekspor lokal dirender dengan PDFium dan diperiksa visual. Rincian nama panjang terbaca; blok satu madrasah tidak dipecah jika muat satu halaman. |

## Retensi data

Baseline sebelum implementasi: 9 indikator, 1 periode, 60 madrasah, 1.083 capaian (1.082 disetujui, 1 ditolak).

Setelah seluruh fixture QA dibersihkan, jumlah data, subtotal indikator, skor, dan ranking semua madrasah/periode cocok persis dengan baseline. Seed dijalankan ulang dan perbandingan kembali cocok. Akun, madrasah, indikator, konfigurasi, serta draft QA sementara telah dihapus hanya dalam lingkup fixture sesi ini.

Konfigurasi Diklat pada periode lokal ID 11 sejak awal tidak memiliki nilai bobot. Nilai itu tetap kosong; sistem menandainya belum lengkap dan tidak menerima input baru sampai admin melengkapinya. Bobot tidak diisi otomatis agar skor lama tetap sama.

Artefak pengujian lokal disimpan di `dogfood-output/indikator-dinamis/` (diabaikan Git). Screenshot dengan indikator kesepuluh merekam fixture sebelum pembersihan. Raw baseline tidak memuat nama, email, kredensial, atau tautan bukti.

## Catatan pelaksanaan

- Engine Prisma Windows sempat terkunci oleh server development; backend dihentikan sementara untuk generate, lalu dijalankan kembali.
- MySQL lokal menolak default pada kolom TEXT. Migration lanjutan memakai VARCHAR(10000) untuk deskripsi default master, sementara snapshot deskripsi periode tetap TEXT. Riwayat migration telah dipulihkan dan schema drift diperiksa sampai bersih.
- Fixture regresi lama diperbarui untuk menyiapkan snapshot dan status input. Fixture sembilan indikator asli diisolasi dari master tambahan agar tetap menguji baseline RA/MI/MTs/MA secara tepat.
- Enam tes yang memerlukan kredensial khusus tetap tercatat sebagai skipped. Peringatan chunk frontend adalah batas verifikasi yang masih ada; tidak ada ambang build yang diturunkan.

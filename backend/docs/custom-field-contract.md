# Kontrak fondasi field kustom

Status 2 November 2026: fondasi domain dan schema tersedia; belum dihubungkan ke editor, API capaian, ataupun engine skor live. Definisi field kustom belum dapat diaktifkan melalui API master existing. Ini mencegah pembaca lama membuang jawaban baru selama transisi.

Definisi field: `{ source: 'custom', key: 'cf_<id>', type, label, required, visibility, ...validation }`. ID stabil; label bukan key penyimpanan. Opsi menggunakan ID `opt_<id>`. Tipe: text, textarea, integer, decimal, date, select, multiselect, boolean, url. Metadata field dan scoringConfig akan disalin ke konfigurasi periode bersama snapshot existing pada tahap integrasi.

`customValues` menyimpan objek jawaban JSON pada SubmissionItem. Data lama tetap SQL NULL dan ditafsirkan sebagai objek kosong. SQL NULL berbeda dari JSON null saat menulis Prisma; gunakan Prisma.DbNull atau Prisma.JsonNull secara eksplisit. Uji MySQL membuktikan round-trip angka, false, nol, teks dengan nol di depan, tanggal dan array.

PATCH: key yang tidak dikirim dipertahankan; null mengosongkan satu key; false dan 0 sah. Wajib hanya diperiksa saat submit. Nilai default tidak dibuat diam-diam. Field tidak dikenal ditolak. Definisi maksimal 25 field/32 KiB, 50 opsi, jawaban per baris 16 KiB. Teks pendek/URL maksimal 2.000 karakter, teks panjang 4.000. Angka terbatas ±1e9, presisi desimal maksimal 6; hasil kalkulator sumber kustom dibatasi 0–1e12 agar nilai tidak tak hingga atau diam-diam kehilangan rentang. Angka negatif tidak sah sebagai sumber skor.

Binding menggunakan `{ source: 'builtin'|'custom', key }`. Per jumlah memerlukan quantity; persentase numerator dan denominator; wilayah/jenjang category dengan mapping kanonis; jenjang juga quantity. Per kategori memerlukan category dan weights per ID opsi, serta quantity opsional (jika tidak ada, setiap baris mengalikan 1). Sumber harus bertipe sesuai dan wajib diisi. Metode per capaian tetap menghitung baris. Kalkulator domain tidak melakukan query atau menyimpan contoh.

Enam metode tersedia pada enum database, tetapi validator API existing masih menerima empat metode lama sampai integrasi dan UI tahap berikutnya siap. Kolom baru nullable dan belum mengubah query skor live. Tidak ada jawaban lama yang dipindahkan atau skor yang dihitung ulang dengan aturan baru.

Tahap berikutnya: gabungkan validator domain dengan indikatorConfig/indikatorService, ikat snapshot scoringConfig dan lock struktural, lalu hubungkan customValues ke draft/edit/submit. Setelah itu editor/operator dan kalkulator live dapat diaktifkan bersama. Pengujian rentang skor harus diterapkan pada persetujuan secara atomik sebelum metode baru dibuka ke pengguna.

Referensi Context7: `/prisma/web`, panduan null JSON Prisma 3/4 yang membedakan DbNull/JsonNull. Kompatibilitas diperiksa langsung dengan Prisma 5.18.0 dan MySQL lokal; tidak menggunakan API ORM 8.

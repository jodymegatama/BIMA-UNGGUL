# Progres field kustom

2 November 2026 — pengguna menyetujui eksekusi bertahap. Persetujuan implementasi tetap berlaku untuk tahap berikutnya.

## Tahap fondasi: selesai

- Baseline: 9 indikator, 1 periode, 60 madrasah, 1.083 capaian (1.082 disetujui, 1 ditolak). Pengukuran meliputi subtotal, skor, dan ranking seluruh periode.
- Kontrak domain field kustom tersedia: sembilan tipe, ID field/opsi stabil, visibilitas, validasi, batas definisi/jawaban, serta semantik PATCH yang mempertahankan false/0 dan key yang tidak dikirim.
- Validator binding dan kalkulator domain untuk enam metode tersedia dan diuji secara terpisah. Contoh jumlah =20, persentase =16, kategori =23.
- Schema aditif diterapkan pada database lokal: customValues pada SubmissionItem, scoringConfig pada master dan konfigurasi periode, serta dua nilai enum per_jumlah/per_kategori.
- Round-trip JSON diuji dengan transaksi fixture yang selalu di-rollback, termasuk pembeda SQL NULL dan JSON null.
- Tidak ada perubahan halaman admin/operator atau aktivasi metode baru pada API. Kalkulator live dan sanitasi capaian tetap memakai jalur existing sampai integrasi tahap berikutnya lengkap.

## Verifikasi

- Seluruh suite backend: 18 file lulus, 144 tes berhasil, 6 tes lama dilewati karena kredensial khusus. Tes baru tidak dilewati.
- Tes fondasi khusus: 6 tes lulus, termasuk pengujian MySQL nyata.
- Lint backend bersih; Prisma validate/generate berhasil pada versi 5.18.0; schema drift bersih.
- Perbandingan setelah migration dan full suite: jumlah, subtotal, skor, dan ranking seluruh periode cocok persis dengan baseline.
- Tidak ada perubahan frontend, sehingga build/tes frontend tidak diulang pada tahap schema/domain ini.
- Bukti lokal: `dogfood-output/indikator-dinamis/field-custom-baseline.json`, `custom-foundation-tests.log`, `custom-backend-full.log`, dan `custom-parity.log`.

## Berikutnya

Lanjutkan tugas 3–4: gabungkan kontrak dengan validator konfigurasi dan snapshot periode, kemudian hubungkan customValues ke draft/submit/edit dengan penguncian dan audit existing. Setelah itu tugas 5–7 membangun editor admin dan renderer operator. Metode baru baru dibuka setelah binding, preview dan kalkulator live terhubung dan teruji. Rincian semua tugas tetap pada [checklist](todo-field-kustom.md).

Kebutuhan pengguna belum selesai seluruhnya: tombol tambah field bebas belum tersedia di halaman admin. Tidak ada deployment atau push remote pada tahap ini.

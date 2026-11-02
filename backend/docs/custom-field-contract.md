# Field kustom dan sumber skor

Status 2 November 2026: integrasi lokal selesai. Admin membuat field di `/admin/indikator`; konfigurasi, input operator, draft, riwayat, validasi, publik, skor dan ekspor membaca kontrak yang sama. Tidak ada upgrade dependensi.

## Penggunaan admin

1. Buka Master Indikator, Tambah indikator atau Edit, lalu buka **Atur field formulir operator** dan klik **Tambah field baru**.
2. Isi nama, tipe, bantuan, contoh isian, wajib/opsional, validasi dan visibilitas. Tersedia duplikasi, urutan dan penghapusan field. ID field/opsi dibuat otomatis dan tidak berubah saat label atau urutan diedit.
3. Pilih metode dan **Sumber perhitungan skor**. Sumber yang dipilih otomatis wajib saat submit. Angka sumber harus mempunyai minimum nonnegatif. Persentase memakai sumber bilangan bulat; kategori memakai pilihan tunggal.
4. Untuk kategori, isi bobot setiap pilihan. Untuk wilayah/jenjang kustom, lengkapi pemetaan ke kategori kanonis.
5. Periksa pratinjau formulir dan simpan master. Pada `/admin/bobot`, tambahkan indikator ke periode, lengkapi bobot, simpan konfigurasi dan gunakan simulasi sebelum menerima input.

Mengubah master tidak mengubah snapshot periode lama. Fields, metode dan binding periode terkunci setelah ada satu capaian, termasuk draft/soft-deleted. Periode baru atau konfigurasi yang belum dipakai dapat disusun ulang. Bobot kategori boleh diperbarui tanpa mengganti binding selama periode belum final. Final/arsip tetap terkunci.

## Definisi dan jawaban

Definisi field: `{ source: 'custom', key: 'cf_<id>', type, label, required, visibility, ...validation }`. Opsi menggunakan `{ value: 'opt_<id>', label }`. `visibility` bernilai `internal` (default UI) atau `public`. Tipe yang tersedia: `text`, `textarea`, `integer`, `decimal`, `date`, `select`, `multiselect`, `boolean`, `url`.

Batas: 25 field kustom/32 KiB definisi per indikator; 50 opsi per pilihan; 16 KiB jawaban per baris. Teks pendek/URL maksimal 2.000 karakter; teks panjang 4.000. Angka ±1e9, desimal maksimal 6 tempat; min/max dan presisi dapat dipersempit admin. Tanggal disimpan `YYYY-MM-DD` tanpa konversi zona waktu; URL hanya http(s). Pilihan jamak berupa array ID opsi tanpa duplikat. Nilai awal kosong; Ya/Tidak membedakan belum dijawab dari `false`.

`GET /api/admin/indikator-contract` mengirim `customTypes`, `customLimits`, `scoreRoles`, katalog bawaan dan template. API CRUD master/periode menerima `fields` dan `scoringConfig`. API operator menerima:

```json
{
  "periodeId": 123,
  "revision": 2,
  "items": [{
    "namaKegiatan": "Diklat",
    "linkBukti": "https://example.com/bukti",
    "customValues": { "cf_duration": 6, "cf_partner": false }
  }]
}
```

PATCH `customValues`: key yang tidak dikirim dipertahankan; null mengosongkan satu key; `false` dan `0` sah. Wajib diperiksa saat submit, draft boleh parsial. Field asing, tipe salah, tanggal/opsi/URL invalid dan jawaban berlebih ditolak. Key JSON tidak di-spread ke kolom database. Nilai lama SQL NULL dibaca sebagai objek kosong; Prisma 5.18 membedakan DbNull/JsonNull dan telah diuji pada MySQL lokal.

## Sumber dan perhitungan

Binding berupa `{ source: 'builtin'|'custom', key }`:

| Metode | Parameter |
| --- | --- |
| per_capaian | Jumlah baris disetujui × nilaiBobot; tanpa sumber tambahan. |
| per_jumlah | quantity × nilaiBobot; jumlah seluruh nilai sumber. |
| persentase | numerator/denominator; jumlah pembilang ÷ jumlah penyebut × nilaiBobot. |
| per_tingkat_wilayah | category; categoryMap bila sumber custom, bobot dari empat wilayah kanonis. |
| per_jenjang | category dan quantity; categoryMap bila sumber custom, bobot S1/S2/S3. |
| per_kategori | category, weights per ID opsi, quantity opsional (default satu per baris). |

Contoh: durasi 6+4 dengan bobot 2 =20; pembilang 80/100 dengan bobot 20 =16; daring 4×2 + tatap muka 3×5 =23. Persentase memakai agregasi total, bukan rata-rata persentase baris; 0/0=0 dan pembilang tidak boleh melebihi penyebut. Field teks/tanggal/boolean/multi-pilihan bukan sumber aritmetika.

Preview memvalidasi tipe/batas/presisi field sumber tanpa mewajibkan nama, bukti dan field pendukung. Kalkulator yang sama dipakai untuk preview, skor, ranking dan ekspor. Hanya baris disetujui/tidak dihapus dihitung. Binding NULL mempertahankan jalur empat metode lama. Hasil perhitungan kustom dan total periode yang menggunakannya dibatasi 1e12. Submit memeriksa sumber; persetujuan dan perubahan bobot memeriksa agregat secara atomik dan rollback bila melampaui batas.

Salin bobot mempertahankan sumber tujuan, memeriksa kompatibilitas metode/binding dan ID opsi, serta mengembalikan jumlah disalin/dilewati. Revision, lock periode dan audit existing tetap berlaku.

## Tampilan dan privasi

- Input Capaian: seluruh field sesuai snapshot; draft dapat dibuka ulang tanpa kehilangan nilai. Error field ditampilkan di dekat isian.
- Riwayat: nilai internal dan publik milik madrasah operator; edit/resubmit mempertahankan customValues. Konflik penyimpanan membuka kembali isian edit. Profil operator mempunyai tautan ke seluruh jawaban pada Riwayat.
- Detail validasi admin: seluruh jawaban dan ringkasan sumber hitung; label opsi menggunakan snapshot, bukan ID mentah.
- Katalog publik/Tentang/Panduan: label, tipe, bantuan dan ketentuan field; tanpa jawaban operator.
- Detail madrasah publik: server memilih hanya customValues berstatus public dari capaian disetujui/nondeleted. Sumber skor internal tetap tidak dikirim; linkBukti tetap internal. Klien melakukan whitelist tambahan.
- Excel admin: worksheet Leaderboard, Rincian Indikator dan Rincian Capaian. Rincian berbentuk satu field per baris untuk menjaga label antarindikator, angka tetap numerik, pilihan/boolean memakai label, tanggal tetap string kalender. Teks seperti `=SUM(...)` ditulis sebagai string literal.
- PDF admin: lampiran Rincian Capaian dapat dipilih dengan checkbox atau `?includeDetails=true`. Isi panjang dibungkus dan dilanjutkan ke halaman berikutnya.

Definisi metadata adalah teks; tidak ada HTML/skrip/formula pengguna yang dieksekusi. Unggah file langsung, grup berulang dan field bersyarat belum termasuk cakupan.

## Verifikasi dan rollback

Jalankan suite backend/frontend, lint dan build frontend. Tes customFieldFlow meliputi snapshot, draft/edit/clear, per jumlah/kategori/persentase, preview vs aktual, privasi, ekspor, salin bobot dan rollback overflow. Tes murni mencakup pemetaan wilayah/jenjang dan validasi tipe. Script `backend/scripts/qa-custom-fields.mjs` menyediakan setup/capture/cleanup fixture lokal berdasarkan ledger ID; artefak ada di folder dogfood-output yang diabaikan Git.

Migration aditif telah diterapkan secara lokal. Jangan rollback ke build yang membuang JSON baru atau menghapus enum/kolom setelah dipakai. Untuk menahan penggunaan, hentikan input/nonaktifkan penawaran master dan pertahankan pembaca data baru. Tidak ada deployment/push remote pada pekerjaan ini.

Referensi Context7: `/reactjs/react.dev` (controlled input dan identitas daftar), `/prisma/web` (DbNull/JsonNull dengan kompatibilitas diverifikasi terhadap Prisma 5.18), `/exceljs/exceljs` (string literal vs formula object), `/foliojs/pdfkit` (wrapping/paginasi teks).

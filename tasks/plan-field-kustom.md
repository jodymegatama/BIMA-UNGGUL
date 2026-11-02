# Rencana: field kustom operator dan sumber perhitungan skor

Tanggal: 2 November 2026.
Status: disetujui pengguna dan selesai diimplementasikan secara lokal pada 2 November 2026, termasuk integrasi API/UI, perhitungan skor, privasi dan ekspor. Lihat [progres](progres-field-kustom.md).
Checklist: [todo-field-kustom.md](todo-field-kustom.md).
Fondasi yang sudah selesai: [hasil indikator dinamis](hasil-implementasi-indikator-dinamis.md).

## Kebutuhan yang sudah dikonfirmasi

- Admin dapat menambahkan field baru di dalam suatu indikator melalui `/admin/indikator`, misalnya Durasi Diklat, Nomor Sertifikat, Tanggal Kegiatan, atau Kategori Capaian.
- Field tersebut benar-benar disimpan dan dapat dibaca/edit kembali oleh operator, bukan hanya label pada layar.
- Jawaban pengguna: **field tambahan juga dapat dipilih sebagai sumber perhitungan skor**. Ini menjadi bagian cakupan, bukan fitur lanjutan opsional.
- Admin membuat nama field dan memilih tipe serta validasinya dari pilihan yang tersedia. Penyusunan formula dilakukan melalui metode dan pemetaan sumber data yang terkontrol.

## Temuan implementasi saat ini

Penelusuran graphify dilanjutkan dengan pemeriksaan sumber aktual:

| Sumber | Batasan sekarang |
| --- | --- |
| `backend/src/services/indikatorConfig.js` | `FIELD_CATALOG` membatasi key ke kolom bawaan; `validateConfig` menolak key baru. |
| `backend/prisma/schema.prisma` | `SubmissionItem` memakai kolom tetap; belum ada tempat untuk nilai field kustom. Definisi formulir master/periode sudah menggunakan JSON. |
| `backend/src/services/submissionService.js` | Sanitasi/validasi dan spread payload ke query perlu dipisahkan antara nilai kolom bawaan dan nilai kustom. |
| `backend/src/services/scoringService.js` | Engine membaca kolom bawaan seperti jumlah, tingkatWilayah, pembilang/penyebut; belum memiliki pemetaan sumber field. |
| `backend/src/services/indikatorService.js` | Snapshot dan revision sudah tersedia. Formulir/metode periode sudah dikunci setelah ada capaian, termasuk draft. |
| `frontend/src/components/admin/IndikatorEditor.jsx` | Editor menyediakan checkbox katalog field bawaan; belum ada tombol untuk membuat field baru atau mengatur opsi pilihan sendiri. |
| `InputCapaian.jsx`, `RiwayatSubmission.jsx`, helper payload | Beberapa jalur normalisasi draft masih menyebut kolom bawaan secara eksplisit; nilai kustom harus dibawa pada semua jalur. |
| API publik dan ekspor | API publik saat ini tidak menampilkan link bukti. Ekspor berisi ranking dan subtotal indikator; belum mengekspor data field kustom setiap capaian. |

Versi terpasang dari pekerjaan sebelumnya: Prisma 5.18.0 dan React 19.2.8. Implementasi memverifikasi ulang lockfile/client; tidak memerlukan upgrade framework.

## Rancangan data

### Definisi field

Perluas array `fields` yang sudah ada. Field bawaan tetap dapat dibaca dengan bentuk lama; `source` yang tidak diisi berarti field bawaan. Field kustom mempunyai:

- `source: custom`, `key` berupa ID stabil buatan sistem, `label`, `type`, `required`, `help`, `placeholder`, serta aturan validasi sesuai tipe.
- Key tidak diketik admin dan tidak berubah ketika label atau urutan diubah. Gunakan namespace `cf_...` agar tidak bertabrakan dengan kolom bawaan dan key internal aplikasi.
- Opsi dropdown/multi-pilihan mempunyai ID stabil sendiri dan label yang dapat diedit. Jawaban menyimpan ID opsi; tampilan menggunakan label dari snapshot periode.
- Visibilitas nilai: `internal` sebagai default, atau `public` yang dipilih eksplisit admin. Memilih suatu field sebagai sumber skor tidak otomatis memublikasikan jawabannya. Link bukti bawaan tetap internal.

Definisi field tetap berada pada master dan snapshot konfigurasi periode. Tidak perlu membuat kolom database baru setiap kali admin menambah field.

### Penyimpanan jawaban dan pemetaan skor

- Tambahkan `SubmissionItem.customValues Json?`, berupa objek key field → nilai bertipe JSON. Nilai SQL NULL pada data lama dibaca sebagai objek kosong.
- Kolom bawaan tetap dipakai untuk field bawaan. Jangan menggandakan nilai bawaan ke customValues atau mencampurkan key customValues ke argumen kolom query database.
- Tambahkan `scoringConfig Json?` pada master dan konfigurasi periode, untuk menyimpan binding sumber skor dan parameter tambahan metode baru. Snapshot mencakupnya sebagaimana fields/metode.
- Konfigurasi lama dengan scoringConfig NULL memakai pemetaan kolom bawaan existing. Interpretasi default ini harus menghasilkan skor identik; migrasi jawaban lama ke JSON tidak diperlukan.
- PATCH customValues menggabungkan per key: key yang tidak dikirim dipertahankan; null mengosongkan field tersebut. Pengosongan field wajib ditolak saat submit. Pengosongan draft diizinkan. Angka 0 dan boolean false dipertahankan sebagai nilai, bukan dianggap kosong.
- Key tidak dikenal, tipe salah, key duplikat dalam definisi, dan key terlarang ditolak secara terstruktur. Sanitasi mengikuti snapshot periode yang sesuai.

## Tipe field tahap ini

| Tipe | Contoh | Aturan |
| --- | --- | --- |
| Teks pendek | Nomor Sertifikat | Panjang maksimum; disimpan sebagai teks agar nol di depan tetap ada. |
| Teks panjang | Uraian Pelaksanaan | Multibaris, batas panjang, rendering teks aman. |
| Bilangan bulat | Jumlah Peserta | Batas minimum/maksimum, tanpa pecahan. |
| Angka desimal | Durasi dalam jam | Batas dan presisi yang ditetapkan; NaN/Infinity ditolak. |
| Tanggal | Tanggal Kegiatan | Tanggal kalender valid `YYYY-MM-DD`; tidak digeser karena zona waktu. |
| Pilihan tunggal | Kategori Kegiatan | Opsi yang dibuat admin dengan ID stabil. |
| Pilihan jamak | Sasaran Kegiatan | Array ID opsi valid, tanpa duplikat; batas pilihan. |
| Ya/Tidak | Melibatkan Mitra | Tiga kondisi UI: belum dijawab, Ya, Tidak. Jawaban Tidak sah untuk field wajib yang sudah dijawab. |
| URL | Situs Penyelenggara | URL http(s); tautan ditampilkan dengan aman. |

Usulan batas awal: maksimal 25 field kustom per indikator, 50 opsi per field pilihan, definisi kustom total 32 KiB dan jawaban kustom per baris total 16 KiB. Teks pendek maksimal 2.000 karakter, teks panjang 4.000; batas admin boleh lebih ketat. Request tetap tunduk batas body API yang ada, dengan pesan jelas tanpa menghapus isian. Nilai awal kosong tidak boleh otomatis menjadi 0, false, tanggal hari ini, atau opsi pertama.

Upload berkas langsung, kode/HTML/JavaScript yang dieksekusi admin, perulangan grup field, dan field bersyarat bukan cakupan tahap ini. URL tetap dapat digunakan untuk dokumen pendukung.

## Field kustom sebagai sumber skor

Admin memilih **metode**, **field sumber**, dan **bobot** melalui UI. Label sumber ditampilkan dalam rumus dan simulasi sehingga admin dapat memeriksa maknanya.

| Metode | Pemetaan sumber | Contoh |
| --- | --- | --- |
| Per capaian (existing) | Jumlah baris disetujui; field pendukung tidak mengubah pengali | 5 capaian × bobot 2 = 10. |
| Per jumlah (baru: `per_jumlah`) | Satu field angka bawaan/kustom | Durasi 6 + 4 jam, bobot 2 → 20. |
| Per tingkat wilayah (existing) | Field wilayah bawaan atau pilihan tunggal kustom yang dipetakan ke empat wilayah kanonis | 2 kabupaten × 3 + 1 nasional × 10 = 16. |
| Per jenjang (existing) | Field jenjang dan field jumlah; sumber dapat bawaan/kustom yang kompatibel | 2 lulusan S2 × 5 = 10. |
| Persentase (existing) | Dua field angka sebagai pembilang dan penyebut; dapat memakai ratio bawaan atau pasangan field kustom | 80 murid memenuhi syarat / 100 murid × bobot 20 = 16. |
| Per kategori (baru: `per_kategori`) | Pilihan tunggal kustom dan tabel bobot per ID opsi; pengali dipilih satu baris atau jumlah dari field angka | Pelatihan daring 4 jam × 2 + tatap muka 3 jam × 5 = 23. |

Aturan binding:

- Gunakan referensi sumber eksplisit: kolom bawaan atau ID field kustom. Referensi harus ada pada konfigurasi periode, bertipe sesuai, dan tidak boleh mengarah ke skor hasil/peringkat.
- Hanya field angka yang ditawarkan untuk jumlah/pembilang/penyebut. Wilayah/jenjang memakai nilai kanonis atau mapping opsi yang lengkap. Per kategori memakai ID opsi stabil sehingga mengganti urutan/label opsi tidak menukar bobot.
- Field yang diperlukan formula otomatis wajib saat submit. Draft tetap boleh parsial dan belum masuk skor. Boolean, teks, tanggal, URL dan multi-pilihan tidak menjadi sumber aritmetika pada tahap ini.
- Untuk persentase, agregasi tetap jumlah pembilang ÷ jumlah penyebut; bukan rata-rata persentase baris. Pertahankan 0/0 = 0, pembilang tidak melebihi penyebut, dan batas nonnegatif. Kecocokan min/max/pecahan pada field sumber divalidasi saat konfigurasi dan submit.
- Untuk per jumlah/per kategori, nilai pengali tidak negatif; bobot nol eksplisit sah. Bobot kosong berbeda dari nol. Semua opsi kategori harus memiliki bobot sebelum aktivasi/finalisasi.
- Resolver sumber dan kalkulator yang sama dipakai saat simulasi, skor madrasah, ranking, dan ekspor. Tidak boleh ada implementasi formula terpisah di frontend.
- Tetapkan batas angka dan presisi yang aman dalam kontrak sebelum coding; hasil tidak boleh NaN/Infinity atau melewati rentang hitung yang disepakati. Jangan mengubah aturan pembulatan dan tie-breaker metode lama.
- Tambah dua nilai enum TipeFormula secara aditif. Semua validasi, form bobot, seed/fixture, dan adapter bobot lama harus mengenali metode baru atau menolak permintaan yang tidak didukung secara jelas; jangan memperlakukan metode tidak dikenal sebagai skor nol.

## Siklus hidup dan histori

- Mengubah default master berlaku pada konfigurasi yang dibuat berikutnya. Isi fields, scoringConfig, tipe formula dan bobot periode tetap tersimpan sendiri.
- Periode belum memiliki capaian: admin dapat menambah, menghapus, mengubah tipe, pilihan, urutan, validasi, visibilitas, dan binding.
- Periode sudah memiliki capaian (termasuk draft/soft-deleted): pertahankan kunci perubahan struktural existing untuk fields, tipe formula, dan scoringConfig. Untuk memakai field/rumus baru, konfigurasi periode berikutnya disiapkan dari default terbaru.
- Menghapus field dari default master tidak menghapus jawaban atau label pada periode lama. Key field dan ID opsi tidak boleh didaur ulang untuk arti lain.
- Final/arsip terkunci. Reopen tidak membuka perubahan struktural yang sudah digunakan. Koreksi deskripsi mengikuti aturan existing.
- Perubahan binding harus mendapat perlakuan yang sama seperti perubahan formula, bukan dianggap hanya perubahan teks. Seluruh pemeriksaan/mutasi/audit memakai lock dan revision periode existing.
- Salin bobot tidak menyalin definisi/binding secara diam-diam. Tampilkan sumber field pada konfirmasi; tabel bobot kategori hanya dapat disalin apabila ID opsi tujuan kompatibel. Perbedaan metode/mapping ditolak atau dilaporkan sebagai dilewati secara eksplisit.

Aturan kunci periode di atas mengikuti implementasi indikator dinamis yang sudah disetujui. Jika diperlukan menambahkan field pada periode yang sudah berisi capaian, itu memerlukan rancangan versi skema per capaian dan keputusan tambahan; tidak dilakukan dengan mengubah histori diam-diam.

## Pengalaman admin dan operator

### Admin

Di bagian Atur field formulir operator tersedia tombol **Tambah field baru**. Admin mengisi nama/label, tipe, bantuan, aturan wajib, batas nilai/panjang atau opsi, serta visibilitas. Admin dapat menyusun ulang, menduplikasi dengan ID baru, dan menghapus field yang belum terkunci. Key internal tidak perlu diketik atau dipahami admin.

Bagian **Sumber perhitungan skor** menampilkan pilihan yang cocok dengan metode. Contoh memilih Per jumlah → Durasi Diklat → bobot 2. Per kategori menampilkan tabel bobot berdasarkan opsi. Mengganti metode tidak menghapus field pendukung tanpa tindakan admin; tampilkan sumber yang perlu dipilih ulang. Pratinjau formulir dan simulasi skor tersedia sebelum aktivasi.

### Operator dan admin validasi

Input Capaian, lanjutkan draft, Riwayat/edit/resubmit, dan detail validasi memakai renderer dan validator metadata yang sama. Simpan nilai dengan identitas field stabil sehingga urutan/label tidak menukar jawaban. Perubahan periode/revision tidak membuang isian belum tersimpan; permintaan basi menjadi konflik yang dapat dipahami.

Formulir menampilkan kesalahan pada field terkait, termasuk customValues, dan menampilkan nilai kategori sebagai label. Detail validasi admin menampilkan semua jawaban, sumber hitung yang relevan, dan konteks periode. Tipe URL tidak dieksekusi sebagai HTML.

### Publik dan ekspor

- Beranda/Tentang/Panduan menampilkan label, tipe dan ketentuan field dari metadata. Jawaban operator tidak disalin ke katalog definisi.
- Detail madrasah publik hanya mengirim nilai field berstatus public dari capaian disetujui yang tidak dihapus, memakai whitelist server dan snapshot periode. Field internal tidak boleh bocor lewat properti JSON mentah atau objek `_raw`.
- Profil operator dan detail validasi admin dapat membaca seluruh nilai sesuai kepemilikan/hak akses.
- Ekspor admin menambah worksheet **Rincian Capaian** dengan label dan nilai custom per indikator; ranking/subtotal tetap tersedia. PDF menyediakan lampiran rincian bila diminta admin agar ukuran laporan dapat dikendalikan. Field internal tetap tidak masuk endpoint publik.

## API dan migrasi

- Perluas respons `/api/admin/indikator-contract` dengan tipe custom, batas validasi, kemampuan sumber skor dan template binding. Gunakan satu kontrak otoritatif untuk editor dan backend.
- API CRUD master dan konfigurasi periode existing membawa fields dan scoringConfig. Definisikan penetapan ID custom/opsi yang stabil saat pembuatan; respons server mengembalikan bentuk kanonis. ID yang sudah disimpan permanen.
- Payload capaian memakai kolom bawaan existing dan `customValues: { cf_id: nilai }`, tetap dengan periodeId/revision. Server mengambil konfigurasi efektif, tidak mempercayai definisi atau rumus kiriman operator.
- Preview menerima contoh bertipe sama seperti capaian, mencakup customValues, tetapi tidak mewajibkan field pendukung yang tidak diperlukan untuk simulasi. Error menyebut label/field sumber yang gagal.
- Schema migration aditif: customValues nullable, scoringConfig nullable pada master/periode, dan dua enum metode. Tidak memindahkan/menghapus kolom lama.
- Sebelum migrasi, rekam baseline data, skor, ranking, dan ekspor metode lama. Setelah migrasi, NULL customValues dibaca sebagai {}, binding NULL sebagai kontrak lama. Seed/backfill tidak menimpa konfigurasi admin.
- Rilis backend dan frontend yang memahami kontrak baru sebelum membuka pembuatan custom field/metode baru. Setelah jawaban custom tersimpan, rollback harus mempertahankan pembaca/penyimpan JSON, bukan kembali ke build yang membuang key baru.

## Tahapan dan kriteria selesai

Tugas rinci ada di checklist. Urutan: kontrak/baseline → JSON/schema → validasi definisi/jawaban → editor dan alur operator → resolver skor → UI binding/simulasi → histori/konsumen → ekspor dan QA.

Checkpoint A: Nomor Sertifikat dan Durasi Diklat dibuat admin, diisi operator, disimpan sebagai draft, dibuka ulang, dan terlihat pada validasi tanpa mengubah skor lama.

Checkpoint B: Durasi Diklat menghitung skor per jumlah; pasangan field angka menghitung persentase; opsi kategori dengan bobot memberi hasil simulasi dan skor aktual yang sama. Binding salah tipe/tidak lengkap ditolak.

Checkpoint C: Field default diubah/dihapus tanpa kehilangan data periode lama; binding periode terpakai dan periode final terkunci; field internal tidak muncul pada API publik; laporan membaca nilai dan label yang benar.

Selesai jika tes terarah dan seluruh suite backend/frontend, lint, build frontend, schema drift, parity skor lama, QA browser desktop/mobile, serta inspeksi ekspor berhasil. Tes yang dilewati dilaporkan sesuai alasan; ambang pemeriksaan tidak dilonggarkan.

## Risiko utama dan mitigasi

| Risiko | Penanganan |
| --- | --- |
| Field muncul tetapi jawaban hilang saat draft/edit | Kontrak customValues diuji pada semua jalur normalisasi, clear, patch, dan resubmit. |
| Perubahan binding mengubah histori | Snapshot scoringConfig dan lock struktural setelah capaian pertama. |
| Checkbox false/angka nol dianggap kosong | Validasi kekosongan per tipe, boolean dengan kondisi belum dijawab. |
| Opsi berubah dan bobot menempel ke label yang salah | ID opsi stabil, bobot menggunakan ID dan label snapshot. |
| Field bebas menjadi mass assignment atau bocor ke publik | Namespace terpisah, validasi server, whitelist per konteks, tidak spread JSON ke kolom DB. |
| Skor versi baru berbeda dari preview atau merusak metode lama | Satu resolver/kalkulator, fixture regresi dan baseline sebelum/sesudah. |

## Dokumentasi yang diperiksa

Context7: `/reactjs/react.dev` (reputasi High, benchmark 83.06) untuk controlled input, checked boolean, dan key stabil saat reorder. Sumber resmi: [rendering lists](https://react.dev/learn/rendering-lists), [preserving state](https://react.dev/learn/preserving-and-resetting-state).

Resolusi Prisma memberikan `/prisma/orm/5.20.0` dan `/websites/prisma_io`. Hasil query versi 5.20 tidak memuat penjelasan JSON yang diperlukan; indeks website memuat ORM 8, sehingga contoh API generasi tersebut tidak dipakai sebagai bukti kompatibilitas Prisma 5. Rencana JSON merujuk pola Json? dan Prisma.DbNull yang sudah dipakai proyek; implementasi wajib memverifikasi round-trip/null/validasi menggunakan client 5.18.0 dan MySQL lokal sebelum migrasi.

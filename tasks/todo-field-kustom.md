# Tugas: field kustom dan sumber skor

Status: seluruh tahap implementasi lokal selesai pada 2 November 2026; hasil dan batas verifikasi dicatat dalam laporan progres. Lihat [progres](progres-field-kustom.md). Acuan: [plan-field-kustom.md](plan-field-kustom.md).
Setiap tugas dijalankan berurutan dengan tes atas perilaku yang berubah. Pekerjaan indikator dinamis sebelumnya tetap tercatat terpisah.

## 1. Kontrak dan baseline
Dependensi: tidak ada. File utama: dokumentasi kontrak, fixture baseline, tes kontrak baru.
- [x] Tetapkan bentuk definisi, ID field/opsi, customValues, scoringConfig, tipe yang didukung, batas payload dan error per field.
- [x] Tetapkan binding enam metode, rentang/presisi angka yang aman, dan aturan field skor wajib.
- [x] Rekam baseline jumlah data, skor/subtotal/ranking dan contoh ekspor metode lama; inventarisasi semua konsumen.
Verifikasi: contoh Durasi, Nomor Sertifikat, persentase dan kategori dapat direpresentasikan; lockfile/client dikonfirmasi.

## 2. Schema JSON dan metode baru
Dependensi: 1. File utama: schema.prisma, migration baru, tes integritas/round-trip baru.
- [x] Tambahkan customValues, scoringConfig master/periode dan enum per_jumlah/per_kategori secara aditif.
- [x] Nilai NULL lama terbaca tanpa kehilangan kolom atau perubahan skor; JSON null/DbNull diuji terhadap Prisma 5.18.0.
- [x] Migration dan bootstrap tidak menimpa konfigurasi admin.
Verifikasi: migration pada DB uji, generate client, schema drift, round-trip string/angka/false/array/null.

## 3. Validasi definisi field dan binding
Dependensi: 2. File utama: indikatorConfig.js, indikatorService.js, validator custom baru, tes konfigurasi.
- [x] Terima field/opsi custom dengan ID stabil, batas tipe dan aturan sumber skor; key terlarang/bentrok ditolak.
- [x] Pertahankan aturan field bawaan wajib dan tambahkan kewajiban sumber formula saat submit.
- [x] Kontrak admin menyajikan kemampuan tipe/validasi/binding dari sumber yang sama.
Verifikasi: duplikasi ID, opsi hilang, field salah tipe, definisi terlalu besar dan binding tidak dikenal menghasilkan 400 terstruktur.

## 4. Penyimpanan dan validasi jawaban server
Dependensi: 3. File utama: submissionService.js, validator jawaban baru, unit test dan integration test baru.
- [x] Draft/submit/edit mengolah kolom bawaan dan customValues secara terpisah sesuai snapshot periode.
- [x] PATCH mempertahankan key yang tidak dikirim, null mengosongkan, false/0 tetap sah; key asing ditolak.
- [x] Revision, cutoff, kepemilikan, status input, lock periode dan audit tetap berlaku.
Verifikasi: draft parsial → buka ulang → lengkapi → submit; tanggal/angka/URL/opsi invalid, payload berlebih dan lintas lembaga ditolak.

## 5. Editor field baru pada admin
Dependensi: 3. File utama: IndikatorEditor.jsx, editor custom baru, indikatorController.js, test editor.
- [x] Tambah, edit, duplikasi, hapus dan urutkan field custom; admin mengelola opsi sendiri tanpa mengetik ID internal.
- [x] Bantuan, wajib/opsional, validasi dan visibilitas dapat diatur; ID stabil saat label/urutan berubah.
- [x] Pratinjau formulir memperlihatkan field bawaan dan custom dengan pesan batas yang jelas.
Verifikasi: QA editor membuat Nomor Sertifikat, Durasi, tanggal, kategori dan Ya/Tidak; konfigurasi tersimpan sesuai respons kanonis.

## 6. Renderer operator dan helper payload
Dependensi: 4–5. File utama: CapaianRow.jsx, renderer custom baru, constants/indikator.js, test renderer/helper.
- [x] Semua tipe custom tampil dengan label aksesibel; radio Ya/Tidak membedakan false dari belum dijawab.
- [x] Nilai awal, error, sanitasi klien dan payload mengikuti tipe/snapshot; field tersembunyi dari formula tidak otomatis hilang.
- [x] State memakai ID stabil saat reorder dan pergantian indikator/periode tidak menukar jawaban.
Verifikasi: uji tanggal, desimal, pilihan jamak, label berubah, false, 0, dan pengosongan; QA mobile.

## 7. Lanjutkan draft dan riwayat
Dependensi: 6. File utama: InputCapaian.jsx, RiwayatSubmission.jsx, helper draft bila perlu, integration UI test.
- [x] Semua jalur load draft, lanjutkan semua, edit ditolak, dan resubmit mempertahankan customValues.
- [x] Revisi/periode berubah menampilkan konflik tanpa membuang isian belum tersimpan.
- [x] Field yang tidak dikirim pada PATCH tidak terhapus dan null dapat mengosongkan field opsional.
Verifikasi: reload browser setelah draft, pindah tab, edit/resubmit, dan kembali ke baris yang sama tanpa duplikasi atau kehilangan nilai.

## Checkpoint A
- [x] Field buatan admin tersimpan dan terbaca ulang end-to-end; skor metode lama tetap sama dengan baseline.

## 8. Resolver sumber dan engine skor
Dependensi: 3–4. File utama: scoringService.js, resolver sumber baru, tes engine dan scoring integrasi.
- [x] Empat metode lama memakai binding bawaan atau custom yang kompatibel; tambahkan per jumlah dan per kategori.
- [x] Terapkan agregasi, batas angka, presisi, kategori dan aturan rasio dari kontrak; hasil invalid tidak diam-diam menjadi nol.
- [x] Hanya capaian disetujui/tidak dihapus dihitung; ranking/tie-breaker lama tetap konsisten.
Verifikasi: Durasi 6+4 ×2 =20; rasio 80/100 ×20 =16; kategori 4×2+3×5 =23; parity seluruh fixture lama.

## 9. Pemilihan sumber skor dan simulasi admin
Dependensi: 5, 8. File utama: editor binding baru, IndikatorEditor.jsx, IndikatorPeriodCard.jsx, indikatorService.js, test preview.
- [x] Dropdown sumber hanya menampilkan field bertipe cocok; label/opsi sumber jelas dan field formula wajib ditandai.
- [x] Form bobot mendukung metode baru dan tabel bobot kategori dari ID opsi.
- [x] Preview menerima customValues dan memakai resolver/engine yang sama; perubahan contoh menghapus hasil preview basi.
Verifikasi: simulasi vs skor aktual sama, binding salah tipe/tidak lengkap ditolak, contoh tidak disimpan sebagai capaian.

## 10. Snapshot, lifecycle dan salin bobot
Dependensi: 8–9. File utama: indikatorService.js, periodService.js, seed/fixture terkait, tes lifecycle/konkurensi.
- [x] Snapshot mencakup scoringConfig; perubahan default master tidak mengubah periode lama.
- [x] Fields/binding/metode terkunci setelah ada capaian; finalisasi memeriksa kelengkapan semua sumber/bobot.
- [x] Salin bobot mempertahankan binding tujuan dan hanya menyalin kategori yang kompatibel, dengan revision serta audit.
Verifikasi: edit/hapus master, perubahan opsi, final/reopen, submit bersamaan perubahan config, dan dua admin dengan revisi sama.

## Checkpoint B
- [x] Field kustom dapat menjadi sumber skor; simulasi, detail, ranking dan metode lama konsisten; histori terlindungi.

## 11. Detail validasi dan pembacaan internal
Dependensi: 7, 10. File utama: operatorController.js, validationService.js, ValidasiDetailModal.jsx, renderer nilai bersama, test detail.
- [x] Admin/operator membaca nilai custom lengkap sesuai hak akses dan label snapshot; kategori/multi-pilihan ditampilkan sebagai label.
- [x] Ringkasan sumber skor pada detail sesuai periode dan nilai tersimpan.
- [x] Nilai kosong, nilai panjang dan URL ditampilkan aman tanpa HTML aktif.
Verifikasi: draft/ditolak/disetujui terlihat konsisten pada riwayat serta detail validasi; pengguna lain tidak dapat membaca jawaban internal.

## 12. Katalog dan tampilan publik
Dependensi: 11. File utama: publicController.js, IndikatorCatalog.jsx, PrestasiList.jsx, mapper detail madrasah, test publik.
- [x] Katalog menjelaskan field tanpa menyalin jawaban operator.
- [x] API publik hanya mengirim jawaban field public dari capaian disetujui/tidak dihapus berdasarkan snapshot.
- [x] Field internal dan link bukti bawaan tidak bocor melalui JSON mentah, properti tambahan atau fallback.
Verifikasi: bandingkan respons admin/operator/publik, termasuk field dipakai untuk skor tetapi tetap internal dan field berubah pada periode berikutnya.

## 13. Ekspor rincian capaian
Dependensi: 11–12. File utama: exportService.js, exportController.js, ExportLaporan.jsx, test ekspor.
- [x] Excel admin menyediakan Rincian Capaian per indikator dengan label dan nilai custom yang benar.
- [x] PDF dapat menyertakan lampiran rincian atas pilihan admin; ranking/subtotal lama tetap tersedia.
- [x] Angka/tanggal/array diserialisasi konsisten; teks seperti =SUM(...) tetap teks, bukan formula spreadsheet.
Verifikasi: baca kembali workbook, cocokkan subtotal, render PDF dengan label/nilai panjang dan banyak field.

## Checkpoint C
- [x] Privasi nilai mengikuti konfigurasi, histori utuh, dan ekspor menampilkan hasil yang dapat diverifikasi.

## 14. QA menyeluruh dan dokumentasi
Dependensi: 13. File utama: smoke test baru, dokumentasi operasional/API, laporan hasil.
- [x] Jalankan semua acceptance dengan data uji terisolasi: empat metode lama dan dua metode baru, metadata/nilai/binding, serta lifecycle.
- [x] Verifikasi parity baseline, migration/seed berulang, rollback yang menjaga data custom, dan alur browser desktop/mobile.
- [x] Perbarui panduan admin/operator, checklist hasil dan catat tes yang skip atau batas verifikasi.
Verifikasi: test/lint backend dan frontend, build frontend, schema drift, inspeksi PDF/Excel; tidak ada test/guard yang dilemahkan untuk meloloskan hasil.

## Checkpoint akhir
- [x] Kebutuhan field bebas dan pemetaan sumber skor terpenuhi, dengan bukti UI/API/database.
- [x] Data dan skor lama tetap sama sampai admin mengubah konfigurasi periode yang memang boleh diubah.
- [x] Hasil siap ditinjau; implementasi dan migrasi hanya dimulai setelah pengguna menyetujui rencana ini.

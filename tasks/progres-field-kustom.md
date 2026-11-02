# Hasil implementasi field kustom

2 November 2026 — seluruh tahap lokal dari rencana yang disetujui selesai. Checklist: [todo-field-kustom.md](todo-field-kustom.md). Panduan/API: [kontrak field kustom](../backend/docs/custom-field-contract.md).

## Tahapan yang selesai

1. Fondasi (commit c79bdcf): baseline, kontrak sembilan tipe, penyimpanan JSON nullable, dua enum baru, validator dan kalkulator domain.
2. Integrasi backend: CRUD definisi dan sumber skor, snapshot, draft/submit/PATCH bertipe, privasi publik, kalkulator live, simulasi, salin bobot kompatibel serta penjagaan rentang secara atomik.
3. Integrasi UI: tambah/edit/duplikasi/urutkan/hapus field admin, pilihan sumber dan bobot kategori, pratinjau, input operator, lanjutkan draft, riwayat/edit/resubmit, detail validasi dan publik, katalog/panduan, ekspor Excel/PDF.

## Hasil verifikasi

- Backend: 19 file, 153 tes lulus, 6 tes lama dilewati karena kredensial khusus. Seluruh tes fitur baru dan fixture MySQL dijalankan.
- Frontend: 19 file, 83 tes lulus, termasuk identitas stabil, pemilihan sumber, false/0, array pilihan, tanggal, payload dan deteksi baris kosong.
- Lint backend/frontend bersih. Build frontend berhasil; peringatan chunk >500 kB yang sudah ada tetap tercatat, ambang tidak dilonggarkan.
- Prisma migrate diff menghasilkan No difference detected (exit 0).
- Baseline tetap 9 indikator, 1 periode, 60 madrasah, 1.083 capaian (1.082 disetujui, 1 ditolak). Setelah fixture dibersihkan, jumlah, subtotal, skor dan ranking seluruh periode cocok dengan baseline.

## QA browser dan artefak

Admin QA membuat indikator dan field Durasi Diklat (desimal/internal) serta Melibatkan Mitra (Ya/Tidak/publik) melalui editor, menghubungkan sumber per jumlah, memasang bobot 2 dan mengaktifkan input periode. Simulasi durasi 6 menghasilkan 12 poin.

Operator mengisi draft dengan durasi 6 dan jawaban Tidak, membuka ulang halaman, dan nilai keduanya tetap tersedia. Setelah bukti dilengkapi dan dikirim, detail validasi admin membaca 6 dan Tidak. Setelah disetujui skor aktual 12; endpoint publik hanya mengirim boolean public, tanpa durasi internal maupun link bukti. Tipe dan metode lain diuji lewat suite; QA browser manual memakai dua tipe tersebut.

Viewport mobile 390 px diperiksa. Nama periode panjang sempat membuat chip melebar; wrapping diperbaiki. Uji layout label panjang pada DOM setelah perbaikan menghasilkan scrollWidth 382 <=390. Screenshot awal form, detail validasi dan simulasi direkam. Lampiran PDF tiga halaman dibuat dan halaman rincian dirender/diperiksa; label, angka dan jawaban boolean terbaca. Excel dibaca ulang pada tes, termasuk perlindungan teks formula sebagai string.

Bukti lokal (diabaikan Git) di `dogfood-output/indikator-dinamis/`: custom-preview.png, custom-validation.png, custom-operator-mobile.png, custom-mobile-long-label-fixed.png, custom-qa.pdf/xlsx, custom-qa-page-3.png, custom-backend-full.log, custom-frontend-full.log, custom-parity.log. Seluruh akun, madrasah, periode dan indikator QA sementara dibersihkan memakai ID ledger sesi.

## Batas operasional

Field baru ditambahkan pada default master. Periode yang sudah mempunyai capaian (termasuk draft) tetap mengunci struktur/binding; perubahan dipakai pada konfigurasi periode berikutnya atau konfigurasi yang belum digunakan. Tidak ada pemindahan/hapus jawaban lama. Field internal default tidak otomatis menjadi publik ketika dipakai menghitung skor.

Tidak ada deployment atau push remote. Browser QA sempat memakai akun fixture lokal; akun tersebut sudah dibersihkan. Data aplikasi dan bobot lama tidak diubah oleh QA.

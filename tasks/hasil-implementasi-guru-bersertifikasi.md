# Indikator 10 — Jumlah Guru Bersertifikasi

Ditambahkan pada 3 November 2026 dengan kode `10`, slug `guru_bersertifikasi`, dan tipe `persentase`. Struktur database dan endpoint tetap memakai kontrak yang tersedia.

Guru bersertifikasi adalah guru aktif pemilik sertifikat pendidik. Total guru mencakup seluruh guru aktif ASN/non-ASN. Skor = Σ pembilang / Σ penyebut × bobot periode, hanya dari baris disetujui yang tidak dihapus. Nilai 0/0 menghasilkan 0. Link bukti wajib; catatan opsional; angka bulat 0–1.000.000 dan pembilang tidak melebihi penyebut. Beberapa baris diperbolehkan dengan kelompok guru tidak tumpang tindih.

## Penerapan

Jalankan `npm run db:add-guru-bersertifikasi -w backend` pada database yang sudah ada. Skrip bersifat aditif dan aman dijalankan ulang; hanya menambahkan bobot 0 pada periode aktif/belum dimulai yang belum melewati cutoff. Bobot yang sudah ada tidak ditimpa. Periode baru tanpa konfigurasi memberikan bobot efektif 0 hingga admin mengaturnya. Seed instalasi baru juga memuat indikator 10.

Database lokal telah diperbarui: 10 indikator, satu bobot awal ditambahkan, pemanggilan kedua menambahkan nol bobot. Perbandingan sebelum/sesudah pada satu periode yang tersedia membuktikan master lama, bobot lama, seluruh pengajuan, bobot periode tertutup, dan ranking empat kelompok tidak berubah.

## Tampilan

Konfigurasi pusat mencakup formulir rasio dan tab baru. Beranda dan Tentang memuat kartu sertifikasi; panduan, label bobot admin, rincian capaian publik, serta metadata SEO diperbarui. Daftar operator dan bobot API diurutkan secara numerik. Tampilan profil, riwayat, filter validasi, grafik, dan tabel mengikuti data dinamis.

## Verifikasi

- Backend: 14 file lulus, 137 pengujian lulus, 6 dilewati oleh konfigurasi suite yang sudah ada.
- Frontend: 16 file lulus, 84 pengujian lulus.
- Lint backend/frontend dan build produksi frontend lulus.
- Integrasi MySQL menguji draft, kirim, penolakan/edit/kirim ulang, persetujuan, skor agregat, bobot default, urutan 1–10, ekspor Excel/PDF, dan penguncian finalisasi untuk RA/MI/MTs/MA.
- Browser: kartu baru tampil di Beranda dan Tentang; kartu Tentang muat pada viewport 390px. Formulir rasio diuji melalui pengujian komponen, alur pengajuan melalui pengujian integrasi.
- Temuan di luar perubahan: navbar publik lama meluber pada viewport 390px; komponen navbar tidak diubah. Build tetap mengeluarkan peringatan ukuran chunk besar.

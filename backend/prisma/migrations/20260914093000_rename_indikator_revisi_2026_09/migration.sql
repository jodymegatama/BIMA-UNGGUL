-- Revisi 9 indikator (2026-09-14) — DATA-ONLY, tanpa perubahan skema.
-- Mengubah `nama` indikator master mengikuti spesifikasi baru user.
-- slug / kode / tipeFormula TIDAK berubah → kontrak API, bobot, dan skor tidak terpengaruh.
-- Idempoten: aman dijalankan ulang (UPDATE ... WHERE slug = ...).

UPDATE `Indikator` SET `nama` = 'Diklat Pendidik dan Tenaga Kependidikan' WHERE `slug` = 'diklat';
UPDATE `Indikator` SET `nama` = 'Penghargaan Individu Pendidik dan Tenaga Kependidikan' WHERE `slug` = 'penghargaan_individu';
UPDATE `Indikator` SET `nama` = 'Jumlah Pendidik dan Tenaga Kependidikan Lulus Jenjang Lanjutan' WHERE `slug` = 'lulus_jenjang_lanjutan';
UPDATE `Indikator` SET `nama` = 'Nilai Rata-rata Murid > 85' WHERE `slug` = 'rapor_rata_rata';
UPDATE `Indikator` SET `nama` = 'Murid Lanjutan Unggulan' WHERE `slug` = 'siswa_lanjutan_unggulan';
UPDATE `Indikator` SET `nama` = 'Giat Inovatif dalam Pengembangan Mutu Madrasah' WHERE `slug` = 'giat_inovatif';
UPDATE `Indikator` SET `nama` = 'Rasio Penerimaan Murid Baru' WHERE `slug` = 'rasio_penerimaan';

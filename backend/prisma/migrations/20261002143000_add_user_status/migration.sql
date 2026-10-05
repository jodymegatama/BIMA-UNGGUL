-- Add User.status (StatusUser) — kolom ini ada di schema.prisma sejak baseline
-- tapi belum pernah dibuat migration. DB dev mendapatkannya di luar migration,
-- jadi database yang dibangun murni dari `migrate deploy` (CI, produksi, setup
-- baru) tidak punya kolom ini dan query user gagal dengan
-- "The column `status` does not exist in the current database".
--
-- Dijaga dengan cek information_schema, bukan `ADD COLUMN IF NOT EXISTS`
-- (MySQL tidak mendukungnya): DB dev sudah punya kolom ini, sehingga ALTER
-- polos akan gagal "Duplicate column name" dan memblokir semua migration
-- berikutnya. Dengan guard ini migration aman dijalankan di dua kondisi:
--   * DB kosong hasil `migrate deploy` → kolom + index dibuat
--   * DB dev yang kolomnya sudah ada    → kolom dilewati, index tetap dibuat
--     kalau belum ada.
--
-- Catatan data: DEFAULT 'menunggu' membuat seluruh baris lama jadi 'menunggu'.
-- Login tidak memeriksa status, tapi refresh token memaksa `status = 'aktif'`
-- (authController.js), jadi tanpa backfill semua sesi produksi mati pada refresh
-- pertama setelah deploy. Backfill ada di langkah (2) — dijalankan HANYA saat
-- kolom baru dibuat.
-- 1) Buat kolom `status`, dijaga information_schema (MySQL tidak punya
--    ADD COLUMN IF NOT EXISTS).
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'User' AND COLUMN_NAME = 'status'
);
SET @sql := IF(@col_exists = 0,
  "ALTER TABLE `User` ADD COLUMN `status` ENUM('menunggu', 'aktif', 'nonaktif') NOT NULL DEFAULT 'menunggu'",
  'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Backfill: aktifkan baris lama, tapi HANYA saat kolom baru saja dibuat.
--
--    Kenapa di dalam, bukan manual: pada DB produksi yang kolomnya belum pernah
--    ada, semua baris tiba-tiba menerima default 'menunggu' dan seluruh akun
--    kehilangan sesi. Dijalankan di sini sehingga tidak ada jendela waktu tanpa
--    akun aktif.
--
--    Kenapa dijaga @col_exists = 0: saat kolom baru dibuat, semua baris yang
--    sudah ada langsung menerima default 'menunggu' — padahal sebelum migration
--    itu semua akun berfungsi normal, jadi 'aktif' adalah status yang benar.
--    Baris 'menunggu' yang sah lahir dari pendaftaran SESUDAH migration ini.
--    Sebaliknya, pada DB dev yang kolomnya sudah ada, registrasi yang masih
--    menunggu approval memang wajar diset 'menunggu' oleh aplikasi; tanpa guard
--    ini migration akan diam-diam meng-approve akun yang belum diverifikasi admin.
SET @backfill := IF(@col_exists = 0,
  "UPDATE `User` SET `status` = 'aktif' WHERE `status` = 'menunggu'",
  'DO 0'
);
PREPARE stmt_bf FROM @backfill;
EXECUTE stmt_bf;
DEALLOCATE PREPARE stmt_bf;

-- 3) Ikuti @@index([status]) di schema.prisma — dipakai filter antrian akun admin.
-- Dicek ke DUA nama: DB dev punya index status bernama lama (`idx_User_status`)
-- karena dibuat manual. Migration sync berikutnya yang menyeragamkan namanya,
-- jadi di sini cukup pastikan tidak ada index duplikat di kolom yang sama.
SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'User'
    AND INDEX_NAME IN ('User_status_idx', 'idx_User_status')
);
SET @sql2 := IF(@idx_exists = 0,
  'CREATE INDEX `User_status_idx` ON `User`(`status`)',
  'DO 0'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Rekonsiliasi drift schema.prisma ↔ migration (dibuat dari
-- `prisma migrate diff --from-url <db-dari-migration> --to-schema-datamodel`).
--
-- Isinya tiga kelompok:
--   1. Index lama bergaya `idx_<Model>_<field>` di-rename ke penamaan default
--      Prisma (`<Model>_<field>_idx`) supaya schema tidak perlu `map:`.
--   2. Index sisa yang tidak dideklarasikan schema di-drop:
--        - `idx_Indikator_slug` → duplikat dari unique index `slug`
--        - `idx_PeriodePenilaian_tanggalCutoff` dan `idx_Validation_aksi`
--          → tidak ada query yang memakainya sebagai leading filter
--      Drop index tidak menghilangkan data dan gampang ditambah lagi.
--   3. Kolom sisa `Indikator.createdAt` di-drop — tidak ada di schema dan tidak
--      dibaca kode mana pun. Ini menghilangkan data kolom itu; backup dulu
--      kalau perlu (sesuaikan nama tabel dengan case aslinya di DB Anda,
--      mis. `Indikator` di DB Linux / `indikator` di DB Windows):
--        CREATE TABLE indikator_createdAt_backup AS SELECT id, createdAt FROM `Indikator`;
--      Kolom `String @db.Text` yang di DB masih VARCHAR disamakan ke TEXT
--      (perluasan tipe, aman).
--
-- PORTABILITAS CASE: MySQL di Linux menyimpan nama tabel case-sensitive
-- (CREATE TABLE `Indikator` → tabel `Indikator`), sedangkan Windows
-- (lower_case_table_names=1) menurunkannya jadi `indikator`. Karena itu SETIAP
-- pernyataan yang dieksekusi mengambil nama tabel sebenarnya dari
-- information_schema lewat perbandingan LOWER(...), lalu CONCAT jadi SQL
-- dinamis — jadi cocok di kedua platform. (Versi sebelumnya menulis nama
-- tabel huruf kecil secara literal: gagal di CI Linux dengan error 1146
-- "Table 'bima_unggul_ci.indikator' doesn't exist".)
--
-- Semua pernyataan dijaga cek information_schema, jadi migration ini aman
-- dijalankan di dua jenis DB:
--   * DB segar hasil `migrate deploy` → index lama di-rename, index sisa
--     di-drop, kolom sisa di-drop
--   * DB dev yang sebagian sudah dibereskan manual → IDEMPOTEN, bagian yang
--     sudah sesuai dilewati
-- Tanpa guard, ALTER/DROP/RENAME polos akan gagal (mis. "check that column/key
-- exists") pada DB yang sudah sebagian benar, dan kegagalan migration
-- memblokir seluruh migration berikutnya.

SET @n := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('indikator') AND INDEX_NAME = 'idx_Indikator_slug');
SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('indikator') LIMIT 1);
SET @s := IF(@n > 0 AND @t IS NOT NULL, CONCAT('DROP INDEX `idx_Indikator_slug` ON `', @t, '`'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @n := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('periodepenilaian') AND INDEX_NAME = 'idx_PeriodePenilaian_tanggalCutoff');
SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('periodepenilaian') LIMIT 1);
SET @s := IF(@n > 0 AND @t IS NOT NULL, CONCAT('DROP INDEX `idx_PeriodePenilaian_tanggalCutoff` ON `', @t, '`'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @n := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('validation') AND INDEX_NAME = 'idx_Validation_aksi');
SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('validation') LIMIT 1);
SET @s := IF(@n > 0 AND @t IS NOT NULL, CONCAT('DROP INDEX `idx_Validation_aksi` ON `', @t, '`'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('auditlog') LIMIT 1);
SET @s := IF(@t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` MODIFY `alasan` TEXT NULL'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('deleterequest') LIMIT 1);
SET @s := IF(@t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` MODIFY `alasan` TEXT NOT NULL, MODIFY `alasanAdmin` TEXT NULL'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @n := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('indikator') AND COLUMN_NAME = 'createdAt');
SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('indikator') LIMIT 1);
SET @s := IF(@n > 0 AND @t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` DROP COLUMN `createdAt`'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('submissionitem') LIMIT 1);
SET @s := IF(@t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` MODIFY `catatan` TEXT NULL, MODIFY `alasanPenolakan` TEXT NULL'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('user') LIMIT 1);
SET @s := IF(@t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` MODIFY `telepon` VARCHAR(191) NULL'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('validation') LIMIT 1);
SET @s := IF(@t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` MODIFY `alasan` TEXT NULL'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @n := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('auditlog') AND INDEX_NAME = 'idx_AuditLog_action');
SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('auditlog') LIMIT 1);
SET @s := IF(@n > 0 AND @t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` RENAME INDEX `idx_AuditLog_action` TO `AuditLog_action_idx`'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @n := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('auditlog') AND INDEX_NAME = 'idx_AuditLog_createdAt');
SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('auditlog') LIMIT 1);
SET @s := IF(@n > 0 AND @t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` RENAME INDEX `idx_AuditLog_createdAt` TO `AuditLog_createdAt_idx`'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @n := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('auditlog') AND INDEX_NAME = 'idx_AuditLog_entity_entityId');
SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('auditlog') LIMIT 1);
SET @s := IF(@n > 0 AND @t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` RENAME INDEX `idx_AuditLog_entity_entityId` TO `AuditLog_entity_entityId_idx`'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @n := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('auditlog') AND INDEX_NAME = 'idx_AuditLog_userId');
SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('auditlog') LIMIT 1);
SET @s := IF(@n > 0 AND @t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` RENAME INDEX `idx_AuditLog_userId` TO `AuditLog_userId_idx`'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @n := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('auditlog') AND INDEX_NAME = 'idx_AuditLog_userId_createdAt');
SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('auditlog') LIMIT 1);
SET @s := IF(@n > 0 AND @t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` RENAME INDEX `idx_AuditLog_userId_createdAt` TO `AuditLog_userId_createdAt_idx`'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @n := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('bobotindikator') AND INDEX_NAME = 'idx_BobotIndikator_periodeId');
SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('bobotindikator') LIMIT 1);
SET @s := IF(@n > 0 AND @t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` RENAME INDEX `idx_BobotIndikator_periodeId` TO `BobotIndikator_periodeId_idx`'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @n := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('bobotindikator') AND INDEX_NAME = 'idx_BobotIndikator_terkunci');
SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('bobotindikator') LIMIT 1);
SET @s := IF(@n > 0 AND @t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` RENAME INDEX `idx_BobotIndikator_terkunci` TO `BobotIndikator_terkunci_idx`'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @n := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('deleterequest') AND INDEX_NAME = 'idx_DeleteRequest_reviewedAt');
SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('deleterequest') LIMIT 1);
SET @s := IF(@n > 0 AND @t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` RENAME INDEX `idx_DeleteRequest_reviewedAt` TO `DeleteRequest_reviewedAt_idx`'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @n := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('deleterequest') AND INDEX_NAME = 'idx_DeleteRequest_status');
SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('deleterequest') LIMIT 1);
SET @s := IF(@n > 0 AND @t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` RENAME INDEX `idx_DeleteRequest_status` TO `DeleteRequest_status_idx`'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @n := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('deleterequest') AND INDEX_NAME = 'idx_DeleteRequest_submissionItemId');
SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('deleterequest') LIMIT 1);
SET @s := IF(@n > 0 AND @t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` RENAME INDEX `idx_DeleteRequest_submissionItemId` TO `DeleteRequest_submissionItemId_idx`'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @n := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('periodepenilaian') AND INDEX_NAME = 'idx_PeriodePenilaian_status');
SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('periodepenilaian') LIMIT 1);
SET @s := IF(@n > 0 AND @t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` RENAME INDEX `idx_PeriodePenilaian_status` TO `PeriodePenilaian_status_idx`'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @n := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('submissionitem') AND INDEX_NAME = 'idx_SubmissionItem_createdById');
SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('submissionitem') LIMIT 1);
SET @s := IF(@n > 0 AND @t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` RENAME INDEX `idx_SubmissionItem_createdById` TO `SubmissionItem_createdById_idx`'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @n := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('submissionitem') AND INDEX_NAME = 'idx_SubmissionItem_deletedAt');
SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('submissionitem') LIMIT 1);
SET @s := IF(@n > 0 AND @t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` RENAME INDEX `idx_SubmissionItem_deletedAt` TO `SubmissionItem_deletedAt_idx`'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @n := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('submissionitem') AND INDEX_NAME = 'idx_SubmissionItem_indikatorId_periodeId');
SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('submissionitem') LIMIT 1);
SET @s := IF(@n > 0 AND @t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` RENAME INDEX `idx_SubmissionItem_indikatorId_periodeId` TO `SubmissionItem_indikatorId_periodeId_idx`'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @n := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('submissionitem') AND INDEX_NAME = 'idx_SubmissionItem_madrasahId_periodeId');
SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('submissionitem') LIMIT 1);
SET @s := IF(@n > 0 AND @t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` RENAME INDEX `idx_SubmissionItem_madrasahId_periodeId` TO `SubmissionItem_madrasahId_periodeId_idx`'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @n := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('submissionitem') AND INDEX_NAME = 'idx_SubmissionItem_madrasahId_status');
SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('submissionitem') LIMIT 1);
SET @s := IF(@n > 0 AND @t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` RENAME INDEX `idx_SubmissionItem_madrasahId_status` TO `SubmissionItem_madrasahId_status_idx`'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @n := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('submissionitem') AND INDEX_NAME = 'idx_SubmissionItem_periodeId_status');
SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('submissionitem') LIMIT 1);
SET @s := IF(@n > 0 AND @t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` RENAME INDEX `idx_SubmissionItem_periodeId_status` TO `SubmissionItem_periodeId_status_idx`'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @n := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('submissionitem') AND INDEX_NAME = 'idx_SubmissionItem_status');
SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('submissionitem') LIMIT 1);
SET @s := IF(@n > 0 AND @t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` RENAME INDEX `idx_SubmissionItem_status` TO `SubmissionItem_status_idx`'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @n := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('validation') AND INDEX_NAME = 'idx_Validation_submissionItemId');
SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('validation') LIMIT 1);
SET @s := IF(@n > 0 AND @t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` RENAME INDEX `idx_Validation_submissionItemId` TO `Validation_submissionItemId_idx`'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @n := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('validation') AND INDEX_NAME = 'idx_Validation_validatorId');
SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('validation') LIMIT 1);
SET @s := IF(@n > 0 AND @t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` RENAME INDEX `idx_Validation_validatorId` TO `Validation_validatorId_idx`'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- Khusus `User.status`: DB dev punya index ini bernama `idx_User_status` karena
-- kolom+index-nya ditambahkan manual di luar migration. DB hasil `migrate deploy`
-- sudah memakai `User_status_idx` (dibuat migration add_user_status), jadi blok
-- ini hanya berefek di DB yang masih bernama lama.
SET @n := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('user') AND INDEX_NAME = 'idx_User_status');
SET @dup := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('user') AND INDEX_NAME = 'User_status_idx');
SET @t := (SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER('user') LIMIT 1);
SET @s := IF(@n > 0 AND @dup = 0 AND @t IS NOT NULL, CONCAT('ALTER TABLE `', @t, '` RENAME INDEX `idx_User_status` TO `User_status_idx`'), 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

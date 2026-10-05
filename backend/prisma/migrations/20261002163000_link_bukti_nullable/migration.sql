-- SubmissionItem.linkBukti jadi NULL-able.
--
-- Alasan: kontrak FIELD_RULES menyatakan linkBukti wajib pada mode 'submit',
-- tapi mode 'draft' sengaja tidak mewajibkannya (skenario QB-3 di
-- backend/tests/TESTING_GUIDE.md: "Draft boleh; submit ditolak"). Kolomnya
-- sendiri dibuat NOT NULL, jadi Prisma create() gagal 500 "Argument
-- `linkBukti` is missing." setiap kali operator menyimpan draft parsial —
-- fitur Simpan Draft praktis tidak bisa dipakai.
--
-- Yang TIDAK berubah: submit tetap mewajibkan linkBukti karena
-- validateItem() tetap memakai FIELD_RULES linkBukti: { required: true }.
-- Yang dilepas hanya batasan kolom, supaya draft bisa disimpan kosong.
--
-- MySQL tidak punya "ALTER COLUMN ... DROP NOT NULL"; yang bisa dilakukan
-- adalah MODIFY COLUMN dengan definisi baru. Setiap pernyataan dijaga
-- information_schema supaya idempoten di DB kosong maupun DB yang sudah
-- diubah manual.

-- 1) Normalkan string kosong -> NULL lebih dulu.
--    Kolom NOT NULL tidak bisa menerima NULL, jadi ini harus sebelum MODIFY.
--   String kosong tidak pernah valid: validateItem() menolak '' lewat
--    isEmpty check pada mode submit maupun draft.
SET @link_bukti_kosong := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'SubmissionItem' AND COLUMN_NAME = 'linkBukti'
);

SET @sql_kosong := IF(@link_bukti_kosong > 0,
  'UPDATE `SubmissionItem` SET `linkBukti` = NULL WHERE `linkBukti` = ''''',
  'SELECT 1');
PREPARE stmt_kosong FROM @sql_kosong;
EXECUTE stmt_kosong;
DEALLOCATE PREPARE stmt_kosong;

-- 2) Ubah kolom jadi NULL-able (tanpa mengubah tipe/length).
SET @link_bukti_nullable := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'SubmissionItem'
    AND COLUMN_NAME = 'linkBukti' AND IS_NULLABLE = 'YES'
);

SET @sql_nullable := IF(@link_bukti_kosong > 0 AND @link_bukti_nullable = 0,
  'ALTER TABLE `SubmissionItem` MODIFY COLUMN `linkBukti` VARCHAR(191) NULL',
  'SELECT 1');
PREPARE stmt_nullable FROM @sql_nullable;
EXECUTE stmt_nullable;
DEALLOCATE PREPARE stmt_nullable;

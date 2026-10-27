-- Empat kelompok untuk seluruh periode. Identitas dan kepemilikan tetap.
ALTER TABLE `Madrasah` MODIFY `jenjang` ENUM('RA', 'MI', 'MTs', 'MA') NOT NULL;

UPDATE `Madrasah`
SET `kelompok` = CAST(`jenjang` AS CHAR)
WHERE BINARY `kelompok` <> BINARY `jenjang`;

SET @kelompok_changed = ROW_COUNT();

-- Admin yang tersedia menjadi akun pencatat pemeliharaan, bukan aksi UI.
-- DB kosong tidak membutuhkan akun sistem baru maupun catatan migrasi data.
INSERT INTO `AuditLog` (`userId`, `action`, `entity`, `entityId`, `dataSebelum`, `dataSesudah`, `alasan`, `ipAddress`)
SELECT MIN(`id`), 'migrate_kelompok_jenjang', 'Madrasah', 'all',
  JSON_OBJECT('jumlahDiubah', @kelompok_changed),
  JSON_OBJECT('kelompok', JSON_ARRAY('RA', 'MI', 'MTs', 'MA'), 'source', 'prisma_migration'),
  'Pengelompokan seluruh periode berdasarkan jenjang; Negeri dan Swasta digabung.', 'maintenance'
FROM `User`
WHERE `role` = 'admin'
HAVING MIN(`id`) IS NOT NULL AND @kelompok_changed > 0;

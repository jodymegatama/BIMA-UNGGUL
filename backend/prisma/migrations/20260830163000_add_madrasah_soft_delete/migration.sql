-- Add soft delete (deletedAt) to Madrasah — nonaktif madrasah tanpa hapus submission
ALTER TABLE `Madrasah` ADD COLUMN `deletedAt` DATETIME(3) NULL;
CREATE INDEX `Madrasah_deletedAt_idx` ON `Madrasah`(`deletedAt`);
CREATE INDEX `Madrasah_kelompok_idx` ON `Madrasah`(`kelompok`);

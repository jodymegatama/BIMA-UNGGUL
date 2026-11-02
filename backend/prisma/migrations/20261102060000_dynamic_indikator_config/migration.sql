ALTER TABLE `Indikator`
 ADD COLUMN `deskripsi` TEXT NOT NULL,
 ADD COLUMN `short` VARCHAR(191) NOT NULL DEFAULT '',
 ADD COLUMN `urutan` INTEGER NOT NULL DEFAULT 0,
 ADD COLUMN `aktif` BOOLEAN NOT NULL DEFAULT true,
 ADD COLUMN `fields` JSON NULL,
 ADD COLUMN `revision` INTEGER NOT NULL DEFAULT 1;

ALTER TABLE `BobotIndikator`
 ADD COLUMN `nama` VARCHAR(191) NULL,
 ADD COLUMN `deskripsi` TEXT NULL,
 ADD COLUMN `short` VARCHAR(191) NULL,
 ADD COLUMN `urutan` INTEGER NOT NULL DEFAULT 0,
 ADD COLUMN `tipeFormula` ENUM('per_capaian','per_tingkat_wilayah','per_jenjang','persentase') NULL,
 ADD COLUMN `fields` JSON NULL,
 ADD COLUMN `menerimaInput` BOOLEAN NOT NULL DEFAULT false,
 ADD COLUMN `revision` INTEGER NOT NULL DEFAULT 1;

ALTER TABLE `BobotIndikator` DROP FOREIGN KEY `BobotIndikator_indikatorId_fkey`;
ALTER TABLE `SubmissionItem` DROP FOREIGN KEY `SubmissionItem_indikatorId_fkey`;
ALTER TABLE `BobotIndikator` ADD CONSTRAINT `BobotIndikator_indikatorId_fkey` FOREIGN KEY (`indikatorId`) REFERENCES `Indikator`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `SubmissionItem` ADD CONSTRAINT `SubmissionItem_indikatorId_fkey` FOREIGN KEY (`indikatorId`) REFERENCES `Indikator`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Indikator`
 ADD COLUMN `scoringConfig` JSON NULL,
 MODIFY `tipeFormula` ENUM('per_capaian','per_tingkat_wilayah','per_jenjang','persentase','per_jumlah','per_kategori') NOT NULL;
ALTER TABLE `BobotIndikator`
 ADD COLUMN `scoringConfig` JSON NULL,
 MODIFY `tipeFormula` ENUM('per_capaian','per_tingkat_wilayah','per_jenjang','persentase','per_jumlah','per_kategori') NULL;
ALTER TABLE `SubmissionItem` ADD COLUMN `customValues` JSON NULL;

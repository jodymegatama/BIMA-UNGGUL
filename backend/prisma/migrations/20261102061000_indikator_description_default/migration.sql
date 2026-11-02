-- VARCHAR permits an empty bootstrap default on MySQL versions that reject TEXT defaults.
ALTER TABLE `Indikator` MODIFY `deskripsi` VARCHAR(10000) NOT NULL DEFAULT '';

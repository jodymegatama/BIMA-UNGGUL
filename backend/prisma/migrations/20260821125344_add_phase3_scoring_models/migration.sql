-- AlterTable: Convert Madrasah string columns to ENUM
ALTER TABLE `Madrasah` MODIFY `jenjang` ENUM('MI', 'MTs', 'MA') NOT NULL;
ALTER TABLE `Madrasah` MODIFY `statusKepemilikan` ENUM('Negeri', 'Swasta') NOT NULL;

-- AlterTable: Add madrasahData JSON column to User table (temporary storage for pending operator approval)
ALTER TABLE `User` ADD COLUMN `madrasahData` JSON;

-- CreateTable: PeriodePenilaian
CREATE TABLE `PeriodePenilaian` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `namaPeriode` VARCHAR(191) NOT NULL,
    `tahunCapaian` INT NOT NULL,
    `tanggalMulai` DATETIME(3) NOT NULL,
    `tanggalCutoff` DATETIME(3) NOT NULL,
    `status` ENUM('belum_dimulai', 'aktif', 'cutoff', 'penyelesaian_validasi', 'finalisasi', 'arsip') NOT NULL DEFAULT 'belum_dimulai',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PeriodePenilaian_namaPeriode_key`(`namaPeriode`),
    INDEX `idx_PeriodePenilaian_status`(`status`),
    INDEX `idx_PeriodePenilaian_tanggalCutoff`(`tanggalCutoff`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: Indikator
CREATE TABLE `Indikator` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `kode` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `tipeFormula` ENUM('per_capaian', 'per_tingkat_wilayah', 'per_jenjang', 'persentase') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Indikator_kode_key`(`kode`),
    UNIQUE INDEX `Indikator_slug_key`(`slug`),
    INDEX `idx_Indikator_slug`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: BobotIndikator
CREATE TABLE `BobotIndikator` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `indikatorId` INT NOT NULL,
    `periodeId` INT NOT NULL,
    `nilaiBobot` DOUBLE,
    `bobotTingkatWilayah` JSON,
    `bobotJenjang` JSON,
    `terkunci` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BobotIndikator_indikatorId_periodeId_key`(`indikatorId`, `periodeId`),
    INDEX `idx_BobotIndikator_periodeId`(`periodeId`),
    INDEX `idx_BobotIndikator_terkunci`(`terkunci`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: SubmissionItem
CREATE TABLE `SubmissionItem` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `madrasahId` INT NOT NULL,
    `indikatorId` INT NOT NULL,
    `periodeId` INT NOT NULL,
    `createdById` INT NOT NULL,
    `namaKegiatan` VARCHAR(191),
    `institusi` VARCHAR(191),
    `namaPeserta` VARCHAR(191),
    `statusPegawai` ENUM('asn', 'non_asn'),
    `tingkatWilayah` ENUM('kabupaten', 'provinsi', 'nasional', 'internasional'),
    `jenjangPendidikan` ENUM('s1', 's2', 's3'),
    `jumlah` INT,
    `pembilang` INT,
    `penyebut` INT,
    `tahun` INT,
    `linkBukti` VARCHAR(191) NOT NULL,
    `catatan` LONGTEXT,
    `skorBaris` DOUBLE,
    `status` ENUM('draft', 'menunggu', 'disetujui', 'ditolak') NOT NULL DEFAULT 'draft',
    `alasanPenolakan` LONGTEXT,
    `deletedAt` DATETIME(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `idx_SubmissionItem_status`(`status`),
    INDEX `idx_SubmissionItem_periodeId_status`(`periodeId`, `status`),
    INDEX `idx_SubmissionItem_madrasahId_periodeId`(`madrasahId`, `periodeId`),
    INDEX `idx_SubmissionItem_madrasahId_status`(`madrasahId`, `status`),
    INDEX `idx_SubmissionItem_indikatorId_periodeId`(`indikatorId`, `periodeId`),
    INDEX `idx_SubmissionItem_createdById`(`createdById`),
    INDEX `idx_SubmissionItem_deletedAt`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: Validation
CREATE TABLE `Validation` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `submissionItemId` INT NOT NULL,
    `validatorId` INT NOT NULL,
    `aksi` ENUM('approve', 'reject', 'revoke') NOT NULL,
    `alasan` LONGTEXT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_Validation_submissionItemId`(`submissionItemId`),
    INDEX `idx_Validation_validatorId`(`validatorId`),
    INDEX `idx_Validation_aksi`(`aksi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: DeleteRequest
CREATE TABLE `DeleteRequest` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `submissionItemId` INT NOT NULL,
    `requestedById` INT NOT NULL,
    `status` ENUM('menunggu', 'disetujui', 'ditolak') NOT NULL DEFAULT 'menunggu',
    `alasan` LONGTEXT NOT NULL,
    `alasanAdmin` LONGTEXT,
    `reviewedById` INT,
    `reviewedAt` DATETIME(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_DeleteRequest_status`(`status`),
    INDEX `idx_DeleteRequest_submissionItemId`(`submissionItemId`),
    INDEX `idx_DeleteRequest_reviewedAt`(`reviewedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: AuditLog
CREATE TABLE `AuditLog` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `userId` INT NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `dataSebelum` JSON,
    `dataSesudah` JSON,
    `alasan` LONGTEXT,
    `ipAddress` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_AuditLog_userId`(`userId`),
    INDEX `idx_AuditLog_createdAt`(`createdAt`),
    INDEX `idx_AuditLog_action`(`action`),
    INDEX `idx_AuditLog_entity_entityId`(`entity`, `entityId`),
    INDEX `idx_AuditLog_userId_createdAt`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: BobotIndikator -> Indikator
ALTER TABLE `BobotIndikator` ADD CONSTRAINT `BobotIndikator_indikatorId_fkey` FOREIGN KEY (`indikatorId`) REFERENCES `Indikator`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: BobotIndikator -> PeriodePenilaian
ALTER TABLE `BobotIndikator` ADD CONSTRAINT `BobotIndikator_periodeId_fkey` FOREIGN KEY (`periodeId`) REFERENCES `PeriodePenilaian`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: SubmissionItem -> Madrasah
ALTER TABLE `SubmissionItem` ADD CONSTRAINT `SubmissionItem_madrasahId_fkey` FOREIGN KEY (`madrasahId`) REFERENCES `Madrasah`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: SubmissionItem -> Indikator
ALTER TABLE `SubmissionItem` ADD CONSTRAINT `SubmissionItem_indikatorId_fkey` FOREIGN KEY (`indikatorId`) REFERENCES `Indikator`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: SubmissionItem -> PeriodePenilaian
ALTER TABLE `SubmissionItem` ADD CONSTRAINT `SubmissionItem_periodeId_fkey` FOREIGN KEY (`periodeId`) REFERENCES `PeriodePenilaian`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: SubmissionItem -> User
ALTER TABLE `SubmissionItem` ADD CONSTRAINT `SubmissionItem_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Validation -> SubmissionItem
ALTER TABLE `Validation` ADD CONSTRAINT `Validation_submissionItemId_fkey` FOREIGN KEY (`submissionItemId`) REFERENCES `SubmissionItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Validation -> User
ALTER TABLE `Validation` ADD CONSTRAINT `Validation_validatorId_fkey` FOREIGN KEY (`validatorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: DeleteRequest -> SubmissionItem
ALTER TABLE `DeleteRequest` ADD CONSTRAINT `DeleteRequest_submissionItemId_fkey` FOREIGN KEY (`submissionItemId`) REFERENCES `SubmissionItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: DeleteRequest -> User (requestedBy)
ALTER TABLE `DeleteRequest` ADD CONSTRAINT `DeleteRequest_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: DeleteRequest -> User (reviewedBy)
ALTER TABLE `DeleteRequest` ADD CONSTRAINT `DeleteRequest_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: AuditLog -> User
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: MadrasahScore (cache table untuk skor per madrasah per periode)
CREATE TABLE `MadrasahScore` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `madrasahId` INT NOT NULL,
    `periodeId` INT NOT NULL,
    `totalScore` FLOAT NOT NULL,
    `lastRecalc` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `MadrasahScore_madrasahId_periodeId_key`(`madrasahId`, `periodeId`),
    INDEX `idx_MadrasahScore_periodeId_totalScore`(`periodeId`, `totalScore`),
    INDEX `idx_MadrasahScore_madrasahId`(`madrasahId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: MadrasahScore -> Madrasah
ALTER TABLE `MadrasahScore` ADD CONSTRAINT `MadrasahScore_madrasahId_fkey` FOREIGN KEY (`madrasahId`) REFERENCES `Madrasah`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: MadrasahScore -> PeriodePenilaian
ALTER TABLE `MadrasahScore` ADD CONSTRAINT `MadrasahScore_periodeId_fkey` FOREIGN KEY (`periodeId`) REFERENCES `PeriodePenilaian`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

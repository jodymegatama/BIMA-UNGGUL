-- AlterTable
ALTER TABLE `user` ADD COLUMN `madrasahId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Madrasah` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nomorMadrasah` VARCHAR(191) NOT NULL,
    `namaMadrasah` VARCHAR(191) NOT NULL,
    `jenjang` VARCHAR(191) NOT NULL,
    `statusKepemilikan` VARCHAR(191) NOT NULL,
    `jumlahSiswa` INTEGER NOT NULL,
    `alamat` TEXT NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `kelompok` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Madrasah_nomorMadrasah_key`(`nomorMadrasah`),
    UNIQUE INDEX `Madrasah_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `User_madrasahId_idx` ON `User`(`madrasahId`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_madrasahId_fkey` FOREIGN KEY (`madrasahId`) REFERENCES `Madrasah`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

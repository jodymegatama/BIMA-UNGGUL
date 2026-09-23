-- operator_email_login: Operator login via email, Admin tetap NIP
-- 1) Backfill: email sintetis <nip>@madrasah.local -> <nip>@operator.legacy.local (deterministik & unik)
UPDATE `User` SET email = CONCAT(nip, '@operator.legacy.local')
WHERE role = 'operator' AND nip IS NOT NULL AND email = CONCAT(nip, '@madrasah.local');

-- 2) nip jadi nullable (hanya Admin yang ber-NIP)
-- AlterTable
ALTER TABLE `User` MODIFY `nip` VARCHAR(191) NULL;

-- 3) NIP operator dimusnahkan (tidak dipakai lagi; identitas operator = email)
UPDATE `User` SET nip = NULL WHERE role = 'operator';

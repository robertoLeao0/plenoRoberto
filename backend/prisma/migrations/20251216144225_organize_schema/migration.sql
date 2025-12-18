-- AlterTable
ALTER TABLE `organizations` ADD COLUMN `managerId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `organizations` ADD CONSTRAINT `organizations_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

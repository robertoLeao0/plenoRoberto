/*
  Warnings:

  - You are about to drop the column `organizationId` on the `projects` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `projects` DROP FOREIGN KEY `projects_organizationId_fkey`;

-- AlterTable
ALTER TABLE `organizations` MODIFY `type` ENUM('CUSTOMER', 'PARTNER', 'INTERNAL', 'SYSTEM') NOT NULL DEFAULT 'CUSTOMER';

-- AlterTable
ALTER TABLE `projects` DROP COLUMN `organizationId`,
    MODIFY `totalDays` INTEGER NOT NULL DEFAULT 30;

-- CreateTable
CREATE TABLE `_OrganizationToProject` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_OrganizationToProject_AB_unique`(`A`, `B`),
    INDEX `_OrganizationToProject_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_OrganizationToProject` ADD CONSTRAINT `_OrganizationToProject_A_fkey` FOREIGN KEY (`A`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_OrganizationToProject` ADD CONSTRAINT `_OrganizationToProject_B_fkey` FOREIGN KEY (`B`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

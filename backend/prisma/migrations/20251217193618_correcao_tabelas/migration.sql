/*
  Warnings:

  - The values [SUCESSO,FALHA] on the enum `task_logs_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `content` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `deadline` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `sendAt` on the `tasks` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `tasks` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(4))` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `task_logs` MODIFY `status` ENUM('SUCCESS', 'FAILED', 'PENDING') NOT NULL;

-- AlterTable
ALTER TABLE `tasks` DROP COLUMN `content`,
    DROP COLUMN `deadline`,
    DROP COLUMN `sendAt`,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `endAt` DATETIME(3) NULL,
    ADD COLUMN `requireMedia` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `startAt` DATETIME(3) NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE `scheduled_messages` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `mediaUrl` VARCHAR(191) NULL,
    `targetType` VARCHAR(191) NOT NULL DEFAULT 'project',
    `targetValue` VARCHAR(191) NULL,
    `scheduledAt` DATETIME(3) NOT NULL,
    `repeatCron` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'scheduled',
    `lastResult` JSON NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_OrganizationToTask` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_OrganizationToTask_AB_unique`(`A`, `B`),
    INDEX `_OrganizationToTask_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_OrganizationToTask` ADD CONSTRAINT `_OrganizationToTask_A_fkey` FOREIGN KEY (`A`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_OrganizationToTask` ADD CONSTRAINT `_OrganizationToTask_B_fkey` FOREIGN KEY (`B`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

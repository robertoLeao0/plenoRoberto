/*
  Warnings:

  - A unique constraint covering the columns `[importToken]` on the table `organizations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `organizations` ADD COLUMN `importToken` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `organizations_importToken_key` ON `organizations`(`importToken`);

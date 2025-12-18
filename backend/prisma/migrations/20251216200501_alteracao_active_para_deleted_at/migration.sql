/*
  Warnings:

  - You are about to drop the column `active` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `projects` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `organizations` DROP COLUMN `active`,
    ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `projects` DROP COLUMN `isActive`,
    ADD COLUMN `deletedAt` DATETIME(3) NULL;

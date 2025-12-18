/*
  Warnings:

  - The values [SYSTEM] on the enum `organizations_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `organizations` MODIFY `type` ENUM('CUSTOMER', 'PARTNER', 'INTERNAL') NOT NULL DEFAULT 'CUSTOMER';

/*
  Warnings:

  - The values [CONCLUIDO] on the enum `action_logs_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `action_logs` MODIFY `status` ENUM('PENDENTE', 'EM_ANALISE', 'APROVADO', 'REJEITADO') NOT NULL DEFAULT 'PENDENTE';

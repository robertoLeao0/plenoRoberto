// src/modules/organizations/organizations.module.ts
import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsService, PrismaService],
  exports: [OrganizationsService], // Exportamos caso outro módulo precise usar
})
export class OrganizationsModule {}
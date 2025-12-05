import { Module } from '@nestjs/common';
import { MunicipalitiesService } from './municipalities.service';
import { MunicipalitiesController } from './municipalities.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [MunicipalitiesController],
  providers: [MunicipalitiesService, PrismaService],
  exports: [MunicipalitiesService],
})
export class MunicipalitiesModule {}

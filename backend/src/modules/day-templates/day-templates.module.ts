import { Module } from '@nestjs/common';
import { DayTemplatesService } from './day-templates.service';
import { DayTemplatesController } from './day-templates.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [DayTemplatesController],
  providers: [DayTemplatesService, PrismaService],
  exports: [DayTemplatesService],
})
export class DayTemplatesModule {}

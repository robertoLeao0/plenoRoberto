import { Module } from '@nestjs/common';
import { ActionLogsService } from './action-logs.service';
import { ActionLogsController } from './action-logs.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [ActionLogsController],
  providers: [ActionLogsService, PrismaService],
  exports: [ActionLogsService],
})
export class ActionLogsModule {}

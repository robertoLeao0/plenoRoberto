import { Module } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { RankingController } from './ranking.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [RankingController],
  providers: [RankingService, PrismaService],
})
export class RankingModule {}

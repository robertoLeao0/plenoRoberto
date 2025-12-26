import { Module } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { RankingController } from './ranking.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [RankingController], // Registra o Controller (as rotas)
  providers: [RankingService, PrismaService], // Registra o Service (a lógica)
})
export class RankingModule {}
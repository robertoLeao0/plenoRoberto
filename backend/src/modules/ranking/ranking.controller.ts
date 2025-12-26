import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';

@Controller('ranking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  // ==================================================================
  // 1. Ranking de Organizações (Soma dos pontos da equipe)
  // ==================================================================
  @Get('organizations')
  getOrganizationsRanking() {
    return this.rankingService.getOrganizationsRanking();
  }

  // ==================================================================
  // 2. Ranking de Usuários (Individual)
  // ==================================================================
  @Get('users')
  getUsersRanking(@Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.rankingService.getUsersRanking(limitNumber);
  }
}
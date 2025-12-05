import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('projects/:projectId/ranking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RankingController {
  constructor(private readonly service: RankingService) {}

  @Get()
  topTen(@CurrentUser() user: any, @Param('projectId') projectId: string) {
    return this.service.topTen(projectId, user.id);
  }

  @Roles(Role.GESTOR_MUNICIPIO, Role.ADMIN_PLENO)
  @Get('full')
  full(@Param('projectId') projectId: string, @Query('municipalityId') municipalityId?: string) {
    return this.service.fullRanking(projectId, municipalityId);
  }
}

import { Controller, Get, Header, Param, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('projects/:projectId/report')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('summary')
  summary(@Param('projectId') projectId: string) {
    return this.service.summary(projectId);
  }

  @Roles(Role.ADMIN_PLENO)
  @Get('export')
  @Header('Content-Type', 'text/csv')
  export(@Param('projectId') projectId: string) {
    return this.service.exportCsv(projectId);
  }
}

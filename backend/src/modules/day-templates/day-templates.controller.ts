import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { DayTemplatesService } from './day-templates.service';
import { CreateDayTemplateDto } from './dto/create-day-template.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('projects/:projectId/days')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DayTemplatesController {
  constructor(private readonly service: DayTemplatesService) {}

  @Roles(Role.ADMIN_PLENO)
  @Post()
  createBatch(@Param('projectId') projectId: string, @Body() templates: CreateDayTemplateDto[]) {
    return this.service.createBatch(projectId, templates);
  }

  @Get()
  findAll(@Param('projectId') projectId: string) {
    return this.service.findAll(projectId);
  }

  @Roles(Role.ADMIN_PLENO)
  @Patch(':dayNumber')
  update(
    @Param('projectId') projectId: string,
    @Param('dayNumber') dayNumber: string,
    @Body() dto: Partial<CreateDayTemplateDto>,
  ) {
    return this.service.update(projectId, Number(dayNumber), dto);
  }
}

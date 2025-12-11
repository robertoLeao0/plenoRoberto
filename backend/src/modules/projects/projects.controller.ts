import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Delete } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // AQUI: Mudamos para UserRole.ADMIN
  @Roles(UserRole.ADMIN) 
  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Get()
  findAll(@Query('organizationId') organizationId?: string, @Query('isActive') isActive?: string) {
    const filters: any = {};
    if (organizationId) filters.organizationId = organizationId;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    return this.projectsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
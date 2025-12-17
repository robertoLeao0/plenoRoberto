import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  UseGuards 
} from '@nestjs/common';
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

  @Roles(UserRole.ADMIN) 
  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  findAll(
    @Query('organizationId') organizationId?: string, 
    @Query('isActive') isActive?: string
  ) {
    const activeBoolean = isActive !== undefined ? isActive === 'true' : undefined;
    return this.projectsService.findAll({ 
      organizationId, 
      isActive: activeBoolean 
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  // Inativar (Soft Delete)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  // Reativar (Novo endpoint)
  @Roles(UserRole.ADMIN)
  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.projectsService.reactivate(id);
  }

  // Excluir Permanentemente (Novo endpoint)
  @Roles(UserRole.ADMIN)
  @Delete(':id/permanent')
  deletePermanent(@Param('id') id: string) {
    return this.projectsService.deletePermanent(id);
  }

  @Get(':id/tasks')
  getTasks(@Param('id') id: string) {
    return this.projectsService.findTasksByProject(id);
  }
}
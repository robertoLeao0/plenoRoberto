import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  UseGuards,
  Request 
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

  // ==================================================================
  // ROTAS DE CRIAÇÃO E LISTAGEM
  // ==================================================================

  @Roles(UserRole.ADMIN) 
  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  // Rota inteligente: Serve tanto para Admin quanto para Gestor
  @Get()
  findAll(
    @Request() req, // Pega o usuário logado (req.user)
    @Query('organizationId') organizationId?: string, 
    @Query('isActive') isActive?: string
  ) {
    const activeBoolean = isActive !== undefined ? isActive === 'true' : undefined;
    
    // Passamos o usuário + os filtros para o service
    return this.projectsService.findAll(req.user, { 
      organizationId, 
      isActive: activeBoolean 
    });
  }

  // ==================================================================
  // ROTAS DE DETALHES E GESTÃO DE EQUIPE (O QUE FALTAVA)
  // ==================================================================

  // 1. Detalhes do Projeto com Progresso da Equipe (Usado na tela de Detalhes)
  @Get(':id/team-progress')
  getTeamProgress(@Param('id') id: string) {
    return this.projectsService.findProjectTeamProgress(id);
  }

  // 2. Logs de um Usuário específico (Usado na tela de Validação)
  @Get(':id/users/:userId/logs')
  getUserLogs(@Param('id') projectId: string, @Param('userId') userId: string) {
    return this.projectsService.findUserLogsInProject(projectId, userId);
  }

  // 3. Avaliar (Aprovar/Rejeitar) uma atividade
  @Patch('logs/:logId/evaluate')
  evaluateLog(
    @Param('logId') logId: string, 
    @Body() body: { status: 'APROVADO' | 'REJEITADO', notes?: string }
  ) {
    return this.projectsService.evaluateLog(logId, body.status, body.notes);
  }

  // ==================================================================
  // ROTAS PADRÃO (CRUD)
  // ==================================================================

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.projectsService.reactivate(id);
  }

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
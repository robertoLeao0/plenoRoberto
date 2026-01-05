import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFiles, // Mudou de UploadedFile para UploadedFiles
  BadRequestException
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express'; // Mudou interceptor
import { diskStorage } from 'multer';
import * as fs from 'fs';
import { extname } from 'path';

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
  constructor(private readonly projectsService: ProjectsService) { }

  // ... (MANTENHA OS MÉTODOS CRUD, findAll, create, update, delete IGUAIS) ...
  // ... (Vou focar apenas na rota de UPLOAD que mudou) ...

  // ==================================================================
  // ROTAS GERAIS DE PROJETO (CRUD PADRÃO)
  // ==================================================================
  @Post()
  @Roles(UserRole.ADMIN, UserRole.GESTOR_ORGANIZACAO)
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  findAll(@Request() req, @Query() query) {
    const isActive = query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined;
    return this.projectsService.findAll(req.user, { ...query, isActive });
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.projectsService.findOne(id); }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.GESTOR_ORGANIZACAO)
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) { return this.projectsService.remove(id); }

  // ==================================================================
  // JORNADA DO USUÁRIO
  // ==================================================================

  @Get(':id/users/:userId/journey')
  getUserJourney(@Param('id') id: string, @Param('userId') userId: string) {
    return this.projectsService.getUserJourney(id, userId);
  }

  @Get(':id/users/:userId/tasks/:dayNumber/status')
  getTaskStatus(@Param('id') id: string, @Param('userId') userId: string, @Param('dayNumber') dayNumber: string) {
    return this.projectsService.getTaskStatusForUser(userId, id, +dayNumber);
  }

  // === ROTA DE ENVIO MÚLTIPLO (FOTOS E VÍDEOS) ===
  @Post(':projectId/tasks/complete')
  @UseInterceptors(FilesInterceptor('files', 10, { // Aceita até 10 arquivos no campo 'files'
    storage: diskStorage({
      destination: (req: any, file, cb) => {
        const userId = req.user.id;
        const uploadPath = `./uploads/${userId}/evidence`;
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `ev-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      // Aceita Imagens E Vídeos
      if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|mp4|webm|quicktime)$/)) {
        return cb(new BadRequestException('Apenas imagens (jpg, png) e vídeos (mp4, mov) são permitidos!'), false);
      }
      cb(null, true);
    }
  }))
  async completeTask(
    @Request() req,
    @Param('projectId') projectId: string,
    @Body() body: { dayNumber: string; notes?: string },
    @UploadedFiles() files: Array<Express.Multer.File> // Agora recebe um Array
  ) {
    const dayNum = parseInt(body.dayNumber, 10);

    // Gera lista de URLs
    let mediaUrlsString = null;

    if (files && files.length > 0) {
      const urls = files.map(f => `/uploads/${req.user.id}/evidence/${f.filename}`);
      // Salva como JSON String para caber no campo photoUrl do banco
      mediaUrlsString = JSON.stringify(urls);
    }

    return this.projectsService.submitActionLog(
      req.user.id,
      projectId,
      dayNum,
      mediaUrlsString, // Passa a string JSON
      body.notes
    );
  }

  // ==================================================================
  // ROTAS DO GESTOR
  // ==================================================================
  @Get(':id/team-progress')
  @Roles(UserRole.ADMIN, UserRole.GESTOR_ORGANIZACAO)
  getTeamProgress(@Param('id') id: string) { return this.projectsService.findProjectTeamProgress(id); }

  @Get(':id/users/:userId/logs')
  @Roles(UserRole.ADMIN, UserRole.GESTOR_ORGANIZACAO)
  getUserLogs(@Param('id') id: string, @Param('userId') userId: string) { return this.projectsService.findUserLogsInProject(id, userId); }

  @Patch('logs/:logId/evaluate')
  @Roles(UserRole.ADMIN, UserRole.GESTOR_ORGANIZACAO)
  evaluateLog(@Param('logId') logId: string, @Body() body: any) { return this.projectsService.evaluateLog(logId, body.status, body.notes); }



  @Get('logs/:logId')
  @Roles(UserRole.ADMIN, UserRole.GESTOR_ORGANIZACAO)
  getLogDetails(@Param('logId') logId: string) { return this.projectsService.findLogById(logId); }

  // LEGADO
  @Roles(UserRole.ADMIN)
  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string) { return this.projectsService.reactivate(id); }

  @Roles(UserRole.ADMIN)
  @Delete(':id/permanent')
  deletePermanent(@Param('id') id: string) { return this.projectsService.deletePermanent(id); }

  @Get(':id/tasks')
  getTasks(@Param('id') id: string) { return this.projectsService.findTasksByProject(id); }


  // Adicione ou verifique esta rota no seu ProjectsController
  @Get('tasks/:taskId')
  @Roles(UserRole.ADMIN, UserRole.GESTOR_ORGANIZACAO)
  async getTaskById(@Param('taskId') taskId: string) {
    // Certifique-se de que o service retorne: 
    // this.prisma.task.findUnique({ where: { id: taskId }, include: { checklist: true } })
    return this.projectsService.findTaskById(taskId);
  }

  @Patch('tasks/:taskId')
  @Roles(UserRole.ADMIN, UserRole.GESTOR_ORGANIZACAO)
  async updateTask(
    @Param('taskId') taskId: string,
    @Body() data: any
  ) {
    return this.projectsService.updateTask(taskId, data);
  }

  @Get(':id/ranking')
  @Roles(UserRole.ADMIN, UserRole.GESTOR_ORGANIZACAO, UserRole.USUARIO)
  async getProjectRanking(@Param('id') id: string) {
    return this.projectsService.getProjectRanking(id);
  }
}
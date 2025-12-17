import { Controller, Get, Post, Body, Param, Delete, Patch, Query, UseGuards, Request } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ActionStatus } from '@prisma/client';

// Ajuste este caminho conforme sua estrutura real (usei o mesmo do ProjectsController)
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'; 

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(createTaskDto);
  }

  // === NOVA ROTA: MINHAS TAREFAS (USUÁRIO) ===
  @Get('my-tasks')
  findMyTasks(@Request() req) {
    const user = req.user; 
    
    // Se o usuário não tiver organização, retorna lista vazia
    if (!user || !user.organizationId) {
        return [];
    }

    return this.taskService.findMyTasks(user.organizationId);
  }
  // ============================================

  @Get()
  findAll(@Query('projectId') projectId: string) {
    if (!projectId) return []; 
    return this.taskService.findAllByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.taskService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskService.remove(id);
  }

  // Rotas de Auditoria Legado
  @Get('audit/user/:userId/org/:orgId')
  getUserJornada(@Param('userId') userId: string, @Param('orgId') orgId: string) {
    return this.taskService.getUserJornada(userId, orgId);
  }

  @Patch('audit/:logId')
  evaluateAction(@Param('logId') logId: string, @Body() body: { status: ActionStatus, notes?: string }) {
    return this.taskService.evaluateAction(logId, body.status, body.notes);
  }
}
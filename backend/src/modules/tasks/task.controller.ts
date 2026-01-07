import { Controller, Get, Post, Body, Param, Delete, Patch, Query, UseGuards,BadRequestException, Request } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ActionStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) { }

  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(createTaskDto);
  }

  @Get('my-tasks')
  findMyTasks(@Request() req) {
    const user = req.user;

    // Se o token não tiver organização, retorna vazio por segurança
    if (!user || !user.organizationId) {
      return [];
    }

    return this.taskService.findMyTasks(user.organizationId);
  }

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

  @Get('audit/user/:userId/org/:orgId')
  getUserJornada(@Param('userId') userId: string, @Param('orgId') orgId: string) {
    return this.taskService.getUserJornada(userId, orgId);
  }

  @Patch('audit/:logId')
  async evaluateAction(
    @Param('logId') logId: string,
    @Body() body: { status: ActionStatus, notes?: string },
    @Request() req: any
  ) {
    const user = req.user;
    if (user.role !== 'ADMIN' && user.role !== 'GESTOR_ORGANIZACAO') {
      throw new BadRequestException('Você não tem permissão para avaliar tarefas.');
    }

    return this.taskService.evaluateAction(logId, body.status, body.notes);
  }

  @Get('admin/global-status')
async getGlobalStatus(@Request() req: any) {
  if (req.user.role !== 'ADMIN') {
    throw new BadRequestException('Acesso restrito ao administrador.');
  }
  return this.taskService.getGlobalStatus();
}
}
import { Controller, Get, Post, Body, Param, Delete, Patch, Query, UseGuards } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { ActionStatus } from '@prisma/client';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(createTaskDto);
  }

  @Get()
  findAll(@Query('projectId') projectId: string) {
    if (!projectId) {
      return []; 
    }
    return this.taskService.findAllByProject(projectId);
  }

  @Get('audit/user/:userId/org/:orgId')
  getUserJornada(@Param('userId') userId: string, @Param('orgId') orgId: string) {
    return this.taskService.getUserJornada(userId, orgId);
  }

  @Patch('audit/:logId')
  evaluateAction(
    @Param('logId') logId: string, 
    @Body() body: { status: ActionStatus, notes?: string }
  ) {
    return this.taskService.evaluateAction(logId, body.status, body.notes);
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
}
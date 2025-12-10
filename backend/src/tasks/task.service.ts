import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTaskDto) {
    return await this.prisma.task.create({
      data: {
        title: data.title,
        content: data.content,
        sendAt: new Date(data.sendAt),
        status: data.status || TaskStatus.AGENDADO, // Se não passar, cria como Agendado
        project: { connect: { id: data.projectId } },
      },
    });
  }

  // Busca todas as tarefas de um projeto específico
  async findAllByProject(projectId: string) {
    return await this.prisma.task.findMany({
      where: { projectId },
      orderBy: { sendAt: 'asc' },
      include: {
        logs: true, // Traz o histórico de envios junto (opcional)
      },
    });
  }

  async findOne(id: string) {
    return await this.prisma.task.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: any) {
    const { sendAt, ...rest } = data;
    return await this.prisma.task.update({
      where: { id },
      data: {
        ...rest,
        ...(sendAt ? { sendAt: new Date(sendAt) } : {}),
      },
    });
  }

  async remove(id: string) {
    return await this.prisma.task.delete({
      where: { id },
    });
  }
}
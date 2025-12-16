import { Injectable } from '@nestjs/common';
import { PrismaService } from './../database/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskStatus, ActionStatus } from '@prisma/client';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTaskDto) {
    return await this.prisma.task.create({
      data: {
        title: data.title,
        content: data.content,
        sendAt: new Date(data.sendAt),
        status: data.status || TaskStatus.AGENDADO,
        project: { connect: { id: data.projectId } },
      },
    });
  }

  async findAllByProject(projectId: string) {
    return await this.prisma.task.findMany({
      where: { projectId },
      orderBy: { sendAt: 'asc' },
      include: {
        logs: true,
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

  async getUserJornada(userId: string, organizationId: string) {
    const projects = await this.prisma.project.findMany({
      where: {
        organizationId: organizationId,
        subscribers: { some: { userId } } 
      },
      include: {
        dayTemplates: {
          orderBy: { dayNumber: 'asc' }
        }
      }
    });

    const result = await Promise.all(projects.map(async (proj) => {
      const logs = await this.prisma.actionLog.findMany({
        where: { userId, projectId: proj.id }
      });

      return {
        ...proj,
        timeline: proj.dayTemplates.map(day => {
          const userLog = logs.find(l => l.dayNumber === day.dayNumber);
          return {
            dayNumber: day.dayNumber,
            title: day.title,
            description: day.description,
            points: day.points,
            status: userLog ? userLog.status : 'PENDENTE',
            logId: userLog ? userLog.id : null,
            photoUrl: userLog ? userLog.photoUrl : null,
            notes: userLog ? userLog.notes : null,
            updatedAt: userLog ? userLog.updatedAt : null,
          };
        })
      };
    }));

    return result;
  }

  async evaluateAction(logId: string, status: ActionStatus, notes?: string) {
    const pointsToAward = status === 'APROVADO' ? 10 : 0;

    return this.prisma.actionLog.update({
      where: { id: logId },
      data: {
        status: status,
        notes: notes,
        pointsAwarded: pointsToAward,
        completedAt: status === 'APROVADO' ? new Date() : undefined
      }
    });
  }
}
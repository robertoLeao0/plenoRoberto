import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ActionStatus } from '@prisma/client';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTaskDto) {
    try {
      const { organizationIds = [], projectId, ...rest } = data;
      let orgsToConnect = [...organizationIds];

      // Herança automática de Organizações do Projeto
      if (projectId) {
        const project = await this.prisma.project.findUnique({
          where: { id: projectId },
          include: { organizations: true }
        });

        if (project && project.organizations.length > 0) {
          const projectOrgIds = project.organizations.map(org => org.id);
          orgsToConnect = [...new Set([...orgsToConnect, ...projectOrgIds])];
        }
      }

      const newTask = await this.prisma.task.create({
        data: {
          ...rest,
          projectId, 
          status: 'PENDING',
          startAt: data.startAt ? new Date(data.startAt) : undefined,
          endAt: data.endAt ? new Date(data.endAt) : undefined,
          organizations: {
            connect: orgsToConnect.map((id) => ({ id })),
          },
        },
        include: {
          organizations: true,
        },
      });

      return newTask;

    } catch (error: any) {
      throw new InternalServerErrorException(`Erro ao salvar tarefa: ${error.message}`);
    }
  }

  async findMyTasks(organizationId: string) {
    try {
      return await this.prisma.task.findMany({
        where: {
          isActive: true,
          project: {
            deletedAt: null
          },
          organizations: {
            some: {
              id: organizationId 
            }
          }
        },
        select: {
          id: true,
          title: true,
          description: true,
          startAt: true,
          endAt: true,
          requireMedia: true,
          status: true,
          project: {
            select: { name: true }
          }
        },
        orderBy: {
          startAt: 'asc'
        }
      });
    } catch (error) {
      return [];
    }
  }

  async findAllByProject(projectId: string) {
    return await this.prisma.task.findMany({
      where: { projectId },
      orderBy: { startAt: 'asc' },
      include: {
        organizations: {
          select: { id: true, name: true }
        },
      },
    });
  }

  async findOne(id: string) {
    return await this.prisma.task.findUnique({
      where: { id },
      include: { organizations: true, project: true },
    });
  }

  async update(id: string, data: any) {
    const { organizationIds, startAt, endAt, ...rest } = data;
    
    const dateUpdates: any = {};
    if (startAt) dateUpdates.startAt = new Date(startAt);
    if (endAt) dateUpdates.endAt = new Date(endAt);

    const orgUpdates = organizationIds 
      ? { set: organizationIds.map((orgId: string) => ({ id: orgId })) } 
      : undefined;

    return await this.prisma.task.update({
      where: { id },
      data: { ...rest, ...dateUpdates, organizations: orgUpdates },
      include: { organizations: true },
    });
  }

  async remove(id: string) {
    return await this.prisma.task.delete({ where: { id } });
  }

  async getUserJornada(userId: string, organizationId: string) {
    return []; 
  }

  async evaluateAction(logId: string, status: ActionStatus, notes?: string) {
    return this.prisma.actionLog.update({
      where: { id: logId },
      data: { 
        status, 
        notes, 
        completedAt: status === 'APROVADO' ? new Date() : undefined 
      }
    });
  }
}
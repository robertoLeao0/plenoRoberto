import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ActionStatus } from '@prisma/client';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: CreateTaskDto) {
    // Debug para ver se o DTO passou pela validação do NestJS
    console.log("📥 [BACKEND] DADOS RECEBIDOS:", JSON.stringify(data, null, 2));

    try {
      const { organizationIds = [], projectId, checklist = [], ...rest } = data;

      let orgsToConnect = [...organizationIds];

      // Busca organizações do projeto se nenhuma for enviada
      if (orgsToConnect.length === 0) {
        const project = await this.prisma.project.findUnique({
          where: { id: projectId },
          include: { organizations: true }
        });
        if (project && project.organizations.length > 0) {
          orgsToConnect = project.organizations.map(org => org.id);
        }
      }

      return await this.prisma.task.create({
        data: {
          ...rest,
          projectId,
          status: 'PENDING',
          startAt: new Date(data.startAt),
          endAt: new Date(data.endAt),
          organizations: {
            connect: orgsToConnect.map(id => ({ id })),
          },
          // 🚀 CRIAÇÃO DA CHECKLIST
          checklist: {
            create: checklist.map(itemText => ({
              text: itemText
            }))
          }
        },
        include: {
          organizations: true,
          checklist: true // Garante que o retorno contenha a checklist criada
        }
      });
    } catch (error: any) {
      console.error("❌ [BACKEND] ERRO AO PERSISTIR:", error);
      throw new BadRequestException(`Erro ao criar tarefa: ${error.message}`);
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
        include: {
          checklist: true,
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
    return this.prisma.task.findMany({
      where: { projectId },
      include: { organizations: true, checklist: true },
      orderBy: { createdAt: 'asc' }
    });
  }



  async findOne(id: string) {
    return await this.prisma.task.findUnique({
      where: { id },
      include: {
        organizations: true,
        project: true,
        checklist: true
      },
    });
  }

  async completeTask(userId: string, projectId: string, dayNumber: number, notes?: string, files?: any[]) {
    // ❌ REMOVA OU COMENTE ESTE BLOCO ABAIXO:
    /* if (task.requireMedia && (!files || files.length === 0)) {
      throw new BadRequestException('É obrigatório anexar ao menos uma foto ou vídeo.');
    } 
    */

    // ✅ MANTENHA A LÓGICA DE PONTUAÇÃO DINÂMICA:
    const pointsAwarded = (files && files.length > 0) ? 25 : 10;

    const log = await this.prisma.actionLog.upsert({
      where: {
        userId_projectId_dayNumber: { userId, projectId, dayNumber }
      },
      update: {
        status: 'EM_ANALISE',
        notes,
        // Se não houver arquivos, salva como null ou string vazia
        photoUrl: files && files.length > 0 ? JSON.stringify(files.map(f => f.path)) : null,
        pointsAwarded: pointsAwarded
      },
      create: {
        userId,
        projectId,
        dayNumber,
        status: 'EM_ANALISE',
        notes,
        photoUrl: files && files.length > 0 ? JSON.stringify(files.map(f => f.path)) : null,
        pointsAwarded: pointsAwarded
      }
    });

    // Atualiza o ranking com a pontuação merecida
    await this.prisma.rankingSummary.upsert({
      where: { userId_projectId: { userId, projectId } },
      update: { totalPoints: { increment: pointsAwarded }, completedDays: { increment: 1 } },
      create: { userId, projectId, totalPoints: pointsAwarded, completedDays: 1, completionRate: 0 }
    });

    return log;
  }


  async getUserJornada(projectId: string, userId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      include: {
        checklist: true,
        // No seu schema, o modelo Task tem uma relação implícita via ActionLog
        // Para isso funcionar, você deve garantir que a relação inversa existe no schema
        // Se o Prisma reclamar de 'actionLogs', use o findMany abaixo:
      },
      orderBy: { createdAt: 'asc' }
    });

    // Busca os logs separadamente para garantir compatibilidade
    const logs = await this.prisma.actionLog.findMany({
      where: { userId, projectId }
    });

    return tasks.map((task, index) => {
      const log = logs.find(l => l.dayNumber === (index + 1));
      return {
        dayNumber: index + 1,
        title: task.title,
        description: task.description,
        status: log ? log.status : 'PENDENTE',
        points: 10, // Pontuação base visual
        checklist: task.checklist
      };
    });
  }




  // No seu TaskService
  async update(id: string, data: any) {
    const { checklist, organizationIds, ...rest } = data;

    return await this.prisma.task.update({
      where: { id },
      data: {
        ...rest,
        startAt: data.startAt ? new Date(data.startAt) : undefined,
        endAt: data.endAt ? new Date(data.endAt) : undefined,

        organizations: organizationIds ? {
          set: organizationIds.map((orgId: string) => ({ id: orgId }))
        } : undefined,

        checklist: checklist ? {
          deleteMany: {},
          create: checklist.map((item: any) => ({
            text: typeof item === 'object' ? item.text : item
          }))
        } : undefined
      },
      include: {
        checklist: true,
        organizations: true
      }
    });
  }

  async remove(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      select: { projectId: true, title: true }
    });

    if (task) {
      const dayNumber = parseInt(task.title.replace(/\D/g, ''));

      if (!isNaN(dayNumber)) {
        await this.prisma.$transaction([
          this.prisma.dayTemplate.deleteMany({
            where: { projectId: task.projectId, dayNumber }
          }),
          this.prisma.actionLog.deleteMany({
            where: { projectId: task.projectId, dayNumber }
          })
        ]);
      }
    }
    return await this.prisma.task.delete({ where: { id } });
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
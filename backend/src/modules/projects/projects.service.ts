import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Prisma, DayCategory } from '@prisma/client';
import { UserRole } from '../../common/enums/role.enum';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) { }

  // ==================================================================
  // 1. CRUD PADRÃO
  // ==================================================================

  async create(createProjectDto: CreateProjectDto) {
    const { organizationIds, isActive, ...rest } = createProjectDto as any;
    return this.prisma.project.create({
      data: {
        ...rest,
        deletedAt: isActive === false ? new Date() : null,
        organizations: organizationIds?.length
          ? { connect: organizationIds.map((id: string) => ({ id })) }
          : undefined,
      },
      include: { organizations: true },
    });
  }

  async findAll(user: any, filters: { organizationId?: string; isActive?: boolean } = {}) {
    const where: Prisma.ProjectWhereInput = {
      deletedAt: filters.isActive !== false ? null : undefined,
    };

    if (user.role === UserRole.USUARIO || user.role === UserRole.GESTOR_ORGANIZACAO) {
      const orgId = user.organizationId || filters.organizationId;
      if (orgId) {
        where.organizations = { some: { id: orgId, deletedAt: null } };
      } else {
        return [];
      }
    } else if (user.role === UserRole.ADMIN) {
      if (filters.organizationId) {
        where.organizations = { some: { id: filters.organizationId } };
      }
    }

    const projects = await this.prisma.project.findMany({
      where,
      include: {
        organizations: { select: { id: true, name: true } },
        _count: { select: { tasks: true, subscribers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Mapeia para o frontend usar _count.dayTemplates como se fosse tasks
    return projects.map(p => ({
      ...p,
      _count: { ...p._count, dayTemplates: p._count.tasks }
    }));
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        organizations: true,
        tasks: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!project) throw new NotFoundException(`Projeto ${id} não encontrado.`);
    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    await this.findOne(id);
    const { isActive, organizationIds, ...rest } = updateProjectDto as any;

    const dataToUpdate: any = { ...rest };
    if (isActive !== undefined) dataToUpdate.deletedAt = isActive ? null : new Date();

    const organizationsUpdate = organizationIds
      ? { set: organizationIds.map((orgId: string) => ({ id: orgId })) }
      : undefined;

    return this.prisma.project.update({
      where: { id },
      data: { ...dataToUpdate, organizations: organizationsUpdate },
      include: { organizations: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async reactivate(id: string) {
    await this.findOne(id);
    return this.prisma.project.update({ where: { id }, data: { deletedAt: null } });
  }

  async deletePermanent(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }
  // 1. Método que busca UMA tarefa específica com checklist (para o lápis de editar)
  async findTaskById(taskId: string) {
    return await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        checklist: true,      // 🚀 OBRIGATÓRIO: Sem isso a modal abre vazia
        organizations: true
      }
    });
  }

  // 2. Garanta que a listagem geral também traga o checklist
  async findTasksByProject(projectId: string) {
    return await this.prisma.task.findMany({
      where: { projectId },
      orderBy: { startAt: 'asc' },
      include: {
        checklist: true,      // 🚀 OBRIGATÓRIO para a listagem do admin
        organizations: true
      }
    });
  }

  async updateTask(taskId: string, data: any) {
  const { checklist, organizationIds, ...rest } = data;

  return await this.prisma.task.update({
    where: { id: taskId },
    data: {
      ...rest,
      // Garante a conversão correta de datas para o Prisma
      startAt: data.startAt ? new Date(data.startAt) : undefined,
      endAt: data.endAt ? new Date(data.endAt) : undefined,

      // Atualiza o vínculo com as organizações
      organizations: organizationIds ? {
        set: organizationIds.map((orgId: string) => ({ id: orgId }))
      } : undefined,

      // 🚀 SOLUÇÃO DO CHECKLIST: Deleta os antigos e cria os novos enviados
      checklist: checklist ? {
        deleteMany: {}, // Limpa o que existia antes para essa tarefa
        create: checklist.map((text: string) => ({ text })) // Cria os novos textos
      } : undefined
    },
    include: {
      checklist: true,
      organizations: true
    }
  });
}

  // ==================================================================
  // 2. GESTÃO E PROGRESSO DA EQUIPE
  // ==================================================================

  async findProjectTeamProgress(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organizations: {
          include: {
            users: {
              orderBy: { name: 'asc' },
              include: {
                actionLogs: {
                  where: { projectId: projectId },
                  select: { status: true }
                }
              }
            }
          }
        },
        _count: { select: { tasks: true } }
      }
    });

    if (!project) throw new NotFoundException('Projeto não encontrado');

    const totalProjectTasks = project._count.tasks || 0;
    const allMembers = project.organizations.flatMap(org => org.users);
    const uniqueMembersMap = new Map();

    allMembers.forEach(user => {
      if (!uniqueMembersMap.has(user.id)) {
        const logs = user.actionLogs || [];
        const pendingValidation = logs.filter(log => log.status === 'EM_ANALISE').length;
        const approved = logs.filter(log => log.status === 'APROVADO').length;

        let statusRealizacao = 'NAO_REALIZADO';
        if (pendingValidation > 0) statusRealizacao = 'PENDENTE_VALIDACAO';
        else if (approved > 0 && approved < totalProjectTasks) statusRealizacao = 'EM_ANDAMENTO';
        else if (approved >= totalProjectTasks && totalProjectTasks > 0) statusRealizacao = 'COMPLETA';

        uniqueMembersMap.set(user.id, {
          id: user.id,
          name: user.name,
          email: user.email,
          cpf: user.cpf || 'Não informado',
          avatarUrl: user.avatarUrl,
          phone: user.phone,
          pendingCount: pendingValidation,
          approvedCount: approved,
          totalTasks: totalProjectTasks,
          statusLabel: statusRealizacao
        });
      }
    });

    return {
      project: { id: project.id, name: project.name, status: 'active' },
      members: Array.from(uniqueMembersMap.values())
    };
  }

  // ==================================================================
  // 3. VALIDAÇÃO DE TAREFAS
  // ==================================================================

  async findUserLogsInProject(projectId: string, userId: string) {
    return this.prisma.actionLog.findMany({
      where: { projectId, userId, status: { in: ['EM_ANALISE', 'APROVADO', 'REJEITADO'] } },
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findLogById(logId: string) {
    const log = await this.prisma.actionLog.findUnique({
      where: { id: logId },
      include: { project: { select: { name: true } }, user: { select: { name: true, avatarUrl: true } } }
    });
    if (!log) throw new NotFoundException('Tarefa não encontrada.');
    return log;
  }

  async evaluateLog(logId: string, status: 'APROVADO' | 'REJEITADO', notes?: string) {
    const log = await this.prisma.actionLog.findUnique({ where: { id: logId } });
    if (!log) throw new NotFoundException('Registro não encontrado.');

    let points = log.pointsAwarded;

    // --- CORREÇÃO AUTOMÁTICA DE PONTOS ---
    // Verifica se existe foto/vídeo no registro
    const hasMedia = log.photoUrl && log.photoUrl !== '[]' && log.photoUrl.length > 5;

    if (status === 'APROVADO') {
      if (hasMedia) {
        // Se tem foto, GARANTE que seja 25 pontos (corrige envios antigos de 10)
        points = 25;
      } else {
        // Se NÃO tem foto, busca o valor padrão do template (geralmente 10)
        const template = await this.prisma.dayTemplate.findUnique({
          where: { projectId_dayNumber: { projectId: log.projectId, dayNumber: log.dayNumber } }
        });
        points = template?.points || 10;
      }
    } else if (status === 'REJEITADO') {
      points = 0;
    }

    return this.prisma.actionLog.update({
      where: { id: logId },
      data: {
        status,
        notes,
        pointsAwarded: points,
        completedAt: status === 'APROVADO' ? new Date() : null
      }
    });
  }

  // ==================================================================
  // 4. JORNADA DO USUÁRIO (SYNC EM TEMPO REAL)
  // ==================================================================

  async getUserJourney(projectId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, avatarUrl: true }
    });


    // 1. SINCRONIZAÇÃO EM TEMPO REAL
    let realTasks = [];
    try {
      realTasks = await this.prisma.task.findMany({
        where: { projectId },
        orderBy: { startAt: 'asc' }
      });

      await this.prisma.dayTemplate.deleteMany({ where: { projectId } });

      if (realTasks.length > 0) {
        const mirrorData = realTasks.map((task, index) => {
          // CORREÇÃO: Corta texto para o espelho, mas no detalhe pegamos o completo
          const rawDesc = task.description || `Atividade: ${task.title}`;
          const safeDesc = rawDesc.length > 190 ? rawDesc.substring(0, 187) + '...' : rawDesc;

          return {
            projectId,
            dayNumber: index + 1,
            title: task.title || 'Sem título',
            description: safeDesc,
            category: 'MENTE' as any,
            points: 10,
            requiresPhoto: true
          };
        });

        await this.prisma.dayTemplate.createMany({ data: mirrorData });
      }
    } catch (error) {
      console.error('[SYNC ERROR] Falha ao sincronizar tarefas:', error);
    }

    // 2. Busca os templates
    const templates = await this.prisma.dayTemplate.findMany({
      where: { projectId },
      orderBy: { dayNumber: 'asc' }
    });

    // 3. Busca Logs
    const logs = await this.prisma.actionLog.findMany({
      where: { projectId, userId }
    });

    // 4. Monta a resposta
    const journey = templates.map((template, index) => {
      const log = logs.find(l => l.dayNumber === template.dayNumber);
      const originalTask = realTasks[index];
      const taskDate = originalTask?.startAt || originalTask?.createdAt || new Date();

      return {
        dayNumber: template.dayNumber,
        title: template.title,
        description: template.description,
        points: template.points,
        status: log ? log.status : 'NAO_INICIADO',
        logId: log ? log.id : null,
        completedAt: log ? log.completedAt : null,
        notes: log ? log.notes : null,
        date: taskDate.toISOString()
      };
    });

    return { user, journey };
  }

  // 5. Status Individual (Envio) - AGORA COM TEXTO COMPLETO
  async getTaskStatusForUser(userId: string, projectId: string, dayNumber: number) {
    // A. Buscamos a TAREFA ORIGINAL incluindo a Checklist
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      orderBy: { startAt: 'asc' },
      include: {
        checklist: {
          select: {
            id: true,
            text: true
          }
        }
      }
    });

    const originalTask = tasks[dayNumber - 1];


    let template = await this.prisma.dayTemplate.findUnique({
      where: { projectId_dayNumber: { projectId, dayNumber } }
    });


    if (!template) {
      if (!originalTask) throw new NotFoundException('Dia não encontrado neste projeto.');

      const rawDesc = originalTask.description || '';
      const safeDesc = rawDesc.length > 190 ? rawDesc.substring(0, 187) + '...' : rawDesc;

      template = {
        projectId,
        dayNumber,
        title: originalTask.title,
        description: safeDesc,
        points: 10,
        requiresPhoto: true,
        category: 'MENTE' as any,
        id: 'temp-fallback'
      } as any;
    }


    const log = await this.prisma.actionLog.findUnique({
      where: { userId_projectId_dayNumber: { userId, projectId, dayNumber } }
    });

    return {
      dayNumber: template.dayNumber,
      title: template.title,
      description: originalTask?.description || template.description,
      requiresPhoto: template.requiresPhoto,
      points: template.points,
      status: log ? log.status : 'NAO_INICIADO',
      logId: log ? log.id : undefined,
      photoUrl: log ? log.photoUrl : undefined,
      notes: log ? log.notes : undefined,

      checklist: originalTask?.checklist || []
    };
  }

  async getUserProjectStats(projectId: string, userId: string) {
    const stats = await this.prisma.rankingSummary.findUnique({
      where: {
        userId_projectId: { userId, projectId }
      }
    });

    return {
      totalPoints: stats?.totalPoints || 0,
      completedDays: stats?.completedDays || 0,
      completionRate: stats?.completionRate || 0
    };
  }

  // ==================================================================
  // 6. Envio de Tarefa (LÓGICA MULTIMÍDIA)
  // ==================================================================
  async submitActionLog(userId: string, projectId: string, dayNumber: number, mediaData: string | null, notes?: string) {
    // 1. Busca a tarefa ATUAL para sincronizar Título e Descrição
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      orderBy: { startAt: 'asc' }
    });
    const currentTask = tasks[dayNumber - 1];
    if (!currentTask) throw new NotFoundException('Tarefa não encontrada.');

    // 2. Atualiza ou Cria o Template (Resolve o problema do nome antigo voltando)
    await this.prisma.dayTemplate.upsert({
      where: { projectId_dayNumber: { projectId, dayNumber } },
      update: {
        title: currentTask.title,
        description: currentTask.description || '',
      },
      create: {
        projectId,
        dayNumber,
        title: currentTask.title,
        description: currentTask.description || '',
        category: 'MENTE',
        points: 10,
        requiresPhoto: false
      }
    });

    // 3. Lógica de Status e Pontuação
    const hasMedia = mediaData && mediaData !== 'null' && mediaData !== '[]';
    const finalStatus = hasMedia ? 'EM_ANALISE' : 'APROVADO'; // Checklist = Aprovado na hora
    const pointsToAward = hasMedia ? 25 : 10;

    // 4. Salva o Log de Ação
    const log = await this.prisma.actionLog.upsert({
      where: { userId_projectId_dayNumber: { userId, projectId, dayNumber } },
      update: {
        status: finalStatus as any,
        photoUrl: mediaData,
        notes,
        pointsAwarded: pointsToAward,
        completedAt: new Date()
      },
      create: {
        userId,
        projectId,
        dayNumber,
        status: finalStatus as any,
        photoUrl: mediaData,
        notes,
        pointsAwarded: pointsToAward,
        completedAt: new Date()
      }
    });

    // 5. Soma pontos no Ranking apenas se for APROVADO (checklist)
    if (finalStatus === 'APROVADO') {
      await this.prisma.rankingSummary.upsert({
        where: { userId_projectId: { userId, projectId } },
        update: { totalPoints: { increment: pointsToAward }, completedDays: { increment: 1 } },
        create: { userId, projectId, totalPoints: pointsToAward, completedDays: 1, completionRate: 0 }
      });
    }

    return log;
  }
}
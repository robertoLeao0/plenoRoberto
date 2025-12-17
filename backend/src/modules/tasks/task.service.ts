import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ActionStatus } from '@prisma/client';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================
  // CRIAR TAREFA
  // =========================================================
  async create(data: CreateTaskDto) {
    try {
      console.log("=== [DEBUG] TENTANDO CRIAR TAREFA ===");
      console.log("Dados:", JSON.stringify(data, null, 2));

      const { organizationIds, ...rest } = data;

      const newTask = await this.prisma.task.create({
        data: {
          ...rest,
          status: 'PENDING', 
          
          // Garante que as datas sejam objetos Date
          startAt: new Date(data.startAt),
          endAt: new Date(data.endAt),

          // Conecta as organizações (Many-to-Many)
          organizations: {
            connect: organizationIds.map((id) => ({ id })),
          },
        },
        include: {
          organizations: true,
        },
      });

      console.log("=== [DEBUG] TAREFA CRIADA COM SUCESSO! ID:", newTask.id);
      return newTask;

    } catch (error: any) {
      console.error("=== [ERRO] FALHA AO CRIAR TAREFA ===");
      console.error(error);
      throw new InternalServerErrorException(`Erro ao salvar tarefa: ${error.message}`);
    }
  }

  // =========================================================
  // MINHAS TAREFAS (COM DEBUG PARA DESCOBRIR O ERRO)
  // =========================================================
  async findMyTasks(organizationId: string) {
    console.log(`=== [DEBUG] Buscando tarefas para a Organização ID: ${organizationId} ===`);

    try {
      // Busca tarefas ativas vinculadas à organização do usuário
      const tasks = await this.prisma.task.findMany({
        where: {
          isActive: true, 
          project: {
            deletedAt: null // O Projeto deve estar ativo
          },
          // FILTRO IMPORTANTE:
          // A tarefa precisa ter sido atribuída para a organização do usuário
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
          startAt: 'asc' // Mais antigas primeiro
        }
      });

      console.log(`=== [DEBUG] Encontradas ${tasks.length} tarefas para este usuário.`);
      return tasks;

    } catch (error) {
      console.error("Erro ao buscar minhas tarefas:", error);
      return [];
    }
  }

  // =========================================================
  // LISTAR POR PROJETO (USADO NO PAINEL ADMIN)
  // =========================================================
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

  // =========================================================
  // BUSCAR UMA TAREFA ESPECÍFICA
  // =========================================================
  async findOne(id: string) {
    return await this.prisma.task.findUnique({
      where: { id },
      include: { organizations: true },
    });
  }

  // =========================================================
  // ATUALIZAR TAREFA
  // =========================================================
  async update(id: string, data: any) {
    const { organizationIds, startAt, endAt, ...rest } = data;
    
    // Tratamento de Datas
    const dateUpdates: any = {};
    if (startAt) dateUpdates.startAt = new Date(startAt);
    if (endAt) dateUpdates.endAt = new Date(endAt);

    // Tratamento de Organizações (Substitui as antigas pelas novas)
    const orgUpdates = organizationIds 
      ? { set: organizationIds.map((orgId: string) => ({ id: orgId })) } 
      : undefined;

    return await this.prisma.task.update({
      where: { id },
      data: { ...rest, ...dateUpdates, organizations: orgUpdates },
      include: { organizations: true },
    });
  }

  // =========================================================
  // REMOVER TAREFA
  // =========================================================
  async remove(id: string) {
    return await this.prisma.task.delete({ where: { id } });
  }

  // =========================================================
  // MÉTODOS LEGADOS / AUDITORIA (MANTIDOS PARA COMPATIBILIDADE)
  // =========================================================
  async getUserJornada(userId: string, organizationId: string) {
    // Mantendo a lógica caso você use essa rota antiga em outro lugar
    const projects = await this.prisma.project.findMany({
      where: {
        organizations: { some: { id: organizationId } },
        subscribers: { some: { userId } } 
      },
      include: { dayTemplates: { orderBy: { dayNumber: 'asc' } } }
    });
    return []; // Retorno simplificado conforme seu snippet anterior
  }

  async evaluateAction(logId: string, status: ActionStatus, notes?: string) {
    return this.prisma.actionLog.update({
      where: { id: logId },
      data: { status, notes, completedAt: status === 'APROVADO' ? new Date() : undefined }
    });
  }
}
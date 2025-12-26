import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Prisma, ActionStatus } from '@prisma/client'; // Adicionado ActionStatus
import { UserRole } from '../../common/enums/role.enum'; 

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================================================================
  // CRIAR PROJETO
  // ==================================================================
  async create(createProjectDto: CreateProjectDto) {
    const { organizationIds, isActive, ...rest } = createProjectDto as any;

    return this.prisma.project.create({
      data: {
        ...rest,
        deletedAt: isActive === false ? new Date() : null,
        organizations: organizationIds?.length
          ? {
              connect: organizationIds.map((id: string) => ({ id })),
            }
          : undefined,
      },
      include: {
        organizations: true,
      },
    });
  }

  // ==================================================================
  // LISTAR TODOS (Com filtros de segurança)
  // ==================================================================
  async findAll(user: any, filters: { organizationId?: string; isActive?: boolean } = {}) {
    const where: Prisma.ProjectWhereInput = {};

    // 1. Filtro por STATUS
    if (filters.isActive === true) {
      where.deletedAt = null;
    } else if (filters.isActive === false) {
      where.deletedAt = { not: null };
    }

    // 2. Segurança por CARGO
    if (user.role === UserRole.GESTOR_ORGANIZACAO) {
      if (user.organizationId) {
        where.organizations = {
          some: { id: user.organizationId }
        };
      } else {
        return []; // Gestor sem organização não vê nada
      }
    } 
    else if (user.role === UserRole.ADMIN) {
      if (filters.organizationId) {
        where.organizations = {
          some: { id: filters.organizationId }
        };
      }
    }

    return this.prisma.project.findMany({
      where,
      include: {
        organizations: {
          select: { id: true, name: true },
        },
        _count: {
          select: { tasks: true, subscribers: true }, // Subscribers são os membros inscritos via ManyChat/Integração
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ==================================================================
  // BUSCAR UM
  // ==================================================================
  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        organizations: true,
        tasks: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Projeto com ID ${id} não encontrado.`);
    }

    return project;
  }

  // ==================================================================
  // BUSCAR DETALHES E STATUS REAL DE VALIDAÇÃO (CORRIGIDO)
  // ==================================================================
  async findProjectTeamProgress(projectId: string) {
    // 1. Busca o projeto, as organizações e os usuários com seus logs
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organizations: {
          include: {
            users: {
              orderBy: { name: 'asc' },
              include: {
                // Trazemos os logs de ação (tarefas realizadas) filtradas por este projeto
                actionLogs: {
                  where: { projectId: projectId },
                  select: { status: true } // Só precisamos do status para contar
                }
              }
            }
          }
        },
        // Usamos dayTemplates para contar o total de atividades esperadas na jornada
        // Se preferir contar 'tasks', troque por select: { tasks: true }
        _count: {
          select: { dayTemplates: true } 
        }
      }
    });
  
    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    // Define o total de tarefas/dias do projeto
    const totalProjectTasks = project._count.dayTemplates || 0;

    // 2. Achata a lista de usuários das organizações
    const allMembers = project.organizations.flatMap(org => org.users);
    
    // Remove duplicatas (caso usuário esteja em 2 orgs do mesmo projeto) usando Map
    const uniqueMembersMap = new Map();
    
    allMembers.forEach(user => {
      if (!uniqueMembersMap.has(user.id)) {
        
        // --- LÓGICA REAL DE CONTAGEM ---
        const logs = user.actionLogs || [];
        
        // Quantas o gestor precisa aprovar?
        const pendingValidation = logs.filter(log => log.status === 'EM_ANALISE').length;
        
        // Quantas já foram aprovadas?
        const approved = logs.filter(log => log.status === 'APROVADO').length;

        // Define o Status "Macro" para exibir na tabela do frontend
        let statusRealizacao = 'NAO_REALIZADO';
        
        if (pendingValidation > 0) {
            statusRealizacao = 'PENDENTE_VALIDACAO';
        } else if (approved > 0 && approved < totalProjectTasks) {
            statusRealizacao = 'EM_ANDAMENTO';
        } else if (approved >= totalProjectTasks && totalProjectTasks > 0) {
            statusRealizacao = 'COMPLETA';
        }

        uniqueMembersMap.set(user.id, {
          id: user.id,
          name: user.name,
          email: user.email,
          cpf: user.cpf || 'Não informado', // Retorna o CPF
          avatarUrl: user.avatarUrl,
          phone: user.phone,
          
          // Dados calculados
          pendingCount: pendingValidation,
          approvedCount: approved,
          totalTasks: totalProjectTasks,
          statusLabel: statusRealizacao
        });
      }
    });
  
    return {
      project: {
        id: project.id,
        name: project.name,
        status: 'active',
      },
      members: Array.from(uniqueMembersMap.values())
    };
  }

  // ==================================================================
  // ATUALIZAR
  // ==================================================================
  async update(id: string, updateProjectDto: UpdateProjectDto) {
    await this.findOne(id);

    const { isActive, organizationIds, ...rest } = updateProjectDto as any;
    const dataToUpdate: any = { ...rest };

    if (isActive !== undefined) {
      dataToUpdate.deletedAt = isActive ? null : new Date();
    }

    const organizationsUpdate = organizationIds
      ? { set: organizationIds.map((orgId: string) => ({ id: orgId })) }
      : undefined;

    return this.prisma.project.update({
      where: { id },
      data: {
        ...dataToUpdate,
        organizations: organizationsUpdate,
      },
      include: {
        organizations: true,
      },
    });
  }

  // ==================================================================
  // INATIVAR (Soft Delete)
  // ==================================================================
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.project.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  // ==================================================================
  // REATIVAR
  // ==================================================================
  async reactivate(id: string) {
    await this.findOne(id);
    return this.prisma.project.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  // ==================================================================
  // EXCLUIR PERMANENTEMENTE
  // ==================================================================
  async deletePermanent(id: string) {
    return this.prisma.project.delete({
      where: { id },
    });
  }

  // ==================================================================
  // TAREFAS
  // ==================================================================
  async findTasksByProject(projectId: string) {
    return this.prisma.task.findMany({
      where: { projectId },
      orderBy: [
        { createdAt: 'asc' } 
      ], 
    });
  }

// ==================================================================
  // VALIDAÇÃO: 1. BUSCAR LOGS DE UM USUÁRIO NO PROJETO
  // ==================================================================
  async findUserLogsInProject(projectId: string, userId: string) {
    return this.prisma.actionLog.findMany({
      where: {
        projectId,
        userId,
        status: { in: ['EM_ANALISE', 'APROVADO', 'REJEITADO'] } // Traz tudo para histórico
      },
      include: {
        // Traz o DayTemplate para sabermos o título da tarefa (ex: "Dia 1")
        // Nota: Ajuste a relação se estiver usando Task em vez de DayTemplate
        project: { select: { name: true } } 
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // ==================================================================
  // VALIDAÇÃO: 2. APROVAR OU REJEITAR (AVALIAR)
  // ==================================================================
  async evaluateLog(logId: string, status: 'APROVADO' | 'REJEITADO', notes?: string) {
    const log = await this.prisma.actionLog.findUnique({ where: { id: logId } });
    if (!log) throw new NotFoundException('Registro de atividade não encontrado.');

    // Se aprovado, confirma os pontos (assumindo 1 ponto ou pegando do template)
    const points = status === 'APROVADO' ? 10 : 0; // Exemplo: 10 pontos por aprovação

    return this.prisma.actionLog.update({
      where: { id: logId },
      data: {
        status,
        notes, // Motivo da rejeição ou elogio
        pointsAwarded: points,
        completedAt: new Date() // Data da validação
      }
    });
  }

}


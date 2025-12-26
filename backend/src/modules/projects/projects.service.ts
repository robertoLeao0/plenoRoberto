import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Prisma } from '@prisma/client';
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
  // LISTAR TODOS (Limpo)
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
          select: { tasks: true, subscribers: true }, // Subscribers são os membros
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
        // Ajuste aqui conforme seus relacionamentos reais, se tiver dayTemplates
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
  // NOVO: BUSCAR DETALHES E PROGRESSO DA EQUIPE
  // ==================================================================
  async findProjectTeamProgress(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        // No seu schema novo, members são 'subscribers' ou via Organization?
        // Vou assumir que você pega os usuários da Organização vinculada ao projeto
        // OU se tiver um campo direto members no projeto.
        // Dado o schema da Organização, os usuários estão na Org.
        organizations: {
            include: {
                users: true 
            }
        },
        _count: {
          select: { tasks: true }
        }
      }
    });
  
    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    // Lógica para extrair os membros (já que o projeto pode ter várias organizações)
    // Aqui pegamos todos os usuários de todas as organizações vinculadas a esse projeto
    const allMembers = project.organizations.flatMap(org => org.users);

    // Remove duplicatas (caso um user esteja em 2 orgs do mesmo projeto)
    const uniqueMembers = [...new Map(allMembers.map(item => [item.id, item])).values()];
  
    const membersWithProgress = uniqueMembers.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      avatarUrl: member.avatarUrl,
      phone: member.phone,
      tasksCompleted: 0, // Implementar contagem real depois via TaskLog
      totalTasks: project._count.tasks,
      status: 'PENDENTE'
    }));
  
    return {
      project: {
        id: project.id,
        name: project.name,
        // deadline: project.deadline, // Se tiver deadline no model
        status: 'active', // Ou pegar do deletedAt
      },
      members: membersWithProgress
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
}
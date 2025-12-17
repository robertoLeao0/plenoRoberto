import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Prisma } from '@prisma/client';

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
        // Define deletedAt baseado no isActive
        deletedAt: isActive === false ? new Date() : null,
        
        // Vínculo Many-to-Many
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
  // LISTAR TODOS (Com Filtros)
  // ==================================================================
  async findAll(filters: { organizationId?: string; isActive?: boolean } = {}) {
    const where: Prisma.ProjectWhereInput = {};

    // Filtro Ativo/Inativo
    if (filters.isActive === true) {
      where.deletedAt = null;
    } else if (filters.isActive === false) {
      where.deletedAt = { not: null };
    }
    // IMPORTANTE: Se isActive for undefined, NÃO adiciona filtro de deletedAt
    // Assim, retorna tudo para o admin filtrar no front

    // Filtro Organização
    if (filters.organizationId) {
      where.organizations = {
        some: {
          id: filters.organizationId,
        },
      };
    }

    return this.prisma.project.findMany({
      where,
      include: {
        organizations: {
          select: { id: true, name: true },
        },
        _count: {
          select: { tasks: true, subscribers: true },
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
        dayTemplates: {
          orderBy: { dayNumber: 'asc' },
        },
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
  // REATIVAR (Novo)
  // ==================================================================
  async reactivate(id: string) {
    await this.findOne(id);
    return this.prisma.project.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  // ==================================================================
  // EXCLUIR PERMANENTEMENTE (Novo)
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
        { sendAt: 'asc' }, 
        { createdAt: 'asc' }
      ], 
    });
  }
}
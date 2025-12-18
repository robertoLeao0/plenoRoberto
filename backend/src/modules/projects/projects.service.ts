import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================================================================
  // CRIAR PROJETO
  // ==================================================================
  async create(createProjectDto: CreateProjectDto) {
    // Extraímos organizationIds se você estiver enviando IDs para vincular
    // e removemos isActive se ele ainda existir no DTO para não quebrar o Prisma
    const { organizationIds, isActive, ...rest } = createProjectDto as any;

    return this.prisma.project.create({
      data: {
        ...rest,
        // Ao criar, deletedAt é null (ativo) por padrão.
        
        // Se houver IDs de organizações, fazemos o vínculo (Many-to-Many)
        organizations: organizationIds
          ? {
              connect: organizationIds.map((id: string) => ({ id })),
            }
          : undefined,
      },
      include: {
        organizations: true, // Retorna as orgs vinculadas
      },
    });
  }

  // ==================================================================
  // LISTAR TODOS (Apenas os ATIVOS)
  // ==================================================================
  async findAll() {
    return this.prisma.project.findMany({
      where: {
        deletedAt: null, // Filtra apenas projetos que NÃO foram deletados
      },
      include: {
        organizations: {
          select: { name: true }, // Traz apenas o nome das orgs para não pesar
        },
        _count: {
          select: { tasks: true, subscribers: true }, // Contagem de tarefas e inscritos
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ==================================================================
  // BUSCAR UM POR ID
  // ==================================================================
  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        organizations: true,
        dayTemplates: {
          orderBy: { dayNumber: 'asc' }, // Ordena os dias (Dia 1, Dia 2...)
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Projeto com ID ${id} não encontrado.`);
    }

    // Opcional: Se quiser impedir ver deletados, descomente abaixo:
    // if (project.deletedAt) throw new NotFoundException('Projeto excluído.');

    return project;
  }

  // ==================================================================
  // ATUALIZAR PROJETO
  // ==================================================================
  async update(id: string, updateProjectDto: UpdateProjectDto) {
    // 1. Verificamos se o projeto existe
    await this.findOne(id);

    // 2. Tratamento de Compatibilidade (isActive -> deletedAt)
    // O "as any" é para o TypeScript não reclamar se o DTO não tiver deletedAt tipado ainda
    const { isActive, organizationIds, ...rest } = updateProjectDto as any;
    
    const dataToUpdate: any = { ...rest };

    // Se o frontend mandou "isActive", convertemos para a lógica de Soft Delete
    if (isActive !== undefined) {
      // isActive = true  -> deletedAt = null
      // isActive = false -> deletedAt = AGORA
      dataToUpdate.deletedAt = isActive ? null : new Date();
    }

    // Se mandou lista de organizações, atualizamos os vínculos
    // "set" substitui todas as anteriores pelas novas
    const organizationsUpdate = organizationIds
      ? { set: organizationIds.map((orgId: string) => ({ id: orgId })) }
      : undefined;

    return this.prisma.project.update({
      where: { id },
      data: {
        ...dataToUpdate,
        organizations: organizationsUpdate,
      },
    });
  }

  // ==================================================================
  // REMOVER (SOFT DELETE)
  // ==================================================================
  async remove(id: string) {
    await this.findOne(id);

    // Não deletamos o registro, apenas marcamos a data de exclusão
    return this.prisma.project.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  // ==================================================================
  // EXTRAS: Buscar Tarefas do Projeto (Correção do seu erro)
  // ==================================================================
  async findTasksByProject(projectId: string) {
    return this.prisma.task.findMany({
      where: {
        projectId,
        status: { not: 'CANCELADO' }, // Exemplo: não trazer canceladas
      },
      // CORREÇÃO DO ERRO 2353: Trocamos 'dataPrevista' por 'sendAt'
      orderBy: {
        sendAt: 'asc', 
      },
    });
  }
}
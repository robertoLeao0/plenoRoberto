import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================================================================
  // 1. LISTAR (Com filtro por Status: 'active' | 'inactive')
  // ==================================================================
  async findAll(status: 'active' | 'inactive' = 'active') {
    // Se status for 'active', busca onde deletedAt é NULL
    // Se status for 'inactive', busca onde deletedAt NÃO é NULL
    const whereClause = status === 'active' 
      ? { deletedAt: null } 
      : { deletedAt: { not: null } };

    return this.prisma.organization.findMany({
      where: whereClause,
      include: {
        _count: { select: { users: true, projects: true } }, // Conta membros e projetos
        manager: {
          select: { name: true, avatarUrl: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  // ==================================================================
  // 2. DETALHES DA ORGANIZAÇÃO
  // ==================================================================
  async findOne(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        manager: true,
        users: {
          orderBy: { name: 'asc' },
          select: {
            id: true, name: true, email: true, role: true, phone: true, avatarUrl: true
          }
        },
      },
    });

    if (!organization) throw new NotFoundException('Organização não encontrada');
    return organization;
  }

  // ==================================================================
  // 3. CRIAR
  // ==================================================================
  async create(data: any) {
    // deletedAt já nasce null (ativo) por padrão no banco
    return this.prisma.organization.create({ data });
  }

  // ==================================================================
  // 4. ATUALIZAR DADOS
  // ==================================================================
  async update(id: string, data: any) {
    await this.findOne(id); // Garante que existe
    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }

  // ==================================================================
  // 5. INATIVAR (Soft Delete)
  // ==================================================================
  async softDelete(id: string) {
    await this.findOne(id);
    return this.prisma.organization.update({
      where: { id },
      data: { deletedAt: new Date() }, // Marca data de hoje
    });
  }

  // ==================================================================
  // 6. REATIVAR
  // ==================================================================
  async reactivate(id: string) {
    // Aqui usamos findFirst porque findUnique normal pode filtrar deletados se configurado globalmente
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('Organização não encontrada');

    return this.prisma.organization.update({
      where: { id },
      data: { deletedAt: null }, // Volta a ser ativo
    });
  }

  // ==================================================================
  // 7. EXCLUIR PERMANENTEMENTE (Hard Delete)
  // ==================================================================
  async hardDelete(id: string) {
    // CUIDADO: Isso vai falhar se tiver constraints (usuários/projetos vinculados)
    // O ideal é limpar os vínculos antes ou usar CASCADE no banco.
    return this.prisma.organization.delete({
      where: { id },
    });
  }

  // ==================================================================
  // GESTÃO DE PESSOAS (Membros e Gestores)
  // ==================================================================

  async addMember(organizationId: string, email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    if (!user) throw new NotFoundException('E-mail não encontrado no sistema.');
    if (user.organizationId === organizationId) throw new BadRequestException('Usuário já pertence a esta organização.');

    return this.prisma.user.update({
      where: { id: user.id },
      data: { organizationId },
    });
  }

  async defineManager(organizationId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    // Define o gestor na organização
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { managerId: userId }
    });

    // Atualiza cargo do usuário se não for admin
    if (user.role !== 'ADMIN') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { role: 'GESTOR_ORGANIZACAO' }
      });
    }

    return { message: 'Gestor definido com sucesso' };
  }

  async removeMember(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { 
        organizationId: null, 
        role: 'USUARIO' 
      },
    });
  }
}
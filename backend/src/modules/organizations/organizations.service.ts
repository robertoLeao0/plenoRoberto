import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================================================================
  // 1. LISTAR (Com filtro por Status: 'active' | 'inactive')
  // ==================================================================
  async findAll(status: 'active' | 'inactive' = 'active') {
    const whereClause = status === 'active' 
      ? { deletedAt: null } 
      : { deletedAt: { not: null } };

    return this.prisma.organization.findMany({
      where: whereClause,
      include: {
        _count: { select: { users: true, projects: true } }, 
        manager: {
          select: { name: true, avatarUrl: true, email: true },
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
    // Se já vier com managerId, precisamos promover esse usuário
    const org = await this.prisma.organization.create({ data });

    if (data.managerId) {
      await this.prisma.user.update({
        where: { id: data.managerId },
        data: { role: 'GESTOR_ORGANIZACAO', organizationId: org.id }
      });
    }

    return org;
  }

  // ==================================================================
  // 4. ATUALIZAR (COM TROCA INTELIGENTE DE GESTOR)
  // ==================================================================
  async update(id: string, data: any) {
    // 1. Busca a organização atual para saber quem é o gestor HOJE
    const currentOrg = await this.prisma.organization.findUnique({ where: { id } });
    if (!currentOrg) throw new NotFoundException('Organização não encontrada.');

    // 2. Verifica se houve mudança de gestor
    if (data.managerId && data.managerId !== currentOrg.managerId) {
      
      // A) REBAIXA O GESTOR ANTIGO (Se existir um)
      // Ele perde o acesso aos projetos e vira usuário comum
      if (currentOrg.managerId) {
        await this.prisma.user.update({
          where: { id: currentOrg.managerId },
          data: {
            organizationId: null, 
            role: 'USUARIO'
          }
        });
      }

      // B) PROMOVE O NOVO GESTOR
      // Ele ganha acesso aos projetos desta organização
      const newManager = await this.prisma.user.findUnique({ where: { id: data.managerId } });
      if (!newManager) throw new NotFoundException('Novo usuário gestor não encontrado.');

      await this.prisma.user.update({
        where: { id: data.managerId },
        data: {
          organizationId: id,
          role: 'GESTOR_ORGANIZACAO'
        }
      });
    }

    // 3. Atualiza os dados da organização
    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }

  // ==================================================================
  // 5. GERAR TOKEN DE IMPORTAÇÃO
  // ==================================================================
  async generateToken(id: string) {
    const token = uuidv4().split('-')[0].toUpperCase(); 

    return this.prisma.organization.update({
      where: { id },
      data: { importToken: token },
    });
  }

  // ==================================================================
  // 6. INATIVAR (Soft Delete)
  // ==================================================================
  async softDelete(id: string) {
    await this.findOne(id); // Garante que existe
    return this.prisma.organization.update({
      where: { id },
      data: { deletedAt: new Date() }, 
    });
  }

  // ==================================================================
  // 7. REATIVAR
  // ==================================================================
  async reactivate(id: string) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('Organização não encontrada');

    return this.prisma.organization.update({
      where: { id },
      data: { deletedAt: null }, 
    });
  }

  // ==================================================================
  // 8. EXCLUIR PERMANENTEMENTE (Hard Delete)
  // ==================================================================
  async hardDelete(id: string) {
    // Nota: Isso pode falhar se houver constraints no banco (usuários vinculados)
    return this.prisma.organization.delete({
      where: { id },
    });
  }

  // ==================================================================
  // EXTRAS: GERENCIAMENTO DE MEMBROS (Útil para a tela 'Equipe')
  // ==================================================================

  async addMember(organizationId: string, email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    if (!user) throw new NotFoundException('E-mail não encontrado.');
    if (user.organizationId === organizationId) throw new BadRequestException('Usuário já está na organização.');

    return this.prisma.user.update({
      where: { id: user.id },
      data: { organizationId },
    });
  }

  async removeMember(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { 
        organizationId: null, 
        role: 'USUARIO' // Reseta cargo se for removido
      },
    });
  }
}
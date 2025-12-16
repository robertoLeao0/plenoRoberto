import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. LISTAR (Com filtro Ativo/Inativo)
  async findAll(active?: boolean) {
    const whereClause = active !== undefined ? { active } : {};

    return this.prisma.organization.findMany({
      where: whereClause,
      include: {
        _count: { select: { users: true } }, // Conta membros (relação "users")
        manager: {                           // Traz o Gestor (relação "manager")
          select: { name: true, avatarUrl: true } 
        } 
      },
      orderBy: { name: 'asc' },
    });
  }

  // 2. DETALHES DA ORGANIZAÇÃO
  async findOne(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        manager: true, // Inclui dados do gestor
        users: {       // Inclui lista de membros
          orderBy: { name: 'asc' },
          select: {
            id: true, name: true, email: true, role: true, phone: true, avatarUrl: true
          }
        }
      },
    });

    if (!organization) throw new NotFoundException('Organização não encontrada');
    return organization;
  }

  // 3. CRIAR
  async create(data: any) {
    return this.prisma.organization.create({ data });
  }

  // 4. ATUALIZAR (Dados ou Status Ativo/Inativo)
  async update(id: string, data: any) {
    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }

  // === MÉTODOS DE GESTÃO DE PESSOAS ===

  // 5. ADICIONAR MEMBRO (Vincula User -> Organization)
  async addMember(organizationId: string, email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      throw new NotFoundException('E-mail não encontrado no sistema.');
    }

    if (user.organizationId === organizationId) {
      throw new BadRequestException('Usuário já pertence a esta organização.');
    }

    // Atualiza o usuário colocando o ID da organização nele
    return this.prisma.user.update({
      where: { id: user.id },
      data: { organizationId },
    });
  }

  // 6. DEFINIR GESTOR
  async defineManager(organizationId: string, userId: string) {
    // Passo A: Garantir que o usuário existe e faz parte da organização
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    // Passo B: Atualizar a Organização para apontar este managerId
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { managerId: userId }
    });

    // Passo C: Atualizar o Cargo do usuário para GESTOR_ORGANIZACAO (caso não seja Admin)
    if (user.role !== 'ADMIN') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { role: 'GESTOR_ORGANIZACAO' }
      });
    }

    return { message: 'Gestor definido com sucesso' };
  }

  // 7. REMOVER MEMBRO
  async removeMember(userId: string) {
    // Remove o vínculo da organização e volta o cargo para USUARIO
    return this.prisma.user.update({
      where: { id: userId },
      data: { 
        organizationId: null, 
        role: 'USUARIO' 
      },
    });
  }
}
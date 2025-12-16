import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { Role } from '@prisma/client';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  // === 1. CRIAR ORGANIZAÇÃO ===
  async create(data: CreateOrganizationDto) {
    return this.prisma.organization.create({
      data: {
        name: data.name,
        cnpj: data.cnpj,
        description: data.description,
        location: data.location,
        type: data.type || 'CUSTOMER',
        active: true,
        managerId: data.managerId || null, 
      },
    });
  }

  // === 2. LISTAR (COM FILTRO DE PERMISSÃO) ===
  async findAll(currentUser: any) {
    const includeConfig = {
      manager: { select: { id: true, name: true, email: true } },
      _count: { select: { users: true, projects: true } },
    };

    // A. Se for ADMIN, vê tudo
    if (currentUser.role === Role.ADMIN) {
      return this.prisma.organization.findMany({
        orderBy: { createdAt: 'desc' },
        include: includeConfig,
      });
    }

    // B. Se for GESTOR ou USUARIO, vê apenas a sua própria organização
    if (!currentUser.organizationId) {
      return []; // Se não tiver org vinculada, retorna vazio
    }

    return this.prisma.organization.findMany({
      where: {
        id: currentUser.organizationId,
      },
      include: includeConfig,
    });
  }

  // === 3. DETALHES (COM STATUS DA TAREFA DE HOJE) ===
  async findOne(id: string) {
    // Definir intervalo de HOJE para buscar os logs
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        // Traz dados do Gestor
        manager: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        },
        // Traz Usuários com Telefone e Log de Hoje
        users: {
          orderBy: { name: 'asc' },
          select: { 
            id: true, 
            name: true, 
            email: true, 
            role: true, 
            avatarUrl: true, 
            phone: true,
            // Busca se existe um ActionLog criado hoje para este usuário
            actionLogs: {
              where: {
                createdAt: { gte: startOfDay, lte: endOfDay }
              },
              select: { status: true, pointsAwarded: true },
              take: 1
            }
          }
        }
      }
    });

    if (!organization) return null;

    // Processa os usuários para facilitar o uso no Frontend
    // Transforma o array 'actionLogs' em campos simples 'todayStatus' e 'todayPoints'
    const formattedUsers = organization.users.map(user => {
      const dailyLog = user.actionLogs[0]; // Pega o primeiro log (se houver)

      return {
        ...user,
        todayStatus: dailyLog ? dailyLog.status : 'NAO_REALIZADO',
        todayPoints: dailyLog ? dailyLog.pointsAwarded : 0,
        actionLogs: undefined // Remove o array bruto para limpar o retorno
      };
    });

    return {
      ...organization,
      users: formattedUsers
    };
  }
}
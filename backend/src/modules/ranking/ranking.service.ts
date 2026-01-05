import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '../../common/enums/role.enum';

@Injectable()
export class RankingService {
  constructor(private prisma: PrismaService) {}

  // ==================================================================
  // 1. Ranking de Usuários (Individual) - Apenas ATIVOS
  // ==================================================================
  async getUsersRanking(limit = 10) {
    const ranking = await this.prisma.user.findMany({
      where: { 
        role: UserRole.USUARIO,
        deletedAt: null // CORREÇÃO: Apenas usuários ativos
      }, 
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        actionLogs: {
          where: { status: 'APROVADO' },
          select: { pointsAwarded: true }
        },
        organization: { 
          select: { 
            name: true,
            deletedAt: true // Buscamos para validar se a org ainda existe
          } 
        }
      }
    });

    const processed = ranking
      .filter(user => user.organization?.deletedAt === null) // Filtra usuários de orgs ativas
      .map(user => {
        const totalPoints = user.actionLogs.reduce((sum, log) => sum + (log.pointsAwarded || 0), 0);

        return {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
          organizationName: user.organization?.name || 'Sem Org.',
          totalPoints: totalPoints
        };
      });

    return processed.sort((a, b) => b.totalPoints - a.totalPoints).slice(0, limit);
  }

  // ==================================================================
  // 2. Ranking de Organizações (Soma dos times) - Apenas ATIVAS
  // ==================================================================
  async getOrganizationsRanking() {
    const orgs = await this.prisma.organization.findMany({
      where: { 
        deletedAt: null // CORREÇÃO: Apenas organizações ativas no ranking
      },
      include: {
        users: {
          where: { 
            role: UserRole.USUARIO,
            deletedAt: null // CORREÇÃO: Ignora pontos de usuários deletados
          }, 
          include: {
            actionLogs: {
              where: { status: 'APROVADO' },
              select: { pointsAwarded: true }
            }
          }
        }
      }
    });

    const ranking = orgs.map(org => {
      const totalPoints = org.users.reduce((accUsers, user) => {
        const userPoints = user.actionLogs.reduce((accLogs, log) => accLogs + (log.pointsAwarded || 0), 0);
        return accUsers + userPoints;
      }, 0);

      const userCount = org.users.length || 1;
      const averagePoints = Math.round(totalPoints / userCount);

      return {
        id: org.id,
        name: org.name,
        totalPoints,
        averagePoints,
        usersCount: org.users.length
      };
    });

    return ranking.sort((a, b) => b.totalPoints - a.totalPoints);
  }
}
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '../../common/enums/role.enum'; 

@Injectable()
export class RankingService {
  constructor(private prisma: PrismaService) {}

  // ==================================================================
  // 1. Ranking de Usuários (Individual)
  // ==================================================================
  async getUsersRanking(limit = 10) {
    const ranking = await this.prisma.user.findMany({
      // CORREÇÃO: Usamos UserRole.USUARIO conforme sua definição
      where: { role: UserRole.USUARIO }, 
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        // Seleciona logs aprovados para somar
        actionLogs: {
            where: { status: 'APROVADO' },
            select: { pointsAwarded: true }
        },
        // Seleciona nome da organização
        organization: { select: { name: true } }
      }
    });

    // Processamento dos dados
    const processed = ranking.map(user => {
        // Cálculo seguro dos pontos
        const totalPoints = user.actionLogs.reduce((sum, log) => sum + (log.pointsAwarded || 0), 0);

        return {
            id: user.id,
            name: user.name,
            avatarUrl: user.avatarUrl,
            // Uso do ?. para evitar erro se o usuário estiver sem organização
            organizationName: user.organization?.name || 'Sem Org.',
            totalPoints: totalPoints
        };
    });

    // Ordena do maior para o menor e pega o top X
    return processed.sort((a, b) => b.totalPoints - a.totalPoints).slice(0, limit);
  }

  // ==================================================================
  // 2. Ranking de Organizações (Soma dos times)
  // ==================================================================
  async getOrganizationsRanking() {
    const orgs = await this.prisma.organization.findMany({
      include: {
        users: {
          // Filtra apenas usuários comuns (ignorando admins/gestores)
          where: { role: UserRole.USUARIO }, 
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
      // Soma pontos de todos os usuários daquela organização
      const totalPoints = org.users.reduce((accUsers, user) => {
        const userPoints = user.actionLogs.reduce((accLogs, log) => accLogs + (log.pointsAwarded || 0), 0);
        return accUsers + userPoints;
      }, 0);

      // Média (Opcional, útil para comparar empresas de tamanhos diferentes)
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

    // Retorna ordenado por Pontos Totais (Decrescente)
    return ranking.sort((a, b) => b.totalPoints - a.totalPoints);
  }
}
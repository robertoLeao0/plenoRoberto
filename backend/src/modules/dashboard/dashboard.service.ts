import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getAdminStats() {
    // Executa as contagens filtrando apenas os registros que NÃO foram excluídos (deletedAt: null)
    const [totalUsers, totalOrganizations, totalProjects] = await Promise.all([
      // Conta usuários ativos
      this.prisma.user.count({
        where: { deletedAt: null },
      }),

      // Conta organizações ativas
      this.prisma.organization.count({
        where: { deletedAt: null },
      }),

      // Conta projetos ativos
      this.prisma.project.count({
        where: { deletedAt: null },
      }),
    ]);

    return {
      users: totalUsers,
      organizations: totalOrganizations,
      projects: totalProjects,
    };
  }
}
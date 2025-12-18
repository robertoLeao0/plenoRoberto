import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getAdminStats() {
    // Executa as 3 contagens ao mesmo tempo para ser rápido
    const [totalUsers, totalOrganizations, totalProjects] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.organization.count(),
      this.prisma.project.count(), // Se ainda não tiver a tabela Project, remova essa linha
    ]);

    return {
      users: totalUsers,
      organizations: totalOrganizations,
      projects: totalProjects,
    };
  }
}
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async summary(projectId: string) {
    const participants = await this.prisma.actionLog.groupBy({
      by: ['userId'],
      where: { projectId },
    });

    const completedAll = await this.prisma.rankingSummary.count({
      where: { projectId, completionRate: 100 },
    });

    return {
      participants: participants.length,
      completedAll,
    };
  }

  async exportCsv(projectId: string) {
    const rows = await this.prisma.rankingSummary.findMany({ where: { projectId }, include: { user: true } });
    const header = 'Nome,Email,Pontos,Concluidos,Taxa%\n';
    const body = rows
      .map((r) => `${r.user.name},${r.user.email},${r.totalPoints},${r.completedDays},${r.completionRate}`)
      .join('\n');
    return header + body;
  }
}

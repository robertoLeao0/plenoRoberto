import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActionStatus } from '../../common/enums/action-status.enum';

@Injectable()
export class RankingService {
  constructor(private prisma: PrismaService) {}

  async topTen(projectId: string, userId: string) {
    const leaderboard = await this.computeLeaderboard(projectId);
    const top10 = leaderboard.slice(0, 10);
    const position = leaderboard.findIndex((r) => r.userId === userId) + 1;
    return { top10, position: position || null };
  }

  async fullRanking(projectId: string, municipalityId?: string) {
    const leaderboard = await this.computeLeaderboard(projectId, municipalityId);
    return leaderboard;
  }

  private async computeLeaderboard(projectId: string, municipalityId?: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    const totalDays = project?.totalDays ?? 21;

    const logs = await this.prisma.actionLog.findMany({
      where: { projectId, status: ActionStatus.CONCLUIDO, ...(municipalityId ? { user: { municipalityId } } : {}) },
      include: { user: true },
    });

    const grouped = new Map<string, { userId: string; user: { id: string; name: string }; totalPoints: number; completedDays: number }>();

    logs.forEach((log) => {
      const existing =
        grouped.get(log.userId) ??
        { userId: log.userId, user: { id: log.userId, name: log.user.name }, totalPoints: 0, completedDays: 0 };
      existing.totalPoints += log.points;
      existing.completedDays += 1;
      grouped.set(log.userId, existing);
    });

    const leaderboard = Array.from(grouped.values())
      .map((entry) => ({
        ...entry,
        completionRate: Math.min(100, (entry.completedDays / totalDays) * 100),
      }))
      .sort((a, b) => {
        if (b.totalPoints === a.totalPoints) return b.completedDays - a.completedDays;
        return b.totalPoints - a.totalPoints;
      });

    return leaderboard;
  }
}

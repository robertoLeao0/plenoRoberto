import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CompleteActionDto } from './dto/complete-action.dto';
import { ActionStatus } from '../../common/enums/action-status.enum';

@Injectable()
export class ActionLogsService {
  constructor(private prisma: PrismaService) {}

  async completeDay(userId: string, projectId: string, dayNumber: number, dto: CompleteActionDto) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new BadRequestException('Projeto não encontrado');

    const template = await this.prisma.dayTemplate.findUnique({
      where: { projectId_dayNumber: { projectId, dayNumber } },
    });
    if (!template) throw new BadRequestException('Dia não configurado');

    const extraPoint = template.requiresPhoto && dto.photoUrl ? 1 : 0;
    const points = template.points + extraPoint;

    const actionLog = await this.prisma.actionLog.upsert({
      where: { userId_projectId_dayNumber: { userId, projectId, dayNumber } },
      create: {
        userId,
        projectId,
        dayNumber,
        notes: dto.notes,
        photoUrl: dto.photoUrl,
        status: ActionStatus.CONCLUIDO,
        completedAt: new Date(),
        points,
      },
      update: {
        notes: dto.notes,
        photoUrl: dto.photoUrl,
        status: ActionStatus.CONCLUIDO,
        completedAt: new Date(),
        points,
      },
    });

    return actionLog;
  }

  myProgress(userId: string, projectId: string) {
    return this.prisma.actionLog.findMany({ where: { userId, projectId }, orderBy: { dayNumber: 'asc' } });
  }
}

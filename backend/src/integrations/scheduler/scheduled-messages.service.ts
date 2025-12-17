import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service'; // Ajuste o caminho ../..
import { ScheduledMessage } from '@prisma/client'; // Importa a tipagem gerada

@Injectable()
export class ScheduledMessagesService {
  constructor(private readonly prisma: PrismaService) {}

  // Listar todas (pode filtrar por projeto)
  async list(projectId?: string) {
    return this.prisma.scheduledMessage.findMany({
      where: projectId ? { projectId } : {},
      orderBy: { scheduledAt: 'desc' },
    });
  }

  // Pegar uma específica
  async get(id: string) {
    const message = await this.prisma.scheduledMessage.findUnique({
      where: { id },
    });
    if (!message) throw new NotFoundException('Mensagem agendada não encontrada.');
    return message;
  }

  // Criar nova mensagem agendada
  async create(data: {
    projectId?: string;
    title: string;
    body: string;
    mediaUrl?: string;
    targetType?: string;
    targetValue?: string;
    scheduledAt: string | Date; // Aceita string ou Date
    repeatCron?: string;
    createdBy?: string;
  }) {
    return this.prisma.scheduledMessage.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        body: data.body,
        mediaUrl: data.mediaUrl,
        targetType: data.targetType || 'project',
        targetValue: data.targetValue,
        scheduledAt: new Date(data.scheduledAt), // Garante Date
        repeatCron: data.repeatCron,
        createdBy: data.createdBy,
        status: 'scheduled', // Status inicial
      },
    });
  }

  // Atualizar
  async update(id: string, data: Partial<ScheduledMessage>) {
    return this.prisma.scheduledMessage.update({
      where: { id },
      data,
    });
  }

  // Remover
  async remove(id: string) {
    return this.prisma.scheduledMessage.delete({
      where: { id },
    });
  }
}
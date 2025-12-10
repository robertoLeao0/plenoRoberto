import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActionStatus } from '../../common/enums/action-status.enum';
import axios from 'axios'; // <--- Importação necessária para fazer chamadas HTTP

@Injectable()
export class ManyChatService {
  private readonly logger = new Logger(ManyChatService.name);

  // Pontuação padrão conforme combinado
  private readonly BASE_POINTS = 5;
  private readonly PHOTO_EXTRA = 2;

  constructor(private prisma: PrismaService) {}

  /**
   * Entrada principal: processa o payload recebido do ManyChat (webhook).
   */
  async handleManychatPayload(payload: any) {
    this.logger.debug('Handling ManyChat payload');

    const subscriber = payload?.subscriber || payload?.user || {};
    const message = payload?.message || payload?.text || {};
    const meta = payload?.meta || payload?.metadata || {};

    const manychatId: string | undefined = subscriber?.id;
    const phone: string | undefined =
      subscriber?.phone || subscriber?.phone_number || subscriber?.msisdn;
    const name: string | undefined = subscriber?.name || subscriber?.fullName;

    // Message content
    const text: string | undefined = (
      message?.text ||
      payload?.text ||
      ''
    ).toString();
    const attachments: any[] =
      message?.attachments || message?.media || payload?.attachments || [];

    // Project / day resolution (priority: explicit meta > payload.root fields > fallback to active project)
    let projectId: string | undefined =
      meta?.projectId || payload?.projectId || payload?.project?.id;
    let dayNumber: number | undefined = meta?.dayNumber || payload?.dayNumber;

    // 1) Resolve user in DB (by manychatId or phone). If not exists, create a minimal user.
    let user = null;
    const whereAny: any = {};
    if (manychatId) whereAny.manychatSubscriberId = manychatId;
    if (phone) whereAny.phone = phone;

    if (Object.keys(whereAny).length > 0) {
      user = await this.prisma.user.findFirst({ where: whereAny });
    }
    if (!user && (name || phone)) {
      // Create a minimal user record if not found.
      const emailPlaceholder = phone
        ? `${phone.replace(/\D/g, '')}@noemail.local`
        : `noemail_${Date.now()}@noemail.local`;
      user = await this.prisma.user.create({
        data: {
          name: name || 'Participante',
          email: emailPlaceholder,
          passwordHash: '', // placeholder
          role: 'SERVIDOR',
          ...(manychatId ? { manychatSubscriberId: manychatId } : {}),
          ...(phone ? { phone } : {}),
        },
      });
      this.logger.log(
        `Created placeholder user ${user.id} for incoming webhook (manychatId=${manychatId} phone=${phone})`,
      );
    }

    if (!user) {
      this.logger.error('Could not resolve or create user from payload');
      throw new BadRequestException('User not identified in payload');
    }

    // 2) Resolve projectId if não fornecido explicitamente
    if (!projectId) {
      const activeProjects = await this.prisma.project.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      if (activeProjects.length === 0) {
        throw new BadRequestException(
          'No active project found and projectId not provided in payload.',
        );
      }
      projectId = activeProjects[0].id;
      this.logger.log(
        `projectId not provided; defaulting to active project ${projectId}`,
      );
    }

    // 3) Resolve dayNumber
    if (!dayNumber) {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        throw new BadRequestException('Project not found for given projectId');
      }
      const start = project.startDate;
      if (!start) {
        throw new BadRequestException(
          'Project does not have a startDate; cannot compute dayNumber. Provide dayNumber in payload.',
        );
      }
      const diffMs = Date.now() - new Date(start).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      dayNumber = Math.min(diffDays + 1, project.totalDays || 21);
      this.logger.log(`Computed dayNumber=${dayNumber} from project.startDate`);
    }

    // 4) Fetch DayTemplate to check points and requiresPhoto
    const template = await this.prisma.dayTemplate.findUnique({
      where: { projectId_dayNumber: { projectId, dayNumber } },
    });
    if (!template) {
      throw new BadRequestException(
        'Day template not configured for this project/day',
      );
    }

    // 5) Determine if there is a photo in attachments
    const photoAttachment = attachments.find(
      (a) =>
        (a?.type || '').toLowerCase().includes('image') ||
        (a?.mime || '').startsWith?.('image'),
    );
    const photoUrl = photoAttachment?.url || photoAttachment?.fileUrl || null;

    // 6) Calculate points to award now
    let pointsToAward = template.points ?? this.BASE_POINTS;

    if (photoUrl) {
      pointsToAward = this.BASE_POINTS + this.PHOTO_EXTRA;
    } else {
      pointsToAward = this.BASE_POINTS;
    }

    // 7) Upsert ActionLog e calcular delta
    const uniqueWhere = {
      userId_projectId_dayNumber: { userId: user.id, projectId, dayNumber },
    };

    const existingLog = await this.prisma.actionLog.findUnique({
      where: uniqueWhere,
    });

    if (existingLog) {
      const existingPoints = existingLog.pointsAwarded ?? 0;
      const newPoints = pointsToAward;

      if (
        existingLog.status === ActionStatus.CONCLUIDO &&
        existingPoints === newPoints
      ) {
        this.logger.log(
          `ActionLog already concluded for user=${user.id} project=${projectId} day=${dayNumber} with same points=${existingPoints}`,
        );
        return {
          status: 'no_change',
          userId: user.id,
          projectId,
          dayNumber,
          pointsAwarded: existingPoints,
        };
      }

      // Update record
      const updated = await this.prisma.actionLog.update({
        where: { id: existingLog.id },
        data: {
          status: ActionStatus.CONCLUIDO,
          notes: payload?.notes || existingLog.notes,
          photoUrl: photoUrl || existingLog.photoUrl,
          completedAt: new Date(),
          pointsAwarded: newPoints,
        },
      });

      // Update ranking with delta
      const delta = newPoints - existingPoints;
      if (delta !== 0) {
        await this._applyRankingDelta(
          user.id,
          projectId,
          delta,
          existingLog ? false : true,
        );
      }

      return { status: 'updated', actionLog: updated, delta };
    } else {
      // Create new action log
      const created = await this.prisma.actionLog.create({
        data: {
          userId: user.id,
          projectId,
          dayNumber,
          status: ActionStatus.CONCLUIDO,
          photoUrl: photoUrl,
          notes: payload?.notes || null,
          completedAt: new Date(),
          pointsAwarded: pointsToAward,
        },
      });

      // Apply full points to ranking (new)
      await this._applyRankingDelta(user.id, projectId, pointsToAward, true);

      return {
        status: 'created',
        actionLog: created,
        pointsAwarded: pointsToAward,
      };
    }
  }

  /**
   * Aplica delta de pontos ao RankingSummary (cria se não existir).
   */
  private async _applyRankingDelta(
    userId: string,
    projectId: string,
    delta: number,
    isNewCompletion = false,
  ) {
    const existing = await this.prisma.rankingSummary.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });

    if (existing) {
      const updated = await this.prisma.rankingSummary.update({
        where: { userId_projectId: { userId, projectId } },
        data: {
          totalPoints: { increment: delta },
          completedDays: isNewCompletion ? { increment: 1 } : undefined,
          completionRate: undefined, // vamos recalcular abaixo
        },
      });

      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });
      const totalDays = project?.totalDays || 21;
      const completionRate = (updated.completedDays / totalDays) * 100;

      await this.prisma.rankingSummary.update({
        where: { userId_projectId: { userId, projectId } },
        data: { completionRate },
      });
    } else {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });
      const totalDays = project?.totalDays || 21;

      const created = await this.prisma.rankingSummary.create({
        data: {
          userId,
          projectId,
          totalPoints: Math.max(0, delta),
          completedDays: isNewCompletion ? 1 : 0,
          completionRate: isNewCompletion ? (1 / totalDays) * 100 : 0,
        },
      });
      return created;
    }
  }

  /**
   * [NOVO] Envia uma mensagem (texto ou fluxo) para um usuário específico no ManyChat.
   */
  async sendMessage(params: {
    subscriberId: string;
    text?: string;
    flowId?: string;
    projectId: string;
  }) {
    // 1. Busca o token do projeto
    const connection = await this.prisma.manychatConnection.findUnique({
      where: {
        provider_projectId: { provider: 'manychat', projectId: params.projectId },
      },
    });

    if (!connection || !connection.accessToken) {
      this.logger.error(
        `Tentativa de envio sem conexão ManyChat para o projeto ${params.projectId}`,
      );
      return { success: false, error: 'Sem conexão configurada' };
    }

    const token = connection.accessToken;

    try {
      // 2. Monta o payload dependendo se é texto ou fluxo
      let payload: any = {
        subscriber_id: params.subscriberId,
        message_tag: 'ACCOUNT_UPDATE', // Obrigatório pela Meta para mensagens fora da janela de 24h
      };

      if (params.flowId) {
        // Enviar um Fluxo pronto
        payload = { ...payload, flow_ns: params.flowId };
        
        await axios.post('https://api.manychat.com/fb/sending/sendFlow', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Enviar Texto Simples
        payload = {
          ...payload,
          data: {
            version: 'v2',
            content: {
              type: 'text',
              text: params.text || 'Olá!',
            },
          },
        };
        
        await axios.post('https://api.manychat.com/fb/sending/sendContent', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      this.logger.log(`Mensagem enviada com sucesso para ${params.subscriberId}`);
      return { success: true };

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      this.logger.error(`Erro ao enviar ManyChat: ${errorMessage}`);
      // Retorna o erro detalhado para salvar no log do banco
      return { success: false, error: error.response?.data || errorMessage };
    }
  }
}
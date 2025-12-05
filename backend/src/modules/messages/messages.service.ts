import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import cron from 'node-cron';
import axios from 'axios';
import { PrismaService } from '../../database/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageStatus, TargetAudience } from '../../common/enums/message.enum';

@Injectable()
export class MessagesService implements OnModuleInit {
  private readonly logger = new Logger(MessagesService.name);

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    cron.schedule('*/5 * * * *', () => this.dispatchPending());
  }

  async create(dto: CreateMessageDto, createdById: string) {
    return this.prisma.message.create({
      data: {
        ...dto,
        sendDate: new Date(dto.sendDate),
        createdById,
      },
    });
  }

  findAll() {
    return this.prisma.message.findMany({ orderBy: { sendDate: 'desc' } });
  }

  async dispatchPending() {
    const messages = await this.prisma.message.findMany({
      where: { status: MessageStatus.PENDING, sendDate: { lte: new Date() } },
    });

    for (const message of messages) {
      try {
        const recipients = await this.resolveRecipients(message.targetAudience, message.municipalityId, message.projectId);
        await Promise.all(recipients.map((recipient) => this.sendWhatsappMessage(recipient, message.content)));
        await this.prisma.message.update({ where: { id: message.id }, data: { status: MessageStatus.SENT } });
      } catch (err) {
        this.logger.error(`Falha ao enviar mensagem ${message.id}`, err as Error);
        await this.prisma.message.update({ where: { id: message.id }, data: { status: MessageStatus.FAILED } });
      }
    }
  }

  private async resolveRecipients(audience: TargetAudience, municipalityId?: string, projectId?: string) {
    if (audience === TargetAudience.MUNICIPALITY && municipalityId) {
      return this.prisma.user.findMany({ where: { municipalityId } });
    }
    if (audience === TargetAudience.PROJECT && projectId) {
      return this.prisma.user.findMany({
        where: {
          actionLogs: { some: { projectId } },
        },
      });
    }
    return this.prisma.user.findMany();
  }

  private async sendWhatsappMessage(user: { email: string }, content: string) {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    if (!token || !phoneId) {
      this.logger.warn('Variáveis de WhatsApp não configuradas, simulando envio.');
      return;
    }

    await axios.post(
      `https://graph.facebook.com/v17.0/${phoneId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: user.email,
        type: 'text',
        text: { body: content },
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  }
}

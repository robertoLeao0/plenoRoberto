import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
// Ajuste os ".." conforme sua estrutura.
// Se estiver em src/integrations/scheduler, use ../../
import { PrismaService } from '../../database/prisma.service'; 
import { ManyChatService } from '../manychat/manychat.service'; 

@Injectable()
export class TasksSchedulerService {
  private readonly logger = new Logger(TasksSchedulerService.name);
  private isRunning = false;

  constructor(
    private prisma: PrismaService,
    private manyChatService: ManyChatService,
  ) {}

  // Roda a cada minuto
  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledTasks() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      await this.processTasks();
    } catch (error) {
      this.logger.error('Erro no processamento do Cron de Tarefas:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async processTasks() {
    const now = new Date();

    // 1. Busca tarefas PENDENTES cuja data de início já chegou
    // Usa 'startAt' e 'status' (String) conforme seu schema atual
    const tasks = await this.prisma.task.findMany({
      where: {
        status: 'PENDING', 
        startAt: { lte: now }, // Data de início menor ou igual a agora
        isActive: true,
      },
      include: {
        project: {
          include: {
            subscribers: {
              where: { active: true },
              include: { user: true },
            },
          },
        },
      },
    });

    if (tasks.length === 0) return;

    this.logger.log(`[Scheduler] Encontradas ${tasks.length} tarefas para processar.`);

    for (const task of tasks) {
      // 2. Trava a tarefa para não processar duas vezes
      await this.prisma.task.update({
        where: { id: task.id },
        data: { status: 'PROCESSING' },
      });

      let successCount = 0;
      let failCount = 0;

      // 3. Envia para cada inscrito
      for (const sub of task.project.subscribers) {
        const user = sub.user;

        if (!user.manychatSubscriberId) {
            failCount++;
            continue;
        }

        // Envia mensagem via ManyChat
        // Usa 'description' pois 'content' não existe no schema
        const result = await this.manyChatService.sendMessage({
          projectId: task.projectId,
          subscriberId: user.manychatSubscriberId,
          text: task.description || `Nova tarefa disponível: ${task.title}`, 
        });

        // Grava Log na tabela TaskLog existente
        await this.prisma.taskLog.create({
          data: {
            taskId: task.id,
            userId: user.id,
            status: result.success ? 'SUCCESS' : 'FAILED', 
            error: result.error ? JSON.stringify(result.error) : null,
          },
        });

        if (result.success) successCount++;
        else failCount++;
      }

      // 4. Libera a tarefa (Status OPEN)
      await this.prisma.task.update({
        where: { id: task.id },
        data: { status: 'OPEN' }, 
      });

      this.logger.log(
        `[Scheduler] Tarefa "${task.title}" processada. Sucessos: ${successCount}, Falhas: ${failCount}`,
      );
    }
  }
}
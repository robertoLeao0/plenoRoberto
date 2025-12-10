import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { ManyChatService } from '../manychat/manychat.service';
import { TaskStatus, TaskLogStatus } from '@prisma/client';

@Injectable()
export class TasksSchedulerService {
  private readonly logger = new Logger(TasksSchedulerService.name);
  private isRunning = false;

  constructor(
    private prisma: PrismaService,
    private manyChatService: ManyChatService,
  ) {}

  // Roda a cada minuto para verificar disparos
  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledTasks() {
    // Evita sobreposição se o job anterior demorar mais de 1 min
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

    // 1. Busca tarefas que estão AGENDADAS e cuja hora já chegou (ou passou)
    //    e que o status ainda não mudou para ENVIANDO ou CONCLUIDO
    const tasks = await this.prisma.task.findMany({
      where: {
        status: 'AGENDADO', 
        sendAt: { lte: now }, // Data de envio menor ou igual a agora
      },
      include: {
        project: {
          include: {
            subscribers: {
              where: { active: true }, // Apenas inscritos ativos no projeto
              include: { user: true },
            },
          },
        },
      },
    });

    if (tasks.length === 0) return;

    this.logger.log(`[Scheduler] Encontradas ${tasks.length} tarefas para processar.`);

    // 2. Processa cada tarefa encontrada
    for (const task of tasks) {
      this.logger.log(`[Scheduler] Iniciando envio da tarefa: "${task.title}" (ID: ${task.id})`);

      // Marca como ENVIANDO para travar a tarefa e evitar duplicidade se o cron rodar de novo
      await this.prisma.task.update({
        where: { id: task.id },
        data: { status: 'ENVIANDO' },
      });

      let successCount = 0;
      let failCount = 0;

      // 3. Itera sobre cada inscrito do projeto vinculado à tarefa
      for (const sub of task.project.subscribers) {
        const user = sub.user;

        // Verifica se o usuário tem o ID do ManyChat conectado
        if (!user.manychatSubscriberId) {
          // Grava Log de falha (usuário não conectado)
          await this.prisma.taskLog.create({
            data: {
              taskId: task.id,
              userId: user.id,
              status: 'FALHA',
              error: 'Usuário sem manychatSubscriberId (não interagiu com o bot)',
            },
          });
          failCount++;
          continue;
        }

        // Tenta enviar usando o ManyChatService
        const result = await this.manyChatService.sendMessage({
          projectId: task.projectId,
          subscriberId: user.manychatSubscriberId,
          text: task.content || undefined,
          // Se sua Task tiver um campo para ID do fluxo (ex: flowId), passe aqui
        });

        // Grava o Log do envio individual
        await this.prisma.taskLog.create({
          data: {
            taskId: task.id,
            userId: user.id,
            status: result.success ? 'SUCESSO' : 'FALHA',
            error: result.error ? JSON.stringify(result.error) : null,
          },
        });

        if (result.success) successCount++;
        else failCount++;
      }

      // 4. Finaliza a tarefa marcando como CONCLUIDO
      await this.prisma.task.update({
        where: { id: task.id },
        data: { status: 'CONCLUIDO' },
      });

      this.logger.log(
        `[Scheduler] Tarefa "${task.title}" finalizada. Sucessos: ${successCount}, Falhas: ${failCount}`,
      );
    }
  }
}
import { Module } from '@nestjs/common';
import { ScheduledMessagesService } from './scheduled-messages.service';
import { ScheduledMessagesController } from './scheduled-messages.controller';
import { PrismaModule } from '../../database/prisma.module'; // Ajuste o caminho se necessário

@Module({
  imports: [PrismaModule],
  controllers: [ScheduledMessagesController],
  providers: [ScheduledMessagesService],
  exports: [ScheduledMessagesService], // Exporta caso precise usar em outro lugar
})
export class ScheduledMessagesModule {}
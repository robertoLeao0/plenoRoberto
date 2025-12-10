// src/integrations/integrations.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

// ManyChat pieces
import { ManyChatService } from './manychat/manychat.service';
import { ManychatConnectionService } from './manychat/manychat-connection.service';
import { ManychatConnectionController } from './manychat/manychat-connection.controller';
import { ManychatTestController } from './manychat/manychat-test.controller';

// Scheduler pieces
import { ScheduledMessagesService } from './scheduler/scheduled-messages.service';
import { ScheduledMessagesController } from './scheduler/scheduled-messages.controller';
import { TasksSchedulerService } from './scheduler/tasks-scheduler.service';

// Integration settings module (settings / upsert)
import { IntegrationsSettingsModule } from './settings/integrations-settings.module';

@Module({
  imports: [
    IntegrationsSettingsModule,
  ],
  controllers: [
    ManychatConnectionController,
    ScheduledMessagesController,
    ManychatTestController,
  ],
  providers: [
    PrismaService,
    ManyChatService,
    ManychatConnectionService,
    ScheduledMessagesService,
    TasksSchedulerService,
  ],
  exports: [
    ManyChatService,
    ManychatConnectionService,
    ScheduledMessagesService,
  ],
})
export class IntegrationsModule {}

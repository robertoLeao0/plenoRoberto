import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // <--- Importe ConfigService
import { ScheduleModule } from '@nestjs/schedule';
import { MailerModule } from '@nestjs-modules/mailer';

// ... outros imports (Auth, Users, PrismaService, etc) ...
import { PrismaService } from './database/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MunicipalitiesModule } from './modules/municipalities/municipalities.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { DayTemplatesModule } from './modules/day-templates/day-templates.module';
import { ActionLogsModule } from './modules/action-logs/action-logs.module';
import { RankingModule } from './modules/ranking/ranking.module';
import { ReportsModule } from './modules/reports/reports.module';
import { TaskModule } from './tasks/task.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { IntegrationsModule } from './integrations/integrations.module';

@Module({
  imports: [
    // Deixe o ConfigModule como global, no topo
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),

    // === CONFIGURAÇÃO SEGURA DO EMAIL ===
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get<string>('MAIL_HOST'),
          port: config.get<number>('MAIL_PORT'),
          secure: true, // true para 465, false para outras
          auth: {
            user: config.get<string>('MAIL_USER'),
            pass: config.get<string>('MAIL_PASS'),
          },
        },
        defaults: {
          from: config.get<string>('MAIL_FROM'),
        },
      }),
      inject: [ConfigService],
    }),

    AuthModule,
    UsersModule,
    MunicipalitiesModule,
    ProjectsModule,
    DayTemplatesModule,
    ActionLogsModule,
    RankingModule,
    ReportsModule,
    TaskModule,
    IntegrationsModule,
    OrganizationsModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
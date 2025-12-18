import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MailerModule } from '@nestjs-modules/mailer';

// Imports da Aplicação
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
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    // Configurações Globais
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),

    // === CONFIGURAÇÃO HOSTGATOR ===
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get<string>('MAIL_HOST'),
          port: Number(config.get('MAIL_PORT')), // Garante que é número (465)
          secure: true, // HostGator na porta 465 exige true
          auth: {
            user: config.get<string>('MAIL_USER'),
            pass: config.get<string>('MAIL_PASS'),
          },
          // Importante para evitar erros de certificado SSL comuns em hospedagem compartilhada
          tls: {
            rejectUnauthorized: false,
          },
        },
        defaults: {
          from: config.get<string>('MAIL_FROM'),
        },
      }),
      inject: [ConfigService],
    }),

    // Módulos de Funcionalidade
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
    DashboardModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
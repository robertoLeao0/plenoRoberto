import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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


// integrations
import { IntegrationsModule } from './integrations/integrations.module';
import { ScheduleModule } from '@nestjs/schedule';



@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
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

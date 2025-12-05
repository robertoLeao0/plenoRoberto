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
import { UploadsModule } from './modules/uploads/uploads.module';
import { ReportsModule } from './modules/reports/reports.module';
import { MessagesModule } from './modules/messages/messages.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    MunicipalitiesModule,
    ProjectsModule,
    DayTemplatesModule,
    ActionLogsModule,
    RankingModule,
    UploadsModule,
    ReportsModule,
    MessagesModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}

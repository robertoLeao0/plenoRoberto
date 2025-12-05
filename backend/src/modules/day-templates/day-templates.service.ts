import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDayTemplateDto } from './dto/create-day-template.dto';

@Injectable()
export class DayTemplatesService {
  constructor(private prisma: PrismaService) {}

  createBatch(projectId: string, templates: CreateDayTemplateDto[]) {
    return this.prisma.$transaction(
      templates.map((template) =>
        this.prisma.dayTemplate.upsert({
          where: { projectId_dayNumber: { projectId, dayNumber: template.dayNumber } },
          update: template,
          create: { ...template, projectId },
        }),
      ),
    );
  }

  findAll(projectId: string) {
    return this.prisma.dayTemplate.findMany({ where: { projectId }, orderBy: { dayNumber: 'asc' } });
  }

  update(projectId: string, dayNumber: number, dto: Partial<CreateDayTemplateDto>) {
    return this.prisma.dayTemplate.update({
      where: { projectId_dayNumber: { projectId, dayNumber } },
      data: dto,
    });
  }
}

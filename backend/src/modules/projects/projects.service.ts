import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProjectDto) {
    // Verifica se a ORGANIZAÇÃO existe (não município)
    const org = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId }
    });

    if (!org) {
      throw new BadRequestException('Organização não encontrada.');
    }

    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        organizationId: dto.organizationId, // <--- Salva corretamente
        isActive: dto.isActive,
        totalDays: dto.totalDays,
        // Garante que são datas válidas
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }

  // ... (o restante dos métodos update, findAll mantidos iguais, só atente para trocar municipalityId por organizationId se houver)
  
  findAll(filters?: { organizationId?: string; isActive?: boolean }) {
    return this.prisma.project.findMany({
      where: { ...filters },
      orderBy: { createdAt: 'desc' },
      include: { organization: true }
    });
  }
  
  // ... métodos findOne e remove ...
  async findOne(id: string) {
    return this.prisma.project.findUnique({ where: { id } });
  }

  async update(id: string, dto: UpdateProjectDto) {
      const { startDate, endDate, ...rest } = dto;
      const data: any = { ...rest };
      
      if (startDate) data.startDate = new Date(startDate);
      if (endDate) data.endDate = new Date(endDate);

      return this.prisma.project.update({ where: { id }, data });
  }

  async remove(id: string) {
      return this.prisma.project.delete({ where: { id } });
  }
}
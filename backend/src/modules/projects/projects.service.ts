import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProjectDto) {
    // Verifica se o município existe antes de tentar criar
    const municipality = await this.prisma.municipality.findUnique({
      where: { id: dto.municipalityId }
    });

    if (!municipality) {
      // Se não existir, lança um erro claro para o frontend
      throw new BadRequestException('Município não encontrado. Verifique o ID.');
    }

    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        municipalityId: dto.municipalityId,
        isActive: dto.isActive,
        totalDays: dto.totalDays,
        // CONVERSÃO DE DATA IMPORTANTE:
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }

  findAll(filters?: { municipalityId?: string; isActive?: boolean }) {
    return this.prisma.project.findMany({ 
      where: { ...filters },
      orderBy: { createdAt: 'desc' }
    });
  }

  findOne(id: string) {
    return this.prisma.project.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateProjectDto) {
    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);

    return this.prisma.project.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }
}
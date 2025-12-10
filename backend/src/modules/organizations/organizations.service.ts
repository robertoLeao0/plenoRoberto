// src/modules/organizations/organizations.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { Role } from '@prisma/client';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateOrganizationDto) {
    return this.prisma.organization.create({
      data: {
        name: data.name,
        cnpj: data.cnpj,
        description: data.description,
        location: data.location,
        type: data.type || 'CUSTOMER',
        active: true,
      },
    });
  }

  async findAll(currentUser: any) {
    // Se for ADMIN, busca tudo
    if (currentUser.role === Role.ADMIN) {
      return this.prisma.organization.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { users: true, projects: true } },
        },
      });
    }

    // Se for GESTOR ou USUARIO, busca SÓ a organização dele
    return this.prisma.organization.findMany({
      where: {
        id: currentUser.organizationId,
      },
      include: {
        _count: { select: { users: true, projects: true } },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
            select: { id: true, name: true, email: true, role: true, avatarUrl: true }
        }
      }
    });
  }
}
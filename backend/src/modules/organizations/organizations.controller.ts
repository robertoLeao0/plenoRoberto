import { 
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards 
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  // 1. LISTAR (Aceita ?status=active ou ?status=inactive)
  @Get()
  findAll(@Query('status') status?: 'active' | 'inactive') {
    // Se não enviar nada, assume 'active'
    return this.organizationsService.findAll(status || 'active');
  }

  // 2. BUSCAR UMA
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  // 3. CRIAR
  @Post()
  create(@Body() body: any) {
    return this.organizationsService.create(body);
  }

  // 4. ATUALIZAR DADOS
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.organizationsService.update(id, body);
  }

  // 5. INATIVAR (Soft Delete) - Usado no botão "Inativar"
  @Delete(':id')
  softDelete(@Param('id') id: string) {
    return this.organizationsService.softDelete(id);
  }

  // 6. REATIVAR - Usado no botão "Reativar"
  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.organizationsService.reactivate(id);
  }

  // 7. EXCLUIR PERMANENTEMENTE - Usado no botão "Excluir Permanentemente"
  @Delete(':id/permanent')
  hardDelete(@Param('id') id: string) {
    return this.organizationsService.hardDelete(id);
  }

  // === MEMBROS ===

  @Post(':id/members')
  async addMember(@Param('id') id: string, @Body('email') email: string) {
    return this.organizationsService.addMember(id, email);
  }

  @Patch(':id/manager')
  async defineManager(@Param('id') id: string, @Body('userId') userId: string) {
    return this.organizationsService.defineManager(id, userId);
  }

  @Delete('members/:userId')
  async removeMember(@Param('userId') userId: string) {
    return this.organizationsService.removeMember(userId);
  }
}
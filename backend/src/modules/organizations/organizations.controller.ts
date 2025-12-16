import { 
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards 
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Ajuste o caminho se necessário

@Controller('organizations')
@UseGuards(JwtAuthGuard) // Protege tudo (só logado acessa)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  // 1. LISTAR (Aceita filtro ?active=true/false)
  @Get()
  findAll(@Query('active') active?: string) {
    const isActive = active === 'true' ? true : active === 'false' ? false : undefined;
    return this.organizationsService.findAll(isActive);
  }

  // 2. DETALHES
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  // 3. CRIAR
  @Post()
  create(@Body() body: any) {
    return this.organizationsService.create(body);
  }

  // 4. ATUALIZAR (Serve para ativar/desativar também)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.organizationsService.update(id, body);
  }

  // 5. ADICIONAR MEMBRO
  @Post(':id/members')
  async addMember(@Param('id') id: string, @Body('email') email: string) {
    return this.organizationsService.addMember(id, email);
  }

  // 6. DEFINIR GESTOR
  @Patch(':id/manager')
  async defineManager(@Param('id') id: string, @Body('userId') userId: string) {
    return this.organizationsService.defineManager(id, userId);
  }

  // 7. REMOVER MEMBRO
  @Delete('members/:userId')
  async removeMember(@Param('userId') userId: string) {
    return this.organizationsService.removeMember(userId);
  }
}
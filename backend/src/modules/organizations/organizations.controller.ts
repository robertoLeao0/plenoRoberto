import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  // Criar Organização (Apenas ADMIN)
  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  // Listar todas (Apenas ADMIN vê todas, ou podemos ajustar filtro depois)
  @Get()
  @Roles(UserRole.ADMIN) 
  findAll(@Query('status') status?: 'active' | 'inactive') {
    return this.organizationsService.findAll(status);
  }

  // Detalhes de uma (Admin ou Gestor da própria)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  // Atualizar (Apenas ADMIN define gestores e edita dados)
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateOrganizationDto: UpdateOrganizationDto) {
    return this.organizationsService.update(id, updateOrganizationDto);
  }

  // Gerar novo Token de Importação
  @Patch(':id/token')
  @Roles(UserRole.ADMIN, UserRole.GESTOR_ORGANIZACAO)
  generateToken(@Param('id') id: string) {
    return this.organizationsService.generateToken(id);
  }

  // Inativar (Soft Delete)
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  softDelete(@Param('id') id: string) {
    return this.organizationsService.softDelete(id);
  }

  // Reativar
  @Patch(':id/reactivate')
  @Roles(UserRole.ADMIN)
  reactivate(@Param('id') id: string) {
    return this.organizationsService.reactivate(id);
  }

  // Adicionar membro manualmente (Ex: Gestor adicionando alguém por email)
  @Post(':id/members')
  @Roles(UserRole.ADMIN, UserRole.GESTOR_ORGANIZACAO)
  addMember(@Param('id') id: string, @Body('email') email: string) {
    return this.organizationsService.addMember(id, email);
  }

  // Remover membro
  @Delete('members/:userId')
  @Roles(UserRole.ADMIN, UserRole.GESTOR_ORGANIZACAO)
  removeMember(@Param('userId') userId: string) {
    return this.organizationsService.removeMember(userId);
  }
}
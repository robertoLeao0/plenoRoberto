import { 
  Controller, Get, Post, Put, Patch, Delete, Body, Param, 
  UseGuards, Req, UseInterceptors, UploadedFile, Query 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

// === CONFIGURAÇÃO PARA SALVAR AVATAR NO DISCO ===
const storageConfig = diskStorage({
  destination: './uploads/avatars', 
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    callback(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

@Controller('users')
@UseGuards(JwtAuthGuard) // Protege todas as rotas (requer login)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 1. CRIAR USUÁRIO MANUALMENTE
  @Post()
  create(@Body() body: any) {
    return this.usersService.create(body);
  }

  // 2. LISTAR COM FILTROS (GET /users?organizationId=...)
  @Get()
  findAll(@Query('organizationId') organizationId?: string) {
    return this.usersService.findAll({ organizationId });
  }

  // 3. LISTAR GESTORES (Para dropdown de Organização)
  @Get('managers')
  findManagers() {
    return this.usersService.findPotentialManagers();
  }

  // 4. PERFIL DO USUÁRIO LOGADO (Me)
  @Get('me')
  getMe(@Req() req) {
    return this.usersService.findOne(req.user.id);
  }

  // 5. ATUALIZAR PERFIL (LOGADO) + UPLOAD DE FOTO
  @Put('profile')
  @UseInterceptors(FileInterceptor('avatar', { storage: storageConfig }))
  async updateProfile(
    @Req() req,
    @Body() body: { name?: string, password?: string },
    @UploadedFile() file: Express.Multer.File
  ) {
    const userId = req.user.id;
    
    // Gera URL da imagem se houver arquivo
    const avatarUrl = file 
      ? `http://localhost:3000/uploads/avatars/${file.filename}` 
      : undefined;

    const updateData: any = { ...body };
    if (avatarUrl) updateData.avatarUrl = avatarUrl;

    return this.usersService.update(userId, updateData);
  }

  // 6. IMPORTAR EXCEL
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importUsers(
    @UploadedFile() file: Express.Multer.File,
    @Body('organizationId') organizationId: string,
    @Req() req,
  ) {
    // Se quem está importando for Gestor, força o ID da organização dele por segurança
    const orgId = req.user.role === 'GESTOR_ORGANIZACAO' 
      ? req.user.organizationId 
      : organizationId;

    return this.usersService.importUsers(file, orgId);
  }

  // 7. ADICIONAR EM MASSA NA ORGANIZAÇÃO
  @Patch('add-to-organization')
  async addMembers(@Body() body: { organizationId: string; userIds: string[] }) {
    return this.usersService.addUsersToOrganization(body.organizationId, body.userIds);
  }

  // 8. BUSCAR UM USUÁRIO PELO ID (Necessário para Admin/Gestor ver detalhes)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // 9. ATUALIZAR UM USUÁRIO PELO ID (Admin editando outros)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(id, body);
  }

  // 10. DELETAR (Opcional, caso precise)
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.usersService.remove(id); // Precisa criar no service se for usar
  // }
}
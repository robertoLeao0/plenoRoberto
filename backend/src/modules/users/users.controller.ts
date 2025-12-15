import { 
  Controller, Get, Post, Put, Patch, Body, UseGuards, 
  Req, UseInterceptors, UploadedFile, Query 
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
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 1. LISTAR COM FILTROS (GET /users?organizationId=...)
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('organizationId') organizationId?: string) {
    return this.usersService.findAll({ organizationId });
  }

  // 2. ATUALIZAR PERFIL + UPLOAD DE FOTO
  @UseGuards(JwtAuthGuard)
  @Put('profile')
  @UseInterceptors(FileInterceptor('avatar', { storage: storageConfig }))
  async updateProfile(
    @Req() req,
    @Body() body: { name: string },
    @UploadedFile() file: Express.Multer.File
  ) {
    const userId = req.user.id;
    
    // Gera URL da imagem se houver arquivo
    const avatarUrl = file 
      ? `http://localhost:3000/uploads/avatars/${file.filename}` 
      : undefined;

    const updateData: any = { name: body.name };
    if (avatarUrl) updateData.avatarUrl = avatarUrl;

    return this.usersService.update(userId, updateData);
  }

  // 3. IMPORTAR EXCEL (Usa memória, não disco)
  @Post('import')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file')) // Sem storageConfig = salva na memória (buffer)
  async importUsers(
    @UploadedFile() file: Express.Multer.File,
    @Body('organizationId') organizationId: string,
    @Req() req,
  ) {
    // Se for Gestor, força o ID dele. Se for Admin, usa o que enviou.
    const orgId = req.user.role === 'GESTOR_ORGANIZACAO' 
      ? req.user.organizationId 
      : organizationId;

    return this.usersService.importUsers(file, orgId);
  }

  // 4. ADICIONAR EM MASSA
  @UseGuards(JwtAuthGuard)
  @Patch('add-to-organization')
  async addMembers(@Body() body: { organizationId: string; userIds: string[] }) {
    return this.usersService.addUsersToOrganization(body.organizationId, body.userIds);
  }
}
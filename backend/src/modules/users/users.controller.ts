import { 
  Controller, 
  Put, 
  Body, 
  UseGuards, 
  Req, 
  UseInterceptors, 
  UploadedFile 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

// === CONFIGURAÇÃO AJUSTADA ===
const storageConfig = diskStorage({
  // 1. Agora salva dentro da subpasta avatars
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

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  @UseInterceptors(FileInterceptor('avatar', { storage: storageConfig }))
  async updateProfile(
    @Req() req,
    @Body() body: { name: string },
    @UploadedFile() file: Express.Multer.File
  ) {
    const userId = req.user.id;
    
    // 2. A URL agora inclui /avatars/
    // ATENÇÃO: Ajuste a porta se necessário (ex: 3000 ou 3333)
    const avatarUrl = file ? `http://localhost:3000/uploads/avatars/${file.filename}` : undefined;

    const updateData: any = { name: body.name };
    if (avatarUrl) updateData.avatarUrl = avatarUrl;

    return this.usersService.update(userId, updateData);
  }
}
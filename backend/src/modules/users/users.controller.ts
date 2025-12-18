import { 
  Controller, Get, Post, Put, Patch, Body, Param, 
  UseGuards, Req, UseInterceptors, UploadedFile, Query 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

const storageConfig = diskStorage({
  destination: './uploads/avatars', 
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    callback(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() body: any) {
    return this.usersService.create(body);
  }

  @Get()
  findAll(@Query('organizationId') organizationId?: string) {
    return this.usersService.findAll({ organizationId });
  }

  @Get('managers')
  findManagers() {
    return this.usersService.findPotentialManagers();
  }

  @Get('me')
  getMe(@Req() req: any) {
    return this.usersService.findOne(req.user.id);
  }

  @Put('profile')
  @UseInterceptors(FileInterceptor('avatar', { storage: storageConfig }))
  async updateProfile(
    @Req() req: any,
    @Body() body: { name?: string, password?: string },
    @UploadedFile() file: Express.Multer.File
  ) {
    const userId = req.user.id;
    const avatarUrl = file ? `http://localhost:3000/uploads/avatars/${file.filename}` : undefined;
    const updateData: any = { ...body };
    if (avatarUrl) updateData.avatarUrl = avatarUrl;
    return this.usersService.update(userId, updateData);
  }

  // === ROTA DE IMPORTAÇÃO ===
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importUsers(@UploadedFile() file: Express.Multer.File) {
    // Não precisa mais receber organizationId no Body, pois o TOKEN está na planilha
    return this.usersService.importUsers(file);
  }

  @Patch('add-to-organization')
  async addMembers(@Body() body: { organizationId: string; userIds: string[] }) {
    return this.usersService.addUsersToOrganization(body.organizationId, body.userIds);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(id, body);
  }
}
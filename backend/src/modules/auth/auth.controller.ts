import { Controller, Request, Post, UseGuards, Get, Body, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService, 
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }
    const user = await this.usersService.findOne(req.user.id);
    
    if (!user) {
      throw new NotFoundException('Usuário não encontrado no sistema.');
    }
    
    const { password, ...result } = user;
    
    return result;
  }
}
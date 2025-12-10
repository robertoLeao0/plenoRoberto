import { Controller, Request, Post, UseGuards, Get, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service'; // <--- IMPORTANTE: Importar o UsersService

@Controller('auth')
export class AuthController {
  // Injete o UsersService no construtor
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
    // CORREÇÃO: Em vez de retornar "req.user" (que só tem id e role),
    // buscamos o usuário completo no banco usando o ID.
    const user = await this.usersService.findOne(req.user.id);
    
    // Removemos a senha antes de enviar para garantir segurança
    const { password, ...result } = user;
    
    return result;
  }
}
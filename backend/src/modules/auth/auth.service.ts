import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'; // <--- Ajustado para usar o bcrypt que instalamos
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async validateUser(email: string, pass: string) {
    // Busca o usuário pelo e-mail
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // === CORREÇÃO PRINCIPAL AQUI ===
    // No seu schema novo o campo é 'password', não 'passwordHash'
    const isValid = await bcrypt.compare(pass, user.password); 

    if (!isValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return user;
  }

  async login(payload: LoginDto) {
    const user = await this.validateUser(payload.email, payload.password);

    // Gera o token de acesso com o ID e a ROLE (importante para o front saber quem é)
    const accessToken = this.jwtService.sign({ sub: user.id, role: user.role });
    
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '7d', secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret' },
    );

    // === SEGURANÇA ===
    // Removemos a senha do objeto antes de enviar para o frontend
    const { password, ...userWithoutPassword } = user;

    return { 
      accessToken, 
      refreshToken, 
      user: userWithoutPassword // Envia o usuário limpo, sem a senha
    };
  }
}
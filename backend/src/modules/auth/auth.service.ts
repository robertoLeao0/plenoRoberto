import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    // Busca o usuário incluindo a organização para termos o ID dela disponível
    const user = await this.usersService.findByEmailWithOrg(email);
    
    if (user && (await bcrypt.compare(pass, user.password))) {
      // Remove a senha do objeto retornado
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    // 1. Valida o usuário (email e senha)
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    // 2. CRIA O PAYLOAD DO TOKEN
    // AQUI ESTÁ A CORREÇÃO CRUCIAL: Adicionamos organizationId explicitamente
    const payload = { 
      email: user.email, 
      sub: user.id,
      role: user.role,
      // Se o usuário tiver organização, coloca o ID dela no token. Se não, vai null.
      organizationId: user.organizationId || null 
    };


    // 3. Assina os tokens
    const accessToken = this.jwtService.sign(payload);
    
    // Refresh token (opcional, mantendo sua lógica original)
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '7d', secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret' },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl, // Se existir no seu model
        organization: user.organization // Envia objeto completo pro frontend usar se quiser
      }
    };
  }
}
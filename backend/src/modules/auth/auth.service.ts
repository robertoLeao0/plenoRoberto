import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return user;
  }

  async login(payload: LoginDto) {
    const user = await this.validateUser(payload.email, payload.password);
    return this.generateTokens(user.id, user.role);
  }

  async refreshTokens(payload: RefreshTokenDto) {
    try {
      const decoded = await this.jwtService.verifyAsync(payload.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      });
      const user = await this.prisma.user.findUnique({ where: { id: decoded.sub } });
      if (!user) throw new UnauthorizedException('Usuário não encontrado');
      return this.generateTokens(user.id, user.role);
    } catch (err) {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  private generateTokens(userId: string, role: string) {
    const accessToken = this.jwtService.sign({ sub: userId, role });
    const refreshToken = this.jwtService.sign({ sub: userId }, {
      expiresIn: '7d',
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
    });
    return { accessToken, refreshToken };
  }
}

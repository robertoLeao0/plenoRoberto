import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'; 
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async validateUser(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isValid = await bcrypt.compare(pass, user.password); 

    if (!isValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return user;
  }

  async login(payload: LoginDto) {
    const user = await this.validateUser(payload.email, payload.password);

    const jwtPayload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      organizationId: user.organizationId 
    };

    const accessToken = this.jwtService.sign(jwtPayload);
    
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '7d', secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret' },
    );

    const { password, ...userWithoutPassword } = user;

    return { 
      accessToken, 
      refreshToken, 
      user: userWithoutPassword 
    };
  }
}
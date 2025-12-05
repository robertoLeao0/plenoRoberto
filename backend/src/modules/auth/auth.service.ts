import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return user;
  }

  async register(payload: RegisterDto) {
    const existing = await this.usersService.findByEmail(payload.email);
    if (existing) {
      throw new BadRequestException('E-mail já cadastrado');
    }
    const password = await bcrypt.hash(payload.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password,
        role: Role.SERVIDOR,
      },
    });
    const tokens = this.generateTokens(user.id, user.role);
    return { user: this.excludePassword(user), ...tokens };
  }

  async login(payload: LoginDto) {
    const user = await this.validateUser(payload.email, payload.password);
    const tokens = this.generateTokens(user.id, user.role);
    return { user: this.excludePassword(user), ...tokens };
  }

  async refreshTokens(payload: RefreshTokenDto) {
    try {
      const decoded = await this.jwtService.verifyAsync(payload.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      });
      const user = await this.prisma.user.findUnique({ where: { id: decoded.sub } });
      if (!user) throw new UnauthorizedException('Usuário não encontrado');
      const tokens = this.generateTokens(user.id, user.role);
      return { user: this.excludePassword(user), ...tokens };
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

  private excludePassword(user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;
    return rest;
  }
}

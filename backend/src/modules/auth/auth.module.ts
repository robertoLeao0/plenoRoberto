import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../database/prisma.service'; // <--- 1. IMPORTANTE: Importe o serviço do Prisma

@Module({
  imports: [
    UsersModule, 
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [
    AuthService, 
    JwtStrategy,
    PrismaService // <--- 2. IMPORTANTE: Adicione o PrismaService aqui nos providers
  ],
  controllers: [AuthController],
})
export class AuthModule {}
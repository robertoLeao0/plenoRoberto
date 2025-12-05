import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Placeholder guard leveraging passport-jwt strategy (strategy defined in AuthModule)
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest(err: unknown, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Token inválido');
    }
    return user;
  }
}

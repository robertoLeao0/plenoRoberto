import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Isso torna o Prisma disponível no app todo sem precisar importar sempre
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
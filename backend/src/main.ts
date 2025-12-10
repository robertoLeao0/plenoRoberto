import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express'; // <--- IMPORTANTE
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { join } from 'path'; // <--- IMPORTANTE

dotenv.config();

async function bootstrap() {
  // 1. Adicionamos o tipo <NestExpressApplication> para habilitar funções de arquivos estáticos
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.enableCors();
  app.setGlobalPrefix('api');

  // 2. CONFIGURAÇÃO PARA SERVIR AS FOTOS
  // Libera o acesso à pasta "uploads" na URL "/uploads"
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`API ouvindo na porta ${port}`);
}

bootstrap();
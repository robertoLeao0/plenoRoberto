import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';    // <--- Importe o FS
import * as path from 'path'; // <--- Importe o Path

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { organization: true },
    });
  }

  async update(id: string, data: { name?: string; avatarUrl?: string; password?: string }) {
    
    // === LÓGICA DE LIMPEZA DE IMAGEM ===
    // Se o usuário está enviando uma NOVA foto (data.avatarUrl existe)...
    if (data.avatarUrl) {
      // 1. Buscamos o usuário no banco para ver a foto ANTIGA
      const oldUser = await this.findOne(id);

      // 2. Se ele tinha foto antiga e não era nula
      if (oldUser && oldUser.avatarUrl) {
        try {
          // A URL no banco é tipo: http://localhost:3000/uploads/avatars/avatar-123.jpg
          // Precisamos pegar só o final: avatar-123.jpg
          const oldFilename = oldUser.avatarUrl.split('/').pop();

          // Montamos o caminho real no computador
          // Volta duas pastas (../../) para sair de modules/users e chegar na raiz
          const filePath = path.join(__dirname, '..', '..', '..', 'uploads', 'avatars', oldFilename);

          // 3. Verifica se o arquivo existe e APAGA
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); 
            console.log(`🗑️ Imagem antiga deletada: ${oldFilename}`);
          }
        } catch (error) {
          console.error("Erro ao tentar apagar imagem antiga:", error);
          // Não paramos o fluxo se der erro ao apagar, apenas logamos
        }
      }
    }

    // === ATUALIZAÇÃO NO BANCO (Normal) ===
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: { ...data },
    });
  }
}
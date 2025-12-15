import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import * as xlsx from 'xlsx'; // Para ler o Excel
import { MailerService } from '@nestjs-modules/mailer'; // Para enviar o email

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService,
  ) {}

  // === BUSCAR POR EMAIL ===
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });
  }

  // === BUSCAR UM PELO ID ===
  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { organization: true },
    });
  }

  // === BUSCAR TODOS COM FILTROS ===
  async findAll(filters?: { organizationId?: string | 'null' }) {
    const where: any = {};

    if (filters?.organizationId) {
      if (filters.organizationId === 'null') {
        where.organizationId = null; // Usuários sem organização
      } else {
        where.organizationId = filters.organizationId; // Usuários da organização X
      }
    }

    return this.prisma.user.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { organization: true },
    });
  }

  // === ATUALIZAR USUÁRIO (COM LOGICA DE AVATAR) ===
  async update(id: string, data: { name?: string; avatarUrl?: string; password?: string; role?: any }) {
    
    // 1. Se tem avatar novo, apaga o antigo
    if (data.avatarUrl) {
      const oldUser = await this.findOne(id);

      if (oldUser && oldUser.avatarUrl) {
        try {
          // Extrai o nome do arquivo da URL (ex: avatar-123.jpg)
          const oldFilename = oldUser.avatarUrl.split('/').pop();
          
          // Caminho: raiz_projeto/uploads/avatars/arquivo
          const filePath = path.join(process.cwd(), 'uploads', 'avatars', oldFilename);

          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Imagem antiga deletada: ${oldFilename}`);
          }
        } catch (error) {
          console.error("Erro ao apagar imagem antiga:", error);
        }
      }
    }

    // 2. Se tem senha nova, criptografa
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: { ...data },
    });
  }

  // === IMPORTAR VIA EXCEL ===
  async importUsers(file: Express.Multer.File, organizationId: string) {
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const logs = { success: 0, errors: [] };

    for (const row of rows as any[]) {
      try {
        const email = row['EMAIL']?.trim();
        const name = row['NOME']?.trim();
        const cpf = row['CPF']?.toString().replace(/\D/g, '');

        if (!email || !name) continue;

        const exists = await this.prisma.user.findFirst({
            where: { OR: [{ email }, { cpf: cpf || undefined }] }
        });

        if (exists) {
          logs.errors.push(`Já existe: ${email}`);
          continue;
        }

        // Gera senha aleatória
        const accessCode = Math.random().toString(36).slice(-6).toUpperCase();
        const passwordHash = await bcrypt.hash(accessCode, 10);

        await this.prisma.user.create({
          data: {
            name,
            email,
            cpf,
            password: passwordHash,
            role: 'USUARIO',
            organizationId: organizationId,
          },
        });

        // Envia Email
        await this.sendWelcomeEmail(email, name, accessCode);
        logs.success++;

      } catch (error) {
        logs.errors.push(`Erro no email ${row['EMAIL']}: ${error.message}`);
      }
    }
    return logs;
  }

  // === AUXILIAR: ENVIAR EMAIL ===
  private async sendWelcomeEmail(to: string, name: string, code: string) {
    try {
      await this.mailerService.sendMail({
        to,
        subject: 'Bem-vindo ao Pleno! Seu acesso chegou 🚀',
        html: `
          <div style="font-family: Arial, color: #333;">
            <h2>Olá, ${name}!</h2>
            <p>Seu cadastro foi realizado.</p>
            <p>Sua senha de acesso é:</p>
            <h1 style="color: #2563EB;">${code}</h1>
            <p>Acesse em: <a href="http://localhost:5173">pleno.sistema</a></p>
          </div>
        `,
      });
    } catch (e) {
      console.error('Erro ao enviar email:', e);
    }
  }

  // === ADICIONAR EM MASSA NA ORGANIZAÇÃO ===
  async addUsersToOrganization(organizationId: string, userIds: string[]) {
    return this.prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { organizationId },
    });
  }
}
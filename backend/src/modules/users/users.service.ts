import { Injectable, BadRequestException } from '@nestjs/common';
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

  // === 1. CRIAR USUÁRIO MANUALMENTE ===
  async create(data: any) {
    // Verifica duplicidade
    const userExists = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { cpf: data.cpf }],
      },
    });

    if (userExists) {
      throw new BadRequestException('Usuário já existe (E-mail ou CPF).');
    }

    // Gera uma senha aleatória se não for enviada, ou usa padrão '123456'
    // Aqui estou gerando uma aleatória para enviar por e-mail, igual na importação
    const plainPassword = Math.random().toString(36).slice(-6).toUpperCase();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Trata organizationId vazio
    const orgId = data.organizationId === '' ? null : data.organizationId;

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        cpf: data.cpf,
        role: data.role || 'USUARIO',
        organizationId: orgId,
        password: hashedPassword,
      },
    });

    // Envia o e-mail de boas-vindas
    await this.sendWelcomeEmail(user.email, user.name, plainPassword);

    return user;
  }

  // === 2. BUSCAR POR EMAIL ===
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });
  }

  // === 3. BUSCAR UM PELO ID ===
  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { organization: true },
    });
  }

  // === 4. BUSCAR TODOS COM FILTROS ===
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

  // === 5. BUSCAR POTENCIAIS GESTORES (Para o Dropdown de Org) ===
  async findPotentialManagers() {
    return this.prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'GESTOR_ORGANIZACAO'] }, // Apenas Admins e Gestores
      },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
  }

  // === 6. ATUALIZAR USUÁRIO (COM LOGICA DE AVATAR) ===
  async update(id: string, data: { name?: string; avatarUrl?: string; password?: string; role?: any }) {
    
    // Se tem avatar novo, apaga o antigo do disco
    if (data.avatarUrl) {
      const oldUser = await this.findOne(id);

      if (oldUser && oldUser.avatarUrl) {
        try {
          // Extrai o nome do arquivo da URL (ex: avatar-123.jpg)
          const oldFilename = oldUser.avatarUrl.split('/').pop();
          
          if (oldFilename) {
             const filePath = path.join(process.cwd(), 'uploads', 'avatars', oldFilename);
             if (fs.existsSync(filePath)) {
               fs.unlinkSync(filePath);
               console.log(`🗑️ Imagem antiga deletada: ${oldFilename}`);
             }
          }
        } catch (error) {
          console.error("Erro ao apagar imagem antiga:", error);
        }
      }
    }

    // Se tem senha nova, criptografa
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: { ...data },
    });
  }

  // === 7. IMPORTAR VIA EXCEL ===
  async importUsers(file: Express.Multer.File, organizationId: string) {
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const logs = { success: 0, errors: [] };

    for (const row of rows as any[]) {
      try {
        const email = row['EMAIL']?.trim();
        const name = row['NOME']?.trim();
        const phone = row['TELEFONE']?.toString(); // Adicionado leitura de telefone
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
            phone,
            password: passwordHash,
            role: 'USUARIO',
            organizationId: organizationId || null,
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

  // === 8. AUXILIAR: ENVIAR EMAIL ===
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

  // === 9. ADICIONAR EM MASSA NA ORGANIZAÇÃO ===
  async addUsersToOrganization(organizationId: string, userIds: string[]) {
    return this.prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { organizationId },
    });
  }
}
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';
import * as xlsx from 'xlsx';
import { MailerService } from '@nestjs-modules/mailer';
import { ActionStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client'; // Importação para tipagem do Prisma

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService,
  ) { }


  // Busca simples por email
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { organization: true }
    });
  }

  // NOVO: Busca específica para o Login (garante que traga organizationId e dados da org)
  async findByEmailWithOrg(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        organization: true, // IMPORTANTE: Traz os dados da organização
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        organization: true,
        actionLogs: {
          where: { status: ActionStatus.APROVADO },
          select: { pointsAwarded: true }
        }
      }
    });

    if (!user) return null;
    const totalPoints = user.actionLogs.reduce((acc, log) => {
      return acc + (log.pointsAwarded || 0);
    }, 0);
    return {
      ...user,
      totalPoints,
    };
  }


  // === 1. CRIAR USUÁRIO MANUALMENTE ===
  async create(data: any) {
  const userExists = await this.prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { cpf: data.cpf }] },
  });

  if (userExists) throw new BadRequestException('Usuário já existe (E-mail ou CPF).');

  const cleanCpf = data.cpf ? data.cpf.replace(/\D/g, '') : null;
  // Se tiver CPF, usa como senha inicial. Se não, gera aleatória.
  const plainPassword = cleanCpf || randomBytes(4).toString('hex').toUpperCase();

  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  const orgId = (!data.organizationId || data.organizationId === 'null') ? null : data.organizationId;

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

  // await this.sendWelcomeEmail(user.email, user.name, cleanCpf ? 'SEU_CPF' : plainPassword);

  return user;
}


  // RECUPERAÇÃO DE SENHA

  async updatePassword(userId: string, data: any) {
  const { currentPassword, newPassword, confirmPassword } = data;
  if (newPassword !== confirmPassword) {
    throw new BadRequestException('A nova senha e a confirmação não coincidem.');
  }
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundException('Usuário não encontrado.');
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    throw new BadRequestException('A senha atual está incorreta.');
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  return this.prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword
    },
  });
}



  // === 2. IMPORTAR VIA EXCEL (COM TOKEN) ===
  async importUsers(file: Express.Multer.File) {
  const workbook = xlsx.read(file.buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const logs = { success: 0, errors: [] as string[] };
  const orgCache = new Map<string, string>();

  for (const row of rows as any[]) {
    try {
      const name = row['NOME'] || row['Nome'];
      const email = row['EMAIL'] || row['Email'];
      const cpfRaw = row['CPF'] || row['Cpf'];
      const tokenOrg = row['TOKEN'] || row['Token'];

      // Validação básica
      if (!email || !name || !cpfRaw || !tokenOrg) {
        logs.errors.push(`Linha ignorada (Falta dados): ${email || 'Sem email'}`);
        continue;
      }

      const cpf = String(cpfRaw).replace(/\D/g, '');
      const phone = row['TELEFONE'] ? String(row['TELEFONE']) : null;

      // 2. Achar Organização pelo Token
      let organizationId = orgCache.get(tokenOrg);

      if (!organizationId) {
        const org = await this.prisma.organization.findUnique({
          where: { importToken: String(tokenOrg).trim() }
        });

        if (!org) {
          logs.errors.push(`Token de organização inválido na linha de ${email}: ${tokenOrg}`);
          continue;
        }
        organizationId = org.id;
        orgCache.set(tokenOrg, org.id);
      }

      // 3. Verifica duplicidade
      const exists = await this.prisma.user.findFirst({
        where: { OR: [{ email }, { cpf }] }
      });

      if (exists) {
        logs.errors.push(`Usuário ${email} ou CPF ${cpf} já existe.`);
        continue;
      }

      // 4. Senha = CPF
      const passwordHash = await bcrypt.hash(cpf, 10);

      // 5. Criar Usuário
      await this.prisma.user.create({
        data: {
          name,
          email,
          cpf,
          phone,
          password: passwordHash,
          role: 'USUARIO',
          organizationId: organizationId,
        },
      });

      // // 6. Enviar Email
      // await this.sendWelcomeEmail(email, name, 'SEU_CPF');
      // logs.success++;

    } catch (error: any) {
      logs.errors.push(`Erro fatal na linha ${row['EMAIL']}: ${error.message}`);
    }
  }
  return logs;
}

  // === 3. LISTAR TODOS (Com Filtro Inteligente - Admin vs Gestor) ===
  // Este método substitui o seu findAll anterior para ser mais flexível
  async findAll(currentUser: any, roleFilter ?: string) {
  const where: Prisma.UserWhereInput = {};

  // Filtro por Cargo (opcional)
  if (roleFilter) {
    where.role = roleFilter as any;
  }

  // Segurança: Gestor vê apenas sua organização
  if (currentUser && currentUser.role === 'GESTOR_ORGANIZACAO') {
    if (currentUser.organizationId) {
      where.organizationId = currentUser.organizationId;
    } else {
      return []; // Segurança
    }
  }

  return this.prisma.user.findMany({
    where,
    orderBy: { name: 'asc' },
    include: { organization: true } // Sempre traz a org para exibir no front
  });
}

  // === OUTROS MÉTODOS ===

  async findPotentialManagers() {
  return this.prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'GESTOR_ORGANIZACAO'] } },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' }
  });
}

  async addUsersToOrganization(organizationId: string, userIds: string[]) {
  return this.prisma.user.updateMany({
    where: { id: { in: userIds } },
    data: { organizationId }
  });
}

  async update(id: string, data: any) {
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  return this.prisma.user.update({ where: { id }, data: { ...data } });
}

  async remove(id: string) {
  return this.prisma.user.delete({ where: { id } });
}

  // // === EMAIL ===
  // private async sendWelcomeEmail(to: string, name: string, passwordCredential: string) {
  //   const passwordDisplay = passwordCredential === 'SEU_CPF' ? 'Seu CPF (somente números)' : passwordCredential;
  //   const htmlContent = getWelcomeEmailTemplate(name, to, passwordDisplay);
  //   try {
  //     await this.mailerService.sendMail({
  //       to,
  //       subject: 'Bem-vindo ao Sistema da Pleno! Seu acesso foi criado',
  //       html: htmlContent,
  //     });
  //   } catch (e) {
  //     console.error('Erro ao enviar email:', e);
  //   }
  // }
}
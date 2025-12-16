import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import * as xlsx from 'xlsx'; 
import { MailerService } from '@nestjs-modules/mailer';
import { randomBytes } from 'crypto'; 

// 👇 IMPORTANTE: Importe o template aqui
import { getWelcomeEmailTemplate } from '../../templates/welcome.template';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService,
  ) {}

  // ... (Mantenha os métodos create, findByEmail, findOne, findAll, findPotentialManagers, update iguais) ...
  // ... (Não mudei nada neles para economizar espaço aqui, copie do anterior se precisar) ...

  // Vou colocar apenas os métodos que usam o email e a importação completa:

  // === 1. CRIAR USUÁRIO MANUALMENTE ===
  async create(data: any) {
    const userExists = await this.prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { cpf: data.cpf }] },
    });

    if (userExists) throw new BadRequestException('Usuário já existe (E-mail ou CPF).');

    // Senha: Se tem CPF usa ele limpo, senão gera aleatória segura
    const cleanCpf = data.cpf ? data.cpf.replace(/\D/g, '') : null;
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

    // Envia o e-mail usando o novo template
    await this.sendWelcomeEmail(user.email, user.name, cleanCpf ? 'SEU_CPF' : plainPassword);

    return user;
  }

  // === 7. IMPORTAR VIA EXCEL ===
  async importUsers(file: Express.Multer.File, organizationId: string) {
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const logs = { success: 0, errors: [] };

    for (const row of rows as any[]) {
      try {
        const name = row['NOME'] || row['Nome'] || row['name'];
        const email = row['EMAIL'] || row['Email'] || row['email'];
        if (!email || !name) continue;

        const phoneRaw = row['TELEFONE'] || row['Telefone'] || row['phone'] || row['celular'];
        const cpfRaw = row['CPF'] || row['Cpf'] || row['cpf'];
        const roleRaw = row['PERFIL'] || row['Perfil'] || row['role'] || 'USUARIO'; 

        const cpf = cpfRaw ? String(cpfRaw).replace(/\D/g, '') : null;
        const phone = phoneRaw ? String(phoneRaw) : null;

        // Role
        let role = 'USUARIO';
        if (String(roleRaw).toUpperCase().includes('GESTOR')) role = 'GESTOR_ORGANIZACAO';
        else if (String(roleRaw).toUpperCase().includes('ADMIN')) role = 'ADMIN';

        // Verifica existência
        const exists = await this.prisma.user.findFirst({
            where: { OR: [{ email }, { cpf: cpf || '00000000000' }] }
        });

        if (exists) {
          if (!exists.organizationId) {
             await this.prisma.user.update({ where: { id: exists.id }, data: { organizationId } });
             logs.success++;
          } else {
             logs.errors.push(`Usuário ${email} já pertence a outra organização.`);
          }
          continue;
        }

        // Senha
        const plainPassword = cpf || randomBytes(4).toString('hex').toUpperCase();
        const passwordHash = await bcrypt.hash(plainPassword, 10);

        await this.prisma.user.create({
          data: {
            name, email, cpf, phone,
            password: passwordHash,
            role: role as any,
            organizationId: organizationId || null,
          },
        });

        // Envia Email
        await this.sendWelcomeEmail(email, name, cpf ? 'SEU_CPF' : plainPassword);
        logs.success++;

      } catch (error) {
        logs.errors.push(`Erro na linha ${row['EMAIL']}: ${error.message}`);
      }
    }
    return logs;
  }

  // === MÉTODOS AUXILIARES (Find, Update, etc... mantenha os que já tem) ===
  async findByEmail(email: string) { return this.prisma.user.findUnique({ where: { email }, include: { organization: true } }); }
  async findOne(id: string) { return this.prisma.user.findUnique({ where: { id }, include: { organization: true } }); }
  async findAll(filters?: any) { return this.prisma.user.findMany({ where: filters?.organizationId ? { organizationId: filters.organizationId === 'null' ? null : filters.organizationId } : {}, orderBy: { name: 'asc' }, include: { organization: true } }); }
  async findPotentialManagers() { return this.prisma.user.findMany({ where: { role: { in: ['ADMIN', 'GESTOR_ORGANIZACAO'] } }, select: { id: true, name: true, email: true, role: true }, orderBy: { name: 'asc' } }); }
  async addUsersToOrganization(organizationId: string, userIds: string[]) { return this.prisma.user.updateMany({ where: { id: { in: userIds } }, data: { organizationId } }); }
  
  async update(id: string, data: any) {
    if (data.avatarUrl) { /* Lógica de apagar foto antiga */ } 
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    return this.prisma.user.update({ where: { id }, data: { ...data } });
  }

  // ======================================================
  // EMAIL - AGORA USA O TEMPLATE EXTERNO
  // ======================================================
  private async sendWelcomeEmail(to: string, name: string, passwordCredential: string) {
    
    const passwordDisplay = passwordCredential === 'SEU_CPF' 
      ? 'Seu CPF (somente números)' 
      : passwordCredential;

    // 👇 Chamamos a função do arquivo separado
    const htmlContent = getWelcomeEmailTemplate(name, to, passwordDisplay);

    try {
      await this.mailerService.sendMail({
        to,
        subject: 'Bem-vindo ao Sistema da Pleno! Seu acesso foi criado',
        html: htmlContent, // HTML Limpo aqui
      });
    } catch (e) {
      console.error('Erro ao enviar email:', e);
    }
  }
}
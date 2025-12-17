import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';
import * as xlsx from 'xlsx'; 
import { MailerService } from '@nestjs-modules/mailer';
import { randomBytes } from 'crypto'; 
import { getWelcomeEmailTemplate } from '../../templates/welcome.template';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService,
  ) {}

  // === 1. CRIAR USUÁRIO MANUALMENTE ===
  async create(data: any) {
    const userExists = await this.prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { cpf: data.cpf }] },
    });

    if (userExists) throw new BadRequestException('Usuário já existe (E-mail ou CPF).');

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

    await this.sendWelcomeEmail(user.email, user.name, cleanCpf ? 'SEU_CPF' : plainPassword);

    return user;
  }

  // === 2. IMPORTAR VIA EXCEL (COM TOKEN) ===
  async importUsers(file: Express.Multer.File) {
    /* Lê o arquivo buffer
    */
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const logs = { success: 0, errors: [] as string[] };

    // Cache simples para não buscar a mesma org no banco mil vezes se o token for igual
    const orgCache = new Map<string, string>(); 

    for (const row of rows as any[]) {
      try {
        // 1. Ler Colunas
        const name = row['NOME'] || row['Nome'];
        const email = row['EMAIL'] || row['Email'];
        const cpfRaw = row['CPF'] || row['Cpf'];
        const tokenOrg = row['TOKEN'] || row['Token']; // <--- LÊ O TOKEN DA PLANILHA

        // Validação básica
        if (!email || !name || !cpfRaw || !tokenOrg) {
          logs.errors.push(`Linha ignorada (Falta Nome, Email, CPF ou Token): ${email || 'Sem email'}`);
          continue;
        }

        const cpf = String(cpfRaw).replace(/\D/g, ''); // Limpa CPF
        const phone = row['TELEFONE'] ? String(row['TELEFONE']) : null;

        // 2. Achar Organização pelo Token
        let organizationId = orgCache.get(tokenOrg);

        if (!organizationId) {
          const org = await this.prisma.organization.findUnique({
            where: { importToken: String(tokenOrg).trim() } // Busca pelo campo importToken
          });
          
          if (!org) {
            logs.errors.push(`Token de organização inválido na linha de ${email}: ${tokenOrg}`);
            continue;
          }
          organizationId = org.id;
          orgCache.set(tokenOrg, org.id); // Salva no cache
        }

        // 3. Verifica se usuário já existe
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
            role: 'USUARIO', // Sempre Usuário Comum via planilha
            organizationId: organizationId, // Vincula à Org do Token
          },
        });

        // 6. Enviar Email
        await this.sendWelcomeEmail(email, name, 'SEU_CPF');
        logs.success++;

      } catch (error: any) {
        logs.errors.push(`Erro fatal na linha ${row['EMAIL']}: ${error.message}`);
      }
    }
    return logs;
  }

  // === MÉTODOS AUXILIARES ===
  async findByEmail(email: string) { return this.prisma.user.findUnique({ where: { email }, include: { organization: true } }); }
  async findOne(id: string) { return this.prisma.user.findUnique({ where: { id }, include: { organization: true } }); }
  async findAll(filters?: any) { return this.prisma.user.findMany({ where: filters?.organizationId ? { organizationId: filters.organizationId === 'null' ? null : filters.organizationId } : {}, orderBy: { name: 'asc' }, include: { organization: true } }); }
  async findPotentialManagers() { return this.prisma.user.findMany({ where: { role: { in: ['ADMIN', 'GESTOR_ORGANIZACAO'] } }, select: { id: true, name: true, email: true, role: true }, orderBy: { name: 'asc' } }); }
  async addUsersToOrganization(organizationId: string, userIds: string[]) { return this.prisma.user.updateMany({ where: { id: { in: userIds } }, data: { organizationId } }); }
  
  async update(id: string, data: any) {
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    return this.prisma.user.update({ where: { id }, data: { ...data } });
  }

  // === EMAIL ===
  private async sendWelcomeEmail(to: string, name: string, passwordCredential: string) {
    const passwordDisplay = passwordCredential === 'SEU_CPF' ? 'Seu CPF (somente números)' : passwordCredential;
    const htmlContent = getWelcomeEmailTemplate(name, to, passwordDisplay);
    try {
      await this.mailerService.sendMail({
        to,
        subject: 'Bem-vindo ao Sistema da Pleno! Seu acesso foi criado',
        html: htmlContent,
      });
    } catch (e) {
      console.error('Erro ao enviar email:', e);
    }
  }
}
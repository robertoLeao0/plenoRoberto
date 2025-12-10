import { PrismaClient, Role, OrganizationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o seed...');

  // 1. Criar a Organização "Pleno" (A dona do sistema)
  const orgPleno = await prisma.organization.upsert({
    where: { id: 'org-pleno-system' }, // ID fixo para não duplicar
    update: {}, // Se já existir, não faz nada
    create: {
      id: 'org-pleno-system',
      name: 'Pleno Tecnologia',
      description: 'Matriz do Sistema',
      type: OrganizationType.SYSTEM, // Define como a org principal
      active: true,
    },
  });

  console.log(`🏢 Organização criada: ${orgPleno.name}`);

  // 2. Criar seu Usuário ADMIN vinculado à Pleno
  const passwordHash = await bcrypt.hash('123456', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'roberto@pleno.com' }, // Seu e-mail de login
    update: {
      password: passwordHash, // Atualiza a senha se rodar de novo
      role: Role.ADMIN,       // Garante o cargo de Admin
      organizationId: orgPleno.id, // Garante o vínculo com a Pleno
    },
    create: {
      name: 'Roberto Admin',
      email: 'roberto@pleno.com',
      password: passwordHash,
      role: Role.ADMIN,            // Cargo Máximo
      organizationId: orgPleno.id, // Pertence à Pleno
      avatarUrl: null,
    },
  });

  console.log(`👤 Usuário criado: ${adminUser.name}`);
  console.log(`📧 Login: roberto@pleno.com`);
  console.log(`🔑 Senha: 123456`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
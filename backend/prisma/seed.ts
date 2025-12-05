import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456', 10);
  await prisma.user.createMany({
    data: [
      { name: 'Admin', email: 'admin@pleno.com', password, role: 'ADMIN' },
      { name: 'Gestor', email: 'gestor@pleno.com', password, role: 'GESTOR' },
      { name: 'Servidor', email: 'servidor@pleno.com', password, role: 'SERVIDOR' },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(() => console.log('Seed concluído'))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

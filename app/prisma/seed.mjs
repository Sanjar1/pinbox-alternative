import { PrismaClient } from '@prisma/client';
import { randomBytes, scryptSync } from 'node:crypto';

const prisma = new PrismaClient();

function hashPassword(plainText) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(plainText, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { id: 'demo-tenant' },
    update: { name: 'Demo Company' },
    create: {
      id: 'demo-tenant',
      name: 'Demo Company',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {
      password: hashPassword('change-me'),
      role: 'OWNER',
      tenantId: tenant.id,
    },
    create: {
      email: 'admin@demo.com',
      password: hashPassword('change-me'),
      role: 'OWNER',
      tenantId: tenant.id,
    },
  });

  console.log('Seeded successfully:', {
    tenantId: tenant.id,
    userEmail: user.email,
    defaultPassword: 'change-me',
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


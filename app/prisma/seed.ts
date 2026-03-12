import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Clean up
    await prisma.platformLocationLink.deleteMany();
    await prisma.storeMasterProfile.deleteMany();
    await prisma.store.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();

    const tenant = await prisma.tenant.create({
      data: {
        name: 'Demo Company',
      },
    });

    const user = await prisma.user.create({
      data: {
        email: 'admin@demo.com',
        password: 'password123',
        role: 'OWNER',
        tenantId: tenant.id,
      },
    });

    const store = await prisma.store.create({
      data: {
        name: 'Demo Store 1',
        address: '123 Main St, Moscow',
        tenantId: tenant.id,
      },
    });
    
    // Create Master Profile
    await prisma.storeMasterProfile.create({
      data: {
        storeId: store.id,
        name: 'Demo Store 1',
        address: '123 Main St, Moscow',
        phone: '+79991234567',
        description: 'Best demo store in town',
        lat: 55.7558,
        lng: 37.6173,
      }
    });

    console.log('Seeded successfully:', { tenant, user, store });
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
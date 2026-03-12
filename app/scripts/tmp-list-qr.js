const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const rows = await prisma.qRCode.findMany({
    take: 20,
    orderBy: { createdAt: 'asc' },
    include: { store: { select: { id: true, name: true } } },
  });
  console.log(JSON.stringify(rows.map((r) => ({
    qrId: r.id,
    slug: r.slug,
    storeId: r.storeId,
    storeName: r.store.name,
  })), null, 2));
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

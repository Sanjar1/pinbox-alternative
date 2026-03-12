const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const slug = '523da2';
  const qr = await prisma.qRCode.findUnique({ where: { slug }, include: { store: true } });
  if (!qr) throw new Error('QR not found');

  const count = await prisma.feedback.count({ where: { storeId: qr.storeId } });
  const latest = await prisma.feedback.findMany({
    where: { storeId: qr.storeId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      rating: true,
      comment: true,
      contact: true,
      status: true,
      createdAt: true,
      deviceHash: true,
      ipHash: true,
      userAgentHash: true,
    },
  });

  console.log(JSON.stringify({
    slug,
    storeId: qr.storeId,
    storeName: qr.store.name,
    feedbackCount: count,
    latest,
  }, null, 2));

  await prisma.$disconnect();
})();

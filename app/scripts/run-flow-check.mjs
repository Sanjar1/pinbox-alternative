import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const prisma = new PrismaClient();

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

async function createSessionForAdmin() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@demo.com' } });
  if (!user) throw new Error('admin user not found');

  const token = randomBytes(32).toString('hex');
  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  return { token, user };
}

async function getActionId() {
  const manifestPath = '.next/dev/server/app/[slug]/page/server-reference-manifest.json';
  const raw = await readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(raw);
  const entries = Object.entries(manifest.node || {});
  const found = entries.find(([, value]) => value?.exportedName === 'submitFeedback');
  if (!found) throw new Error('submitFeedback action id not found');
  return found[0];
}

async function main() {
  const { token } = await createSessionForAdmin();

  const store = await prisma.store.findFirst({
    where: { name: 'Сырная лавка' },
    include: { qrCodes: true },
  });
  if (!store || store.qrCodes.length === 0) throw new Error('store/qr not found');

  const slug = store.qrCodes[0].slug;
  const cookie = `pinbox_session=${token}`;

  const storesResp = await fetch('http://localhost:3000/admin/stores', {
    headers: { Cookie: cookie },
  });
  const storesHtml = await storesResp.text();

  const importResp = await fetch('http://localhost:3000/admin/stores/import', {
    headers: { Cookie: cookie },
  });
  const importHtml = await importResp.text();

  const qrResp = await fetch(`http://localhost:3000/${slug}`);
  const qrHtml = await qrResp.text();

  const before = await prisma.feedback.count({ where: { storeId: store.id } });
  const actionId = await getActionId();

  const body = new URLSearchParams({
    storeId: store.id,
    rating: '5',
    comment: 'Automated verification feedback',
    contact: 'qa@example.com',
  });

  const actionResp = await fetch(`http://localhost:3000/${slug}`, {
    method: 'POST',
    headers: {
      Cookie: cookie,
      'Next-Action': actionId,
      Accept: 'text/x-component',
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'http://localhost:3000',
    },
    body,
  });

  await new Promise((resolve) => setTimeout(resolve, 300));
  const after = await prisma.feedback.count({ where: { storeId: store.id } });

  console.log('stores_status', storesResp.status);
  console.log('stores_contains', storesHtml.includes('Stores'));
  console.log('import_status', importResp.status);
  console.log('import_contains', importHtml.includes('Import Stores from CSV'));
  console.log('qr_status', qrResp.status);
  console.log('qr_contains', qrHtml.includes('How was your visit?'));
  console.log('action_status', actionResp.status);
  console.log('feedback_before', before);
  console.log('feedback_after', after);
  console.log('feedback_incremented', after > before);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

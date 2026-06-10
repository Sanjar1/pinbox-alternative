import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateUniqueSlug } from '@/lib/qr';

const MISSING_STORES = [
  { name: 'Дубовый', address: '' },
  { name: 'Келес', address: '' },
  { name: 'Самарканд', address: '' },
  { name: 'Хасанбой', address: '' },
  { name: 'Фарход', address: '' },
  { name: 'Торговый Центр', address: '' },
];

export async function POST(req: NextRequest) {
  // Env-based key, fail closed: with ADMIN_DIAG_KEY unset this one-off route
  // is disabled. The previous hardcoded literal was committed to git.
  const expected = process.env.ADMIN_DIAG_KEY;
  const key = req.headers.get('x-admin-key') ?? req.nextUrl.searchParams.get('key');
  if (!expected || key !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get tenantId from an existing store
  const existingStore = await prisma.store.findFirst({ select: { tenantId: true } });
  if (!existingStore) {
    return NextResponse.json({ error: 'No existing stores found to derive tenantId' }, { status: 500 });
  }
  const { tenantId } = existingStore;

  const created: { name: string; slug: string; storeId: string }[] = [];
  const skipped: { name: string; reason: string }[] = [];

  for (const { name, address } of MISSING_STORES) {
    const existing = await prisma.store.findFirst({ where: { name, tenantId } });
    if (existing) {
      skipped.push({ name, reason: 'Store already exists' });
      continue;
    }

    const slug = await generateUniqueSlug();
    const store = await prisma.store.create({
      data: {
        name,
        address,
        tenantId,
        qrCodes: { create: { name: 'Default', slug } },
        masterProfile: { create: { name, address } },
      },
      select: { id: true },
    });

    created.push({ name, slug, storeId: store.id });
  }

  return NextResponse.json({ created, skipped, tenantId });
}

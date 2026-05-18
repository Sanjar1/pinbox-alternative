import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkApiKey } from '@/lib/report-builder';

const SPECS = [
  { name: 'Глоток Юнусабад', slug: '4c5350' },
  { name: 'Глоток Панельный', slug: 'e96943' },
];

export async function POST(req: NextRequest) {
  if (!checkApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let clearFeedback = true;
  try {
    const body = await req.json();
    if (typeof body?.clearFeedback === 'boolean') {
      clearFeedback = body.clearFeedback;
    }
  } catch {
    // Keep default when request body is empty or invalid JSON.
  }

  const tenant = await prisma.store.findFirst({ select: { tenantId: true } });
  if (!tenant) {
    return NextResponse.json({ error: 'No stores found' }, { status: 500 });
  }

  const summary: {
    clearedFeedback: number;
    actions: Array<{ slug: string; action: string; store: string }>;
  } = {
    clearedFeedback: 0,
    actions: [],
  };

  await prisma.$transaction(async (tx) => {
    if (clearFeedback) {
      const deleted = await tx.feedback.deleteMany({});
      summary.clearedFeedback = deleted.count;
    }

    for (const spec of SPECS) {
      const qr = await tx.qRCode.findUnique({
        where: { slug: spec.slug },
        include: { store: true },
      });

      if (qr) {
        if (qr.store.name !== spec.name) {
          await tx.store.update({
            where: { id: qr.storeId },
            data: {
              name: spec.name,
              masterProfile: {
                upsert: {
                  create: { name: spec.name, address: qr.store.address ?? '' },
                  update: { name: spec.name },
                },
              },
            },
          });
          summary.actions.push({ slug: spec.slug, action: 'renamed-existing-store', store: spec.name });
        } else {
          summary.actions.push({ slug: spec.slug, action: 'kept-existing', store: spec.name });
        }
        continue;
      }

      const existingStore = await tx.store.findFirst({
        where: {
          tenantId: tenant.tenantId,
          name: spec.name,
        },
      });

      if (existingStore) {
        await tx.qRCode.create({
          data: {
            name: 'Default',
            slug: spec.slug,
            storeId: existingStore.id,
          },
        });
        summary.actions.push({ slug: spec.slug, action: 'created-qr-for-existing-store', store: spec.name });
        continue;
      }

      await tx.store.create({
        data: {
          name: spec.name,
          address: '',
          tenantId: tenant.tenantId,
          qrCodes: {
            create: {
              name: 'Default',
              slug: spec.slug,
            },
          },
          masterProfile: {
            create: {
              name: spec.name,
              address: '',
            },
          },
        },
      });
      summary.actions.push({ slug: spec.slug, action: 'created-store-and-qr', store: spec.name });
    }
  });

  return NextResponse.json(summary);
}

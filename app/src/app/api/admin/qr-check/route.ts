import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// One-time migration runner: adds archivedAt column to Store table
export async function POST(req: NextRequest) {
  const key = req.headers.get('x-admin-key') ?? req.nextUrl.searchParams.get('key');
  if (key !== 'pinbox-qr-diag-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3)`);
    return NextResponse.json({ success: true, message: 'archivedAt column added to Store table' });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const key = req.headers.get('x-admin-key') ?? req.nextUrl.searchParams.get('key');
  if (key !== 'pinbox-qr-diag-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const qrCodes = await prisma.qRCode.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      storeId: true,
      scans: true,
      createdAt: true,
      store: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const stores = await prisma.store.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      action: { in: ['STORE_DELETE', 'QR_DELETE', 'STORE_IMPORT_CSV', 'STORE_CREATE'] },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, action: true, details: true, createdAt: true },
  });

  // Stores without QR codes
  const storeIds = new Set(qrCodes.map((q) => q.storeId));
  const storesWithoutQr = stores.filter((s) => !storeIds.has(s.id));

  return NextResponse.json({
    qrCodes,
    stores,
    storesWithoutQr,
    auditLogs,
    totalQrCodes: qrCodes.length,
    totalStores: stores.length,
  });
}

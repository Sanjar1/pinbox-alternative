import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkApiKey } from '@/lib/report-builder';

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export async function GET(req: Request) {
  if (!checkApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const from = parseDate(url.searchParams.get('from'));
  const to = parseDate(url.searchParams.get('to'));

  const feedbackWhere: { createdAt?: { gte?: Date; lt?: Date } } = {};
  if (from || to) {
    feedbackWhere.createdAt = {};
    if (from) feedbackWhere.createdAt.gte = from;
    if (to) feedbackWhere.createdAt.lt = to;
  }

  const stores = await prisma.store.findMany({
    where: { archivedAt: null },
    select: {
      id: true,
      name: true,
      qrCodes: { select: { scans: true } },
      feedbacks: {
        where: feedbackWhere.createdAt ? { createdAt: feedbackWhere.createdAt } : undefined,
        select: { rating: true, createdAt: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const rows = stores.map((store) => {
    const votes = store.feedbacks;
    const voteCount = votes.length;
    const averageRating = voteCount > 0
      ? Math.round((votes.reduce((sum, f) => sum + f.rating, 0) / voteCount) * 10) / 10
      : 0;
    const latestFeedbackAt = voteCount > 0
      ? votes.reduce((latest, f) => (f.createdAt > latest ? f.createdAt : latest), votes[0].createdAt)
      : null;
    const qrScans = store.qrCodes.reduce((sum, qr) => sum + qr.scans, 0);

    return {
      storeId: store.id,
      storeName: store.name,
      voteCount,
      averageRating,
      latestFeedbackAt,
      qrScans,
    };
  });

  return NextResponse.json({ count: rows.length, rows });
}

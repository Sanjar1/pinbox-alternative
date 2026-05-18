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

  const where: {
    createdAt?: {
      gte?: Date;
      lt?: Date;
    };
  } = {};

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lt = to;
  }

  const feedbacks = await prisma.feedback.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      rating: true,
      comment: true,
      contact: true,
      status: true,
      createdAt: true,
      store: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return NextResponse.json({
    count: feedbacks.length,
    items: feedbacks,
  });
}

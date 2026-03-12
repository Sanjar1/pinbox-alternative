import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ingestMapReview } from '@/lib/reviews';

type IngestRequestBody = {
  source?: string;
  externalReviewId?: string;
  reviewUrl?: string;
  reviewText?: string;
  placeId?: string;
  storeId?: string;
  authorName?: string;
  rating?: number;
  reviewTime?: string;
  chatId?: string;
  rawPayload?: unknown;
};

function isAuthorized(request: NextRequest): boolean {
  const configuredKey = process.env.REVIEWS_INGEST_API_KEY?.trim();
  if (!configuredKey) {
    return true;
  }

  const authHeader = request.headers.get('authorization') ?? '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const headerKey = request.headers.get('x-reviews-api-key')?.trim() ?? '';

  return bearer === configuredKey || headerKey === configuredKey;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: IngestRequestBody;
  try {
    body = (await request.json()) as IngestRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (body.storeId) {
    const store = await prisma.store.findUnique({
      where: { id: body.storeId },
      select: { id: true },
    });
    if (!store) {
      return NextResponse.json({ error: 'storeId not found' }, { status: 400 });
    }
  }

  try {
    const result = await ingestMapReview({
      source: body.source ?? '',
      externalReviewId: body.externalReviewId ?? '',
      reviewUrl: body.reviewUrl ?? '',
      reviewText: body.reviewText ?? '',
      placeId: body.placeId,
      storeId: body.storeId,
      authorName: body.authorName,
      rating: body.rating,
      reviewTime: body.reviewTime,
      chatId: body.chatId,
      rawPayload: body.rawPayload,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown ingest error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

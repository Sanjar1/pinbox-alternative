import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

export type ReviewSource = 'YANDEX' | 'TWOGIS';
export type ReviewStatus = 'NEW' | 'NOTIFIED' | 'REPLY_OPENED' | 'DONE';

export type IngestMapReviewInput = {
  source: ReviewSource | string;
  externalReviewId: string;
  reviewUrl: string;
  reviewText: string;
  placeId?: string;
  storeId?: string;
  authorName?: string;
  rating?: number;
  reviewTime?: string | Date;
  chatId?: string;
  rawPayload?: unknown;
};

type TelegramSendResult = {
  ok: boolean;
  chatId?: string;
  messageId?: string;
  error?: string;
};

const REVIEW_CALLBACK_PREFIX = 'rv';

function normalizeSource(source: string): ReviewSource {
  const normalized = source.trim().toUpperCase();
  if (normalized === 'YANDEX' || normalized === 'TWOGIS') {
    return normalized;
  }
  throw new Error('source must be YANDEX or TWOGIS');
}

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

function parseDate(value: string | Date | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed;
}

function parseAllowedUserIds(): Set<string> {
  const raw = process.env.TELEGRAM_ALLOWED_USER_IDS ?? '';
  return new Set(
    raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function getDefaultChatId(): string {
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!chatId) {
    throw new Error('TELEGRAM_CHAT_ID is required to send map review notifications');
  }
  return chatId;
}

function getTelegramBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is required');
  }
  return token;
}

function buildReviewMessage(params: {
  source: ReviewSource;
  storeName?: string;
  authorName?: string;
  rating?: number;
  reviewText: string;
  reviewTime?: Date;
  reviewId: string;
}): string {
  const reviewTimeText = params.reviewTime ? params.reviewTime.toISOString() : '-';
  const ratingText = Number.isFinite(params.rating) ? `${params.rating}/5` : '-';

  return [
    'New map review',
    `Source: ${params.source}`,
    `Store: ${params.storeName ?? '-'}`,
    `Author: ${params.authorName ?? '-'}`,
    `Rating: ${ratingText}`,
    `Time: ${reviewTimeText}`,
    `Review ID: ${params.reviewId}`,
    '',
    params.reviewText,
  ].join('\n');
}

function callbackData(action: 'r' | 'd', reviewId: string): string {
  return `${REVIEW_CALLBACK_PREFIX}:${action}:${reviewId}`;
}

function buildReviewKeyboard(review: {
  id: string;
  source: ReviewSource;
  reviewUrl: string;
}): { inline_keyboard: Array<Array<Record<string, string>>> } {
  const openLabel = review.source === 'YANDEX' ? 'Open in Yandex' : 'Open in 2GIS';

  return {
    inline_keyboard: [
      [
        { text: 'Reply', callback_data: callbackData('r', review.id) },
        { text: 'Mark Done', callback_data: callbackData('d', review.id) },
      ],
      [{ text: openLabel, url: review.reviewUrl }],
    ],
  };
}

async function telegramApi<T>(method: string, payload: Record<string, unknown>): Promise<T> {
  const token = getTelegramBotToken();
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as { ok?: boolean; result?: T; description?: string };
  if (!response.ok || !data.ok || !data.result) {
    throw new Error(data.description || `Telegram API error: ${method}`);
  }

  return data.result;
}

type TelegramSendMessageResult = {
  message_id: number;
  chat?: {
    id?: number | string;
  };
};

async function sendReviewToTelegram(review: {
  id: string;
  source: ReviewSource;
  reviewUrl: string;
  reviewText: string;
  authorName: string | null;
  rating: number | null;
  reviewTime: Date | null;
  chatId: string;
  storeName?: string;
}): Promise<TelegramSendResult> {
  try {
    const result = await telegramApi<TelegramSendMessageResult>('sendMessage', {
      chat_id: review.chatId,
      text: buildReviewMessage({
        source: review.source,
        reviewText: review.reviewText,
        authorName: review.authorName ?? undefined,
        rating: review.rating ?? undefined,
        reviewTime: review.reviewTime ?? undefined,
        storeName: review.storeName,
        reviewId: review.id,
      }),
      reply_markup: buildReviewKeyboard({
        id: review.id,
        source: review.source,
        reviewUrl: review.reviewUrl,
      }),
      disable_web_page_preview: true,
    });

    return {
      ok: true,
      chatId: String(result.chat?.id ?? review.chatId),
      messageId: String(result.message_id),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Telegram send error';
    return { ok: false, error: message };
  }
}

export function parseReviewCallbackData(data: string): { action: 'reply' | 'done'; reviewId: string } | null {
  const match = /^rv:(r|d):([a-zA-Z0-9-]+)$/.exec(data);
  if (!match) {
    return null;
  }
  return {
    action: match[1] === 'r' ? 'reply' : 'done',
    reviewId: match[2],
  };
}

export function isTelegramUserAllowed(userId: string | number): boolean {
  const allowed = parseAllowedUserIds();
  if (allowed.size === 0) {
    return true;
  }
  return allowed.has(String(userId));
}

export async function ingestMapReview(input: IngestMapReviewInput): Promise<{
  created: boolean;
  reviewId: string;
  status: ReviewStatus;
  telegramSent: boolean;
}> {
  const source = normalizeSource(input.source);
  const externalReviewId = normalizeText(input.externalReviewId);
  const reviewUrl = normalizeText(input.reviewUrl);
  const reviewText = normalizeText(input.reviewText);

  if (!externalReviewId || !reviewUrl || !reviewText) {
    throw new Error('externalReviewId, reviewUrl and reviewText are required');
  }

  const reviewTime = parseDate(input.reviewTime);
  const chatId = normalizeText(input.chatId) || getDefaultChatId();
  const authorName = normalizeText(input.authorName) || null;
  const placeId = normalizeText(input.placeId) || null;
  const storeId = normalizeText(input.storeId) || null;
  const rating = Number.isFinite(input.rating) ? Math.max(1, Math.min(5, Math.round(input.rating as number))) : null;
  const rawPayload = input.rawPayload ? JSON.stringify(input.rawPayload) : null;

  let created = false;
  let review = await prisma.mapReview.findUnique({
    where: {
      source_externalReviewId: {
        source,
        externalReviewId,
      },
    },
    include: {
      store: {
        select: { name: true },
      },
    },
  });

  if (!review) {
    try {
      review = await prisma.mapReview.create({
        data: {
          source,
          externalReviewId,
          reviewUrl,
          reviewText,
          reviewTime,
          authorName,
          placeId,
          storeId,
          rating,
          rawPayload,
        },
        include: {
          store: {
            select: { name: true },
          },
        },
      });
      created = true;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
        throw error;
      }

      review = await prisma.mapReview.findUnique({
        where: {
          source_externalReviewId: {
            source,
            externalReviewId,
          },
        },
        include: {
          store: {
            select: { name: true },
          },
        },
      });
    }
  }

  if (!review) {
    throw new Error('Failed to persist review');
  }

  if (!created) {
    return {
      created: false,
      reviewId: review.id,
      status: review.status as ReviewStatus,
      telegramSent: false,
    };
  }

  const telegram = await sendReviewToTelegram({
    id: review.id,
    source,
    reviewUrl,
    reviewText,
    authorName,
    rating,
    reviewTime: reviewTime ?? null,
    chatId,
    storeName: review.store?.name,
  });

  await prisma.telegramNotification.create({
    data: {
      reviewId: review.id,
      chatId: telegram.chatId ?? chatId,
      messageId: telegram.messageId,
      deliveryStatus: telegram.ok ? 'SENT' : 'FAILED',
      errorDetails: telegram.ok ? null : telegram.error,
      sentAt: telegram.ok ? new Date() : null,
    },
  });

  const updated = await prisma.mapReview.update({
    where: { id: review.id },
    data: {
      status: telegram.ok ? 'NOTIFIED' : 'NEW',
    },
    select: { id: true, status: true },
  });

  return {
    created: true,
    reviewId: updated.id,
    status: updated.status as ReviewStatus,
    telegramSent: telegram.ok,
  };
}

export async function handleReviewCallbackAction(params: {
  reviewId: string;
  action: 'reply' | 'done';
  actorUserId: string;
  actorName?: string;
  chatId: string;
}): Promise<{ ok: boolean; message: string; reviewUrl?: string; source?: ReviewSource }> {
  const review = await prisma.mapReview.findUnique({
    where: { id: params.reviewId },
    select: {
      id: true,
      source: true,
      reviewUrl: true,
      status: true,
    },
  });

  if (!review) {
    return { ok: false, message: 'Review not found' };
  }

  const nextStatus = params.action === 'reply' ? 'REPLY_OPENED' : 'DONE';
  if (review.status !== 'DONE' || nextStatus === 'DONE') {
    await prisma.mapReview.update({
      where: { id: review.id },
      data: { status: nextStatus },
    });
  }

  await prisma.telegramNotification.create({
    data: {
      reviewId: review.id,
      chatId: params.chatId,
      deliveryStatus: 'SENT',
      errorDetails: JSON.stringify({
        event: 'callback',
        action: params.action,
        actorUserId: params.actorUserId,
        actorName: params.actorName ?? null,
      }),
      sentAt: new Date(),
    },
  });

  if (params.action === 'reply') {
    return {
      ok: true,
      message: 'Reply mode opened. Use Open button and post reply in official cabinet.',
      reviewUrl: review.reviewUrl,
      source: normalizeSource(review.source),
    };
  }

  return {
    ok: true,
    message: 'Review marked as DONE.',
    reviewUrl: review.reviewUrl,
    source: normalizeSource(review.source),
  };
}

export async function answerTelegramCallback(params: {
  callbackQueryId: string;
  text: string;
}): Promise<void> {
  await telegramApi('answerCallbackQuery', {
    callback_query_id: params.callbackQueryId,
    text: params.text,
    show_alert: false,
  });
}

export async function sendTelegramActionMessage(params: {
  chatId: string;
  text: string;
  reviewId: string;
  source: ReviewSource;
  reviewUrl: string;
}): Promise<void> {
  await telegramApi('sendMessage', {
    chat_id: params.chatId,
    text: params.text,
    reply_markup: buildReviewKeyboard({
      id: params.reviewId,
      source: params.source,
      reviewUrl: params.reviewUrl,
    }),
    disable_web_page_preview: true,
  });
}

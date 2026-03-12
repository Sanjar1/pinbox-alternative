import { NextRequest, NextResponse } from 'next/server';
import {
  answerTelegramCallback,
  handleReviewCallbackAction,
  isTelegramUserAllowed,
  parseReviewCallbackData,
  sendTelegramActionMessage,
} from '@/lib/reviews';

type TelegramUpdate = {
  callback_query?: {
    id?: string;
    data?: string;
    from?: {
      id?: number;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
    message?: {
      chat?: {
        id?: number | string;
      };
    };
  };
};

function checkWebhookSecret(request: NextRequest): boolean {
  const configured = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!configured) {
    return true;
  }
  const incoming = request.headers.get('x-telegram-bot-api-secret-token')?.trim() ?? '';
  return incoming === configured;
}

function displayName(from?: {
  username?: string;
  first_name?: string;
  last_name?: string;
}): string {
  const fullName = [from?.first_name, from?.last_name].filter(Boolean).join(' ').trim();
  if (fullName) {
    return fullName;
  }
  if (from?.username) {
    return `@${from.username}`;
  }
  return 'manager';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!checkWebhookSecret(request)) {
    return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const callback = update.callback_query;
  if (!callback?.id || !callback.data || !callback.from?.id || callback.message?.chat?.id == null) {
    return NextResponse.json({ ok: true });
  }

  if (!isTelegramUserAllowed(callback.from.id)) {
    await answerTelegramCallback({
      callbackQueryId: callback.id,
      text: 'You are not allowed to manage replies.',
    });
    return NextResponse.json({ ok: true });
  }

  const parsed = parseReviewCallbackData(callback.data);
  if (!parsed) {
    await answerTelegramCallback({
      callbackQueryId: callback.id,
      text: 'Unsupported action.',
    });
    return NextResponse.json({ ok: true });
  }

  const actorName = displayName(callback.from);
  const chatId = String(callback.message.chat.id);
  const result = await handleReviewCallbackAction({
    reviewId: parsed.reviewId,
    action: parsed.action,
    actorUserId: String(callback.from.id),
    actorName,
    chatId,
  });

  await answerTelegramCallback({
    callbackQueryId: callback.id,
    text: result.message,
  });

  if (result.ok && result.reviewUrl && result.source) {
    const actionText =
      parsed.action === 'reply'
        ? `${actorName} opened reply workflow for review ${parsed.reviewId}.`
        : `${actorName} marked review ${parsed.reviewId} as DONE.`;

    await sendTelegramActionMessage({
      chatId,
      text: actionText,
      reviewId: parsed.reviewId,
      source: result.source,
      reviewUrl: result.reviewUrl,
    });
  }

  return NextResponse.json({ ok: true });
}

export type FeedbackAlertInput = {
  storeName: string;
  rating: number;
  comment: string;
  contact: string;
  submittedAt: Date;
  // Optional free-text comment customer typed AFTER the structured vote.
  // When set, rendered on its own «...» line in addition to the breakdown.
  typedComment?: string;
};

type Breakdown = {
  service: number;
  quality: number;
  prices: number;
};

const RATINGS_PREFIX = '[ratings]';

export function parseRatingsBreakdown(comment: string): Breakdown | null {
  if (!comment.startsWith(RATINGS_PREFIX)) return null;
  const body = comment.slice(RATINGS_PREFIX.length).trim();
  const parts = Object.fromEntries(
    body.split(';').map((seg) => {
      const [k, v] = seg.split(':');
      return [k?.trim(), v?.trim()];
    }),
  );
  const service = Number.parseInt(parts.service ?? '', 10);
  const quality = Number.parseInt(parts.quality ?? '', 10);
  const prices = Number.parseInt(parts.prices ?? '', 10);
  // Values outside 1-5 mean a spoofed/typed "[ratings]" comment, not a real vote.
  if ([service, quality, prices].some((n) => !Number.isFinite(n) || n < 1 || n > 5)) return null;
  return { service, quality, prices };
}

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Asia/Tashkent',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatTashkentTimestamp(date: Date): string {
  const parts = dateFormatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('day')}.${get('month')}.${get('year')}, ${get('hour')}:${get('minute')}`;
}

export function buildMessage(input: FeedbackAlertInput): string {
  const breakdown = parseRatingsBreakdown(input.comment);
  const timestamp = formatTashkentTimestamp(input.submittedAt);

  // The comment line shows either: the explicit typedComment, OR a free-text
  // input.comment that did NOT parse as a structured [ratings] payload.
  const typedFromInput = breakdown ? '' : input.comment.trim();
  const commentToShow = (input.typedComment ?? '').trim() || typedFromInput;

  const lines: string[] = [
    '😞 Мы подвели клиента.',
    '',
    `📍 ${input.storeName}`,
    `⭐ Общая: ${input.rating}/5  •  ${timestamp}`,
  ];

  if (breakdown) {
    lines.push(`   Сервис: ${breakdown.service}/5`);
    lines.push(`   Качество: ${breakdown.quality}/5`);
    lines.push(`   Цены: ${breakdown.prices}/5`);
  }

  if (commentToShow) {
    lines.push('');
    lines.push(`💬 «${commentToShow}»`);
  }

  lines.push('');
  lines.push('Покупатель пришёл к нам — и ушёл разочарованным.');
  lines.push('Каждая такая оценка — это удар по репутации «KAAS Сырная Лавка».');
  lines.push('');
  lines.push('@sanjar676767 @Alijon_87 — кто работал в эту смену?');

  return lines.join('\n');
}

export function buildFollowUpCommentMessage(storeName: string, typedComment: string): string {
  return [
    `💬 По магазину «${storeName}» клиент дополнил отзыв:`,
    `«${typedComment.trim()}»`,
    '',
    '@sanjar676767 @Alijon_87',
  ].join('\n');
}

async function sendTelegram(message: string): Promise<void> {
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (webhookUrl) {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });
    if (!res.ok) {
      throw new Error(`telegram webhook ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    return;
  }

  if (botToken && chatId) {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    });
    if (!res.ok) {
      throw new Error(`telegram sendMessage ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
  }
}

async function sendEmail(message: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.ALERT_EMAIL_TO;

  if (!apiKey || !from || !to) {
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'New store feedback',
      text: message,
    }),
  });
  if (!res.ok) {
    throw new Error(`resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}

// Run both channels, then log every failure. allSettled never rejects, so
// without inspecting the results a dead bot token would be fully invisible.
async function sendAllChannels(tag: string, message: string): Promise<void> {
  const results = await Promise.allSettled([sendTelegram(message), sendEmail(message)]);
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`${tag} [${i === 0 ? 'telegram' : 'email'}]`, r.reason);
    }
  });
}

export async function sendFeedbackAlert(input: FeedbackAlertInput): Promise<void> {
  await sendAllChannels('feedback-notification-error', buildMessage(input));
}

export async function sendFollowUpComment(storeName: string, typedComment: string): Promise<void> {
  await sendAllChannels('feedback-followup-error', buildFollowUpCommentMessage(storeName, typedComment));
}

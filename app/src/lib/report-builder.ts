import { prisma } from './db';
import { VOTE_ROW_FILTER } from './feedback-filters';
import { formatGroupedReport, type StoreStat } from './report-format';

const TASHKENT_MS = 5 * 60 * 60 * 1000; // UTC+5

// Fetch every active store with its TM, plus its vote count/avg in [start,end).
async function fetchStoreStats(start: Date, end: Date): Promise<StoreStat[]> {
  const [stores, feedbacks] = await Promise.all([
    prisma.store.findMany({
      where: { archivedAt: null },
      select: { id: true, name: true, territorialManager: true },
    }),
    prisma.feedback.findMany({
      where: { createdAt: { gte: start, lt: end }, ...VOTE_ROW_FILTER },
      select: { rating: true, storeId: true },
    }),
  ]);

  const byStore = new Map<string, number[]>();
  for (const fb of feedbacks) {
    if (!byStore.has(fb.storeId)) byStore.set(fb.storeId, []);
    byStore.get(fb.storeId)!.push(fb.rating);
  }

  return stores.map((s) => {
    const ratings = byStore.get(s.id) ?? [];
    const count = ratings.length;
    const avg = count > 0 ? ratings.reduce((a, b) => a + b, 0) / count : 0;
    return { name: s.name, tm: s.territorialManager, count, avg };
  });
}

const TELEGRAM_MESSAGE_LIMIT = 4096;
const TELEGRAM_SAFE_LIMIT = 3900;

export type ReportCtx = { reqId: string; period: 'daily' | 'weekly' | 'monthly' };

// Short correlation id so every log line of one report request can be grepped together.
export function newReqId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// Single-line structured log. Every report log line carries tag:"reports" so it is
// trivially greppable in Railway logs: `railway logs | grep '"tag":"reports"'`.
export function reportLog(event: string, data: Record<string, unknown> = {}): void {
  try {
    console.log(JSON.stringify({ tag: 'reports', event, at: new Date().toISOString(), ...data }));
  } catch {
    // Logging must never throw and break a report. Fall back to a plain line.
    console.log(`[reports] ${event}`);
  }
}

function nowTashkent(): Date {
  return new Date(Date.now() + TASHKENT_MS);
}

function toUtc(tashkentDate: Date): Date {
  return new Date(tashkentDate.getTime() - TASHKENT_MS);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function truncateForTelegramLine(text: string): string {
  if (text.length <= TELEGRAM_SAFE_LIMIT - 100) return text;
  return text.slice(0, TELEGRAM_SAFE_LIMIT - 103) + '...';
}

type DateRange = { start: Date; end: Date; label: string };

export function getDailyRange(): DateRange {
  const t = nowTashkent();
  const endT = new Date(t);
  endT.setUTCHours(0, 0, 0, 0);

  const startT = new Date(endT);
  startT.setUTCDate(startT.getUTCDate() - 1);

  const day = startT.getUTCDate();
  const month = startT.toLocaleString('ru-RU', { month: 'long', timeZone: 'UTC' });
  return { start: toUtc(startT), end: toUtc(endT), label: `${day} ${month} ${startT.getUTCFullYear()}` };
}

export function getWeeklyRange(): DateRange {
  const t = nowTashkent();
  const todayT = new Date(t);
  todayT.setUTCHours(0, 0, 0, 0);
  const startT = new Date(todayT);
  startT.setUTCDate(startT.getUTCDate() - 7);
  const sd = startT.getUTCDate();
  const ed = todayT.getUTCDate() - 1;
  const sm = startT.toLocaleString('ru-RU', { month: 'long', timeZone: 'UTC' });
  const em = new Date(todayT.getTime() - 86400000).toLocaleString('ru-RU', { month: 'long', timeZone: 'UTC' });
  const label = sm === em ? `${sd}-${ed} ${sm} ${t.getUTCFullYear()}` : `${sd} ${sm} - ${ed} ${em} ${t.getUTCFullYear()}`;
  return { start: toUtc(startT), end: new Date(), label };
}

export function getMonthlyRange(): DateRange {
  const t = nowTashkent();
  const firstThisT = new Date(t);
  firstThisT.setUTCDate(1);
  firstThisT.setUTCHours(0, 0, 0, 0);
  const startT = new Date(firstThisT);
  startT.setUTCMonth(startT.getUTCMonth() - 1);
  const name = startT.toLocaleString('ru-RU', { month: 'long', timeZone: 'UTC' });
  const label = name.charAt(0).toUpperCase() + name.slice(1) + ' ' + startT.getUTCFullYear();
  return { start: toUtc(startT), end: toUtc(firstThisT), label };
}

async function buildDailyReportMessage(ctx: ReportCtx): Promise<string | string[]> {
  const { start, end, label } = getDailyRange();
  reportLog('range_computed', { ...ctx, start: start.toISOString(), end: end.toISOString(), label });

  const stats = await fetchStoreStats(start, end);
  const totalVotes = stats.reduce((n, s) => n + s.count, 0);
  reportLog('data_fetched', {
    ...ctx,
    activeStores: stats.length,
    totalVotes,
    storesWithVotes: stats.filter((s) => s.count > 0).length,
  });

  return formatGroupedReport('daily', label, stats);
}

function logMessageBuilt(ctx: ReportCtx, message: string | string[]): void {
  const parts = Array.isArray(message) ? message : [message];
  reportLog('message_built', {
    ...ctx,
    parts: parts.length,
    chars: parts.map((p) => p.length),
    totalChars: parts.reduce((sum, p) => sum + p.length, 0),
  });
}

export async function buildReportMessage(
  period: 'daily' | 'weekly' | 'monthly',
  ctx: ReportCtx = { reqId: newReqId(), period: 'daily' },
): Promise<string | string[]> {
  if (period === 'daily') {
    const message = await buildDailyReportMessage(ctx);
    logMessageBuilt(ctx, message);
    return message;
  }

  if (period === 'weekly') {
    const { start, end, label } = getWeeklyRange();
    reportLog('range_computed', { ...ctx, start: start.toISOString(), end: end.toISOString(), label });
    const stats = await fetchStoreStats(start, end);
    reportLog('data_fetched', { ...ctx, activeStores: stats.length, totalVotes: stats.reduce((n, s) => n + s.count, 0) });
    const message = formatGroupedReport('weekly', label, stats);
    logMessageBuilt(ctx, message);
    return message;
  }

  // monthly (unchanged table format)
  const range = getMonthlyRange();
  const { start, end, label } = range;
  reportLog('range_computed', { ...ctx, start: start.toISOString(), end: end.toISOString(), label });

  const feedbacks = await prisma.feedback.findMany({
    where: { createdAt: { gte: start, lt: end }, ...VOTE_ROW_FILTER },
    include: { store: { select: { name: true } } },
  });
  reportLog('data_fetched', { ...ctx, feedbackRows: feedbacks.length });

  const heading = `Отчет за ${label}`;

  if (feedbacks.length === 0) {
    const emptyMessage = `<b>${heading}</b>\n\nОтзывов за этот период не поступало.`;
    logMessageBuilt(ctx, emptyMessage);
    return emptyMessage;
  }

  const byStore = new Map<string, number[]>();
  for (const feedback of feedbacks) {
    const name = feedback.store.name;
    if (!byStore.has(name)) byStore.set(name, []);
    byStore.get(name)!.push(feedback.rating);
  }

  const sortedRows = Array.from(byStore.entries())
    .map(([name, ratings]) => ({
      name,
      count: ratings.length,
      avg: ratings.reduce((a, b) => a + b, 0) / ratings.length,
    }))
    .sort((a, b) => {
      // Business priority: more votes first, then higher average score.
      if (b.count !== a.count) return b.count - a.count;
      return b.avg - a.avg;
    });

  const totalReviews = sortedRows.reduce((sum, row) => sum + row.count, 0);
  const nameWidth = 23;

  const lines = sortedRows.map((row) => {
    const escapedName = escapeHtml(row.name);
    const name = escapedName.length > nameWidth ? escapedName.slice(0, nameWidth - 1) + '...' : escapedName.padEnd(nameWidth);
    const count = String(row.count).padStart(5);
    const avg = `* ${row.avg.toFixed(1)}`;
    return `${name}${count}   ${avg}`;
  });

  const divider = '-'.repeat(nameWidth + 12);
  const header = `${'Магазин'.padEnd(nameWidth)}${'Шт.'.padStart(5)}   Рейтинг`;
  const table = [header, divider, ...lines, divider, `Итого: ${totalReviews} отзывов по ${sortedRows.length} магазинам`].join('\n');

  const tableMessage = `<b>${heading}</b>\n\n<pre>${table}</pre>`;
  logMessageBuilt(ctx, tableMessage);
  return tableMessage;
}

export async function sendTelegramReport(
  message: string | string[],
  ctx: ReportCtx = { reqId: newReqId(), period: 'daily' },
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  // Log presence (never values) so a misconfigured env is obvious in logs.
  reportLog('telegram_config', {
    ...ctx,
    hasToken: Boolean(token),
    hasChatId: Boolean(chatId),
  });
  if (!token || !chatId) throw new Error('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured');

  const messages = Array.isArray(message) ? message : [message];
  reportLog('telegram_send_start', { ...ctx, parts: messages.length });

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.length > TELEGRAM_MESSAGE_LIMIT) {
      reportLog('telegram_part_too_long', { ...ctx, part: i + 1, chars: msg.length });
      throw new Error(`Telegram message too long: ${msg.length} characters`);
    }

    reportLog('telegram_part_send', { ...ctx, part: i + 1, of: messages.length, chars: msg.length });
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML' }),
    });

    if (!res.ok) {
      const body = await res.text();
      reportLog('telegram_part_error', { ...ctx, part: i + 1, status: res.status, body: body.slice(0, 500) });
      throw new Error(`Telegram error ${res.status}: ${body}`);
    }
    reportLog('telegram_part_ok', { ...ctx, part: i + 1, status: res.status });
  }

  reportLog('telegram_send_done', { ...ctx, parts: messages.length });
}

export function checkApiKey(req: Request): boolean {
  const key = process.env.REPORTS_API_KEY;
  if (!key) return false;
  const auth = req.headers.get('authorization') ?? '';
  return auth === `Bearer ${key}`;
}
